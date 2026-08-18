import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";
import { comments, posts } from "@/modules/communities/schema";
import { events } from "@/modules/events/schema";
import { listings } from "@/modules/marketplace/schema";

/**
 * Uploaded images. Lives in its own module so the owning tables (posts,
 * comments, events, listings) can be imported here without their schemas
 * having to import each other.
 */
export const attachments = pgTable(
  "attachments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").references(() => posts.id, {
      onDelete: "cascade",
    }),
    commentId: integer("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    eventId: integer("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    listingId: integer("listing_id").references(() => listings.id, {
      onDelete: "cascade",
    }),
    avatarUserId: uuid("avatar_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    fileName: text("file_name").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("attachments_post_idx").on(table.postId),
    index("attachments_comment_idx").on(table.commentId),
    index("attachments_event_idx").on(table.eventId),
    index("attachments_listing_idx").on(table.listingId),
    index("attachments_uploader_idx").on(table.uploadedBy),
    check(
      "attachments_single_owner",
      sql`num_nonnulls(${table.postId}, ${table.commentId}, ${table.eventId}, ${table.listingId}, ${table.avatarUserId}) = 1`,
    ),
  ],
);
