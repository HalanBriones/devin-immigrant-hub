"use server";

import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { sessions, users, verificationTokens } from "@/modules/auth/schema";
import { profiles } from "@/modules/profiles/schema";
import { generateUniqueHandle } from "@/modules/profiles/handles";
import { awardReputation, REPUTATION_REWARDS } from "@/modules/profiles/reputation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroyOtherSessions,
  destroySession,
  getCurrentUser,
} from "@/lib/auth/session";
import { expiresIn, generateNumericCode, generateToken, hashToken } from "@/lib/auth/tokens";
import { emailSender } from "@/lib/notify/email";
import { smsSender } from "@/lib/notify/sms";
import { fieldErrorsOf, type ActionState } from "@/lib/forms";
import { recordAuthEvent } from "@/modules/security/audit";
import {
  clearRateLimit,
  clientIp,
  isRateLimited,
  RATE_LIMITS,
  TOO_MANY_ATTEMPTS,
} from "@/modules/security/rate-limit";
import {
  confirmPhoneSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  startPhoneVerificationSchema,
} from "@/modules/auth/validation";

const EMAIL_TOKEN_TTL_MINUTES = 60 * 24;
const PASSWORD_RESET_TTL_MINUTES = 60;
const PHONE_CODE_TTL_MINUTES = 15;

function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

async function issueEmailVerification(userId: string, email: string): Promise<void> {
  const token = generateToken();
  await db.insert(verificationTokens).values({
    userId,
    kind: "email",
    tokenHash: hashToken(token),
    destination: email,
    expiresAt: expiresIn(EMAIL_TOKEN_TTL_MINUTES),
  });

  await emailSender.send({
    to: email,
    subject: "Verify your email — Immigrant Community Hub",
    body: `Confirm your email to earn your verified badge:\n${appUrl(`/verify/email?token=${token}`)}`,
  });
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const submitted = {
    email: String(formData.get("email") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  };
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values: submitted };
  }

  const ip = await clientIp();
  if (await isRateLimited(RATE_LIMITS.register, [`register:ip:${ip}`])) {
    await recordAuthEvent({ kind: "register", outcome: "blocked", detail: parsed.data.email });
    return { error: TOO_MANY_ATTEMPTS, values: submitted };
  }

  const { email, password, displayName } = parsed.data;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return {
      fieldErrors: { email: "An account with this email already exists" },
      values: submitted,
    };
  }

  const handle = await generateUniqueHandle(displayName);
  const passwordHash = await hashPassword(password);

  const userId = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ email, passwordHash }).returning({
      id: users.id,
    });
    await tx.insert(profiles).values({ userId: user.id, handle, displayName });
    return user.id;
  });

  await issueEmailVerification(userId, email);
  await recordAuthEvent({ kind: "register", outcome: "success", userId });
  await createSession(userId);
  redirect("/onboarding");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const ip = await clientIp();
  const emailBucket = `login:email:${parsed.data.email}`;
  if (await isRateLimited(RATE_LIMITS.login, [`login:ip:${ip}`, emailBucket])) {
    await recordAuthEvent({ kind: "login", outcome: "blocked", detail: parsed.data.email });
    return { error: TOO_MANY_ATTEMPTS };
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.email, parsed.data.email), isNull(users.deletedAt)))
    .limit(1);

  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    await recordAuthEvent({
      kind: "login",
      outcome: "failure",
      userId: user?.id,
      detail: parsed.data.email,
    });
    return { error: "Incorrect email or password" };
  }

  await clearRateLimit(emailBucket);
  await recordAuthEvent({ kind: "login", outcome: "success", userId: user.id });
  await createSession(user.id);
  redirect("/feed");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) await recordAuthEvent({ kind: "logout", outcome: "success", userId: user.id });
  await destroySession();
  redirect("/login");
}

export async function signOutOtherSessionsAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const revoked = await destroyOtherSessions(user.id);
  await recordAuthEvent({
    kind: "sessions_revoked",
    outcome: "success",
    userId: user.id,
    detail: `${revoked} session(s)`,
  });

  return {
    success:
      revoked > 0
        ? `Signed out ${revoked} other ${revoked === 1 ? "device" : "devices"}`
        : "No other devices were signed in",
  };
}

export async function resendEmailVerificationAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };
  if (user.emailVerified) return { success: "Your email is already verified" };

  if (
    await isRateLimited(RATE_LIMITS.emailVerification, [`email-verification:user:${user.id}`])
  ) {
    await recordAuthEvent({
      kind: "email_verification_sent",
      outcome: "blocked",
      userId: user.id,
    });
    return { error: TOO_MANY_ATTEMPTS };
  }

  await issueEmailVerification(user.id, user.email);
  await recordAuthEvent({
    kind: "email_verification_sent",
    outcome: "success",
    userId: user.id,
  });
  return { success: "Verification link sent — check your inbox" };
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, hashToken(token)),
        eq(verificationTokens.kind, "email"),
        isNull(verificationTokens.consumedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!record) return false;

  const [user] = await db
    .select({ emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, record.userId))
    .limit(1);
  if (!user) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(eq(verificationTokens.id, record.id));
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, record.userId));
  });

  if (!user.emailVerifiedAt) {
    await awardReputation(record.userId, "verification", REPUTATION_REWARDS.emailVerified, {
      type: "email_verification",
      id: record.id,
    });
  }
  await recordAuthEvent({ kind: "email_verified", outcome: "success", userId: record.userId });
  return true;
}

export async function startPhoneVerificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = startPhoneVerificationSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  if (await isRateLimited(RATE_LIMITS.phoneCodeRequest, [`phone-code:user:${user.id}`])) {
    await recordAuthEvent({ kind: "phone_code_sent", outcome: "blocked", userId: user.id });
    return { error: TOO_MANY_ATTEMPTS };
  }

  const code = generateNumericCode();
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ phone: parsed.data.phone, phoneVerifiedAt: null })
      .where(eq(users.id, user.id));
    await tx.insert(verificationTokens).values({
      userId: user.id,
      kind: "phone",
      tokenHash: hashToken(code),
      destination: parsed.data.phone,
      expiresAt: expiresIn(PHONE_CODE_TTL_MINUTES),
    });
  });

  await smsSender.send({
    to: parsed.data.phone,
    body: `Your Immigrant Community Hub verification code is ${code}`,
  });

  await clearRateLimit(`phone-confirm:user:${user.id}`);
  await recordAuthEvent({ kind: "phone_code_sent", outcome: "success", userId: user.id });

  if (user.handle) revalidatePath(`/u/${user.handle}`);
  return { success: "We sent you a 6-digit code" };
}

export async function confirmPhoneVerificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = confirmPhoneSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const attemptBucket = `phone-confirm:user:${user.id}`;
  if (await isRateLimited(RATE_LIMITS.phoneCodeAttempt, [attemptBucket])) {
    await db
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(verificationTokens.userId, user.id),
          eq(verificationTokens.kind, "phone"),
          isNull(verificationTokens.consumedAt),
        ),
      );
    await recordAuthEvent({ kind: "phone_verified", outcome: "blocked", userId: user.id });
    return { error: "Too many wrong codes. Request a new one." };
  }

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.userId, user.id),
        eq(verificationTokens.kind, "phone"),
        eq(verificationTokens.tokenHash, hashToken(parsed.data.code)),
        isNull(verificationTokens.consumedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!record) {
    await recordAuthEvent({ kind: "phone_verified", outcome: "failure", userId: user.id });
    return { error: "That code is invalid or has expired" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(eq(verificationTokens.id, record.id));
    await tx
      .update(users)
      .set({ phoneVerifiedAt: new Date(), phone: record.destination })
      .where(eq(users.id, user.id));
  });

  if (!user.phoneVerified) {
    await awardReputation(user.id, "verification", REPUTATION_REWARDS.phoneVerified, {
      type: "phone_verification",
      id: record.id,
    });
  }

  await clearRateLimit(attemptBucket);
  await recordAuthEvent({ kind: "phone_verified", outcome: "success", userId: user.id });

  if (user.handle) revalidatePath(`/u/${user.handle}`);
  return { success: "Phone number verified" };
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const resetIp = await clientIp();
  const limited = await isRateLimited(RATE_LIMITS.passwordReset, [
    `password-reset:ip:${resetIp}`,
    `password-reset:email:${parsed.data.email}`,
  ]);

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, parsed.data.email), isNull(users.deletedAt)))
    .limit(1);

  await recordAuthEvent({
    kind: "password_reset_requested",
    outcome: limited ? "blocked" : "success",
    userId: user?.id,
    detail: parsed.data.email,
  });

  if (user && !limited) {
    const token = generateToken();
    await db.insert(verificationTokens).values({
      userId: user.id,
      kind: "password_reset",
      tokenHash: hashToken(token),
      destination: parsed.data.email,
      expiresAt: expiresIn(PASSWORD_RESET_TTL_MINUTES),
    });
    await emailSender.send({
      to: parsed.data.email,
      subject: "Reset your password — Immigrant Community Hub",
      body: `Reset your password with this link (valid for 1 hour):\n${appUrl(
        `/reset-password?token=${token}`,
      )}`,
    });
  }

  return {
    success: "If an account exists for that email, we've sent reset instructions",
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, hashToken(parsed.data.token)),
        eq(verificationTokens.kind, "password_reset"),
        isNull(verificationTokens.consumedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!record) {
    return { error: "This reset link is invalid or has expired" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.transaction(async (tx) => {
    await tx
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(eq(verificationTokens.id, record.id));
    await tx.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
    await tx.delete(sessions).where(eq(sessions.userId, record.userId));
  });

  await recordAuthEvent({
    kind: "password_reset_completed",
    outcome: "success",
    userId: record.userId,
  });

  redirect("/login?reset=1");
}
