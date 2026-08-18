import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";
import { profiles } from "@/modules/profiles/schema";

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    locationName: text("location_name").notNull(),
    cityName: text("city_name").notNull(),
    tags: text("tags").array().notNull().default([]),
    attendeeCount: integer("attendee_count").notNull().default(0),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    removedBy: uuid("removed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("events_starts_at_idx").on(table.startsAt),
    index("events_host_idx").on(table.hostId),
  ],
);

export const eventAttendees = pgTable(
  "event_attendees",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.userId] }),
    index("event_attendees_user_idx").on(table.userId),
  ],
);
