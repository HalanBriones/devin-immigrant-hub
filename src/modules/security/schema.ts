import { index, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";

export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: serial("id").primaryKey(),
    bucket: text("bucket").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rate_limit_events_bucket_idx").on(table.bucket, table.createdAt)],
);

export const authEvents = pgTable(
  "auth_events",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    outcome: text("outcome").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("auth_events_user_idx").on(table.userId, table.createdAt),
    index("auth_events_kind_idx").on(table.kind, table.createdAt),
  ],
);
