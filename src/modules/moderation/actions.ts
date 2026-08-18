"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionState } from "@/lib/forms";
import { comments, posts } from "@/modules/communities/schema";
import { events } from "@/modules/events/schema";
import { listings } from "@/modules/marketplace/schema";
import { isModerator } from "@/modules/moderation/roles";
import { reports } from "@/modules/moderation/schema";
import { recordAuthEvent } from "@/modules/security/audit";
import { isRateLimited, RATE_LIMITS, TOO_MANY_ATTEMPTS } from "@/modules/security/rate-limit";

const TARGETS = ["post", "comment", "listing", "event"] as const;
type Target = (typeof TARGETS)[number];

const reportSchema = z.object({
  targetType: z.enum(TARGETS),
  targetId: z.coerce.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(10, "Tell us what is wrong in at least 10 characters")
    .max(500),
});

export async function reportContentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  if (await isRateLimited(RATE_LIMITS.report, [`report:user:${user.id}`])) {
    return { error: TOO_MANY_ATTEMPTS };
  }

  const [existing] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, user.id),
        eq(reports.targetType, parsed.data.targetType),
        eq(reports.targetId, parsed.data.targetId),
        eq(reports.status, "open"),
      ),
    )
    .limit(1);
  if (existing) return { success: "Thanks — you already reported this" };

  await db.insert(reports).values({
    reporterId: user.id,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
  });
  await recordAuthEvent({
    kind: "content_reported",
    outcome: "success",
    userId: user.id,
    detail: `${parsed.data.targetType}#${parsed.data.targetId}`,
  });

  return { success: "Report sent to the moderators" };
}

async function removeTarget(
  targetType: Target,
  targetId: number,
  moderatorId: string,
): Promise<void> {
  const removal = { removedAt: new Date(), removedBy: moderatorId };
  if (targetType === "post") {
    await db.update(posts).set(removal).where(eq(posts.id, targetId));
  } else if (targetType === "comment") {
    await db.update(comments).set(removal).where(eq(comments.id, targetId));
  } else if (targetType === "listing") {
    await db.update(listings).set(removal).where(eq(listings.id, targetId));
  } else {
    await db.update(events).set(removal).where(eq(events.id, targetId));
  }
}

const reviewSchema = z.object({
  reportId: z.coerce.number().int().positive(),
  decision: z.enum(["remove", "dismiss"]),
});

export async function reviewReportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!isModerator(user)) return { error: "Moderators only" };

  const parsed = reviewSchema.safeParse({
    reportId: formData.get("reportId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { error: "Invalid moderation request" };

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, parsed.data.reportId), eq(reports.status, "open")))
    .limit(1);
  if (!report) return { error: "That report was already handled" };

  if (parsed.data.decision === "remove") {
    await removeTarget(report.targetType, report.targetId, user.id);
    await recordAuthEvent({
      kind: "content_removed",
      outcome: "success",
      userId: user.id,
      detail: `${report.targetType}#${report.targetId}`,
    });
  }

  await db
    .update(reports)
    .set({
      status: parsed.data.decision === "remove" ? "actioned" : "dismissed",
      reviewedBy: user.id,
      reviewedAt: new Date(),
    })
    .where(eq(reports.id, report.id));

  revalidatePath("/moderation");
  revalidatePath("/feed");
  revalidatePath("/");
  return {
    success:
      parsed.data.decision === "remove" ? "Content removed" : "Report dismissed",
  };
}

/** Authors can take their own content down without involving a moderator. */
export async function deleteOwnPostAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(postId)) return;

  await db
    .update(posts)
    .set({ removedAt: new Date(), removedBy: user.id })
    .where(and(eq(posts.id, postId), eq(posts.authorId, user.id), isNull(posts.removedAt)));

  revalidatePath("/feed");
  revalidatePath("/");
  revalidatePath(`/p/${postId}`);
}
