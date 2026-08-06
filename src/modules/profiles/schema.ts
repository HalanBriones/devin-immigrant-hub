import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";
import { cities, interests, languages, provinces } from "@/modules/geo/schema";

export const reputationSource = pgEnum("reputation_source", [
  "post_liked",
  "helpful_comment",
  "listing_completed",
  "account_age",
  "verification",
  "penalty",
]);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  countryOfOrigin: varchar("country_of_origin", { length: 2 }),
  provinceCode: varchar("province_code", { length: 2 }).references(() => provinces.code),
  cityId: integer("city_id").references(() => cities.id),
  occupation: text("occupation"),
  reputationScore: integer("reputation_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profileLanguages = pgTable(
  "profile_languages",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    languageCode: varchar("language_code", { length: 8 })
      .notNull()
      .references(() => languages.code),
  },
  (table) => [primaryKey({ columns: [table.userId, table.languageCode] })],
);

export const profileInterests = pgTable(
  "profile_interests",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    interestId: integer("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.interestId] })],
);

export const reputationEvents = pgTable(
  "reputation_events",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: reputationSource("source").notNull(),
    delta: integer("delta").notNull(),
    refType: text("ref_type"),
    refId: text("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("reputation_events_user_idx").on(table.userId)],
);
