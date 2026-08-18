import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users } from "@/modules/auth/schema";
import { profiles } from "@/modules/profiles/schema";
import { expiresIn, generateToken, hashToken } from "@/lib/auth/tokens";

export const SESSION_COOKIE = "ich_session";
const SESSION_TTL_MINUTES = 60 * 24 * 14;

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = expiresIn(SESSION_TTL_MINUTES);

  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Signs out every other device by deleting all sessions except the caller's own. */
export async function destroyOtherSessions(userId: string): Promise<number> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  const removed = await db
    .delete(sessions)
    .where(
      token
        ? and(eq(sessions.userId, userId), ne(sessions.tokenHash, hashToken(token)))
        : eq(sessions.userId, userId),
    )
    .returning({ id: sessions.id });

  return removed.length;
}

export async function countSessions(userId: string): Promise<number> {
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())));
  return rows.length;
}

export type CurrentUser = {
  id: string;
  email: string;
  role: "user" | "moderator" | "admin";
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  reputationScore: number;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      phone: users.phone,
      phoneVerifiedAt: users.phoneVerifiedAt,
      handle: profiles.handle,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      reputationScore: profiles.reputationScore,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date()),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    emailVerified: row.emailVerifiedAt !== null,
    phone: row.phone,
    phoneVerified: row.phoneVerifiedAt !== null,
    handle: row.handle,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    reputationScore: row.reputationScore ?? 0,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
