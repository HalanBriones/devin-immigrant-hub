import { db } from "@/db/client";
import { notifications } from "@/modules/notifications/schema";

type NewNotification = {
  userId: string;
  actorId: string;
  kind: "post_comment" | "post_upvote" | "event_rsvp";
  postId?: number;
  commentId?: number;
  eventId?: number;
};

/** Records a notification unless the actor is the recipient; never breaks the caller. */
export async function notify(params: NewNotification): Promise<void> {
  if (params.userId === params.actorId) return;

  try {
    await db.insert(notifications).values({
      userId: params.userId,
      actorId: params.actorId,
      kind: params.kind,
      postId: params.postId ?? null,
      commentId: params.commentId ?? null,
      eventId: params.eventId ?? null,
    });
  } catch (error) {
    console.error("Failed to create notification", params.kind, error);
  }
}
