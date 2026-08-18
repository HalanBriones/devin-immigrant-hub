import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { rateLimitEvents } from "@/modules/security/schema";

export type RateLimitRule = { limit: number; windowMinutes: number };

export const RATE_LIMITS = {
  login: { limit: 10, windowMinutes: 15 },
  register: { limit: 5, windowMinutes: 60 },
  passwordReset: { limit: 5, windowMinutes: 60 },
  emailVerification: { limit: 5, windowMinutes: 60 },
  phoneCodeRequest: { limit: 5, windowMinutes: 60 },
  phoneCodeAttempt: { limit: 5, windowMinutes: 15 },
  report: { limit: 20, windowMinutes: 60 },
} as const satisfies Record<string, RateLimitRule>;

const RETENTION_MINUTES = 24 * 60;

/** Best-effort client address; behind a proxy the first X-Forwarded-For hop is used. */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return store.get("x-real-ip") ?? "unknown";
}

export async function clientUserAgent(): Promise<string | null> {
  const store = await headers();
  return store.get("user-agent");
}

function since(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

/**
 * Counts an attempt against a bucket and reports whether the caller is over the limit.
 * Buckets are plain strings, e.g. `login:ip:1.2.3.4` or `login:email:a@b.ca`.
 */
export async function hitRateLimit(bucket: string, rule: RateLimitRule): Promise<boolean> {
  await db.insert(rateLimitEvents).values({ bucket });

  const [row] = await db
    .select({ hits: count() })
    .from(rateLimitEvents)
    .where(
      and(eq(rateLimitEvents.bucket, bucket), gt(rateLimitEvents.createdAt, since(rule.windowMinutes))),
    );

  if (Math.random() < 0.02) {
    await db.delete(rateLimitEvents).where(lt(rateLimitEvents.createdAt, since(RETENTION_MINUTES)));
  }

  return row.hits > rule.limit;
}

export async function clearRateLimit(bucket: string): Promise<void> {
  await db.delete(rateLimitEvents).where(eq(rateLimitEvents.bucket, bucket));
}

/** Applies every bucket for an action and returns true when any of them is exhausted. */
export async function isRateLimited(
  rule: RateLimitRule,
  buckets: string[],
): Promise<boolean> {
  const results = await Promise.all(buckets.map((bucket) => hitRateLimit(bucket, rule)));
  return results.some(Boolean);
}

export const TOO_MANY_ATTEMPTS = "Too many attempts. Wait a few minutes and try again.";
