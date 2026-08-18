import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { comments, posts } from "@/modules/communities/schema";
import { events } from "@/modules/events/schema";
import { listings } from "@/modules/marketplace/schema";
import { reports } from "@/modules/moderation/schema";
import { profiles } from "@/modules/profiles/schema";

export type OpenReport = {
  id: number;
  targetType: "post" | "comment" | "listing" | "event";
  targetId: number;
  reason: string;
  createdAt: Date;
  reporterHandle: string;
  targetExcerpt: string | null;
  targetRemoved: boolean;
};

async function targetPreview(
  targetType: OpenReport["targetType"],
  targetId: number,
): Promise<{ excerpt: string | null; removed: boolean }> {
  if (targetType === "post") {
    const [row] = await db
      .select({ text: posts.title, removedAt: posts.removedAt })
      .from(posts)
      .where(eq(posts.id, targetId))
      .limit(1);
    return { excerpt: row?.text ?? null, removed: Boolean(row?.removedAt) };
  }
  if (targetType === "comment") {
    const [row] = await db
      .select({ text: comments.body, removedAt: comments.removedAt })
      .from(comments)
      .where(eq(comments.id, targetId))
      .limit(1);
    return { excerpt: row?.text ?? null, removed: Boolean(row?.removedAt) };
  }
  if (targetType === "listing") {
    const [row] = await db
      .select({ text: listings.title, removedAt: listings.removedAt })
      .from(listings)
      .where(eq(listings.id, targetId))
      .limit(1);
    return { excerpt: row?.text ?? null, removed: Boolean(row?.removedAt) };
  }
  const [row] = await db
    .select({ text: events.title, removedAt: events.removedAt })
    .from(events)
    .where(eq(events.id, targetId))
    .limit(1);
  return { excerpt: row?.text ?? null, removed: Boolean(row?.removedAt) };
}

export async function listOpenReports(): Promise<OpenReport[]> {
  const rows = await db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      reason: reports.reason,
      createdAt: reports.createdAt,
      reporterHandle: profiles.handle,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.userId, reports.reporterId))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(100);

  return Promise.all(
    rows.map(async (row) => {
      const preview = await targetPreview(row.targetType, row.targetId);
      return {
        ...row,
        targetExcerpt: preview.excerpt,
        targetRemoved: preview.removed,
      };
    }),
  );
}
