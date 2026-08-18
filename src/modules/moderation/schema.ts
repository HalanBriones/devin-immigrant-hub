import { index, integer, pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";

export const reportTargetType = pgEnum("report_target_type", [
  "post",
  "comment",
  "listing",
  "event",
]);

export const reportStatus = pgEnum("report_status", [
  "open",
  "actioned",
  "dismissed",
]);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: reportTargetType("target_type").notNull(),
    targetId: integer("target_id").notNull(),
    reason: text("reason").notNull(),
    status: reportStatus("status").notNull().default("open"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reports_status_idx").on(table.status, table.createdAt),
    index("reports_target_idx").on(table.targetType, table.targetId),
    index("reports_reporter_idx").on(table.reporterId),
  ],
);
