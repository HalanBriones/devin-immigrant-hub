import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { posts } from "@/modules/communities/schema";
import { events } from "@/modules/events/schema";
import { notifications } from "@/modules/notifications/schema";
import { profiles } from "@/modules/profiles/schema";

export type NotificationItem = {
  id: number;
  kind: "post_comment" | "post_upvote" | "event_rsvp";
  actorName: string | null;
  actorHandle: string | null;
  postId: number | null;
  postTitle: string | null;
  eventId: number | null;
  eventTitle: string | null;
  read: boolean;
  createdAt: Date;
};

export async function countUnreadNotifications(userId: string): Promise<number> {
  const [row] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.unread ?? 0;
}

export async function listNotifications(
  userId: string,
  limit = 50,
): Promise<NotificationItem[]> {
  const rows = await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      actorName: profiles.displayName,
      actorHandle: profiles.handle,
      postId: notifications.postId,
      postTitle: posts.title,
      eventId: notifications.eventId,
      eventTitle: events.title,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .leftJoin(profiles, eq(profiles.userId, notifications.actorId))
    .leftJoin(posts, eq(posts.id, notifications.postId))
    .leftJoin(events, eq(events.id, notifications.eventId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map(({ readAt, ...row }) => ({ ...row, read: readAt !== null }));
}
