import { db } from "@/db/client";
import { clientIp, clientUserAgent } from "@/modules/security/rate-limit";
import { authEvents } from "@/modules/security/schema";

export type AuthEventKind =
  | "login"
  | "logout"
  | "register"
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_verified"
  | "email_verification_sent"
  | "phone_code_sent"
  | "phone_verified"
  | "sessions_revoked"
  | "content_removed"
  | "content_reported";

export type AuthEventOutcome = "success" | "failure" | "blocked";

export async function recordAuthEvent(params: {
  kind: AuthEventKind;
  outcome: AuthEventOutcome;
  userId?: string | null;
  detail?: string;
}): Promise<void> {
  try {
    const [ipAddress, userAgent] = await Promise.all([clientIp(), clientUserAgent()]);
    await db.insert(authEvents).values({
      userId: params.userId ?? null,
      kind: params.kind,
      outcome: params.outcome,
      ipAddress,
      userAgent,
      detail: params.detail ?? null,
    });
  } catch (error) {
    console.error("Failed to record auth event", params.kind, error);
  }
}
