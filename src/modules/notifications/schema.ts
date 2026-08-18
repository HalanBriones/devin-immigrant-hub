import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { comments, posts } from "@/modules/communities/schema";
import { events } from "@/modules/events/schema";
import { profiles } from "@/modules/profiles/schema";

export const notificationKind = pgEnum("notification_kind", [
  "post_comment",
  "post_upvote",
  "event_rsvp",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => profiles.userId, {
      onDelete: "cascade",
    }),
    kind: notificationKind("kind").notNull(),
    postId: integer("post_id").references(() => posts.id, {
      onDelete: "cascade",
    }),
    commentId: integer("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    eventId: integer("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_unread_idx").on(table.userId, table.readAt),
  ],
);
