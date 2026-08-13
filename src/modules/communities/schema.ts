import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/auth/schema";
import { cities, provinces } from "@/modules/geo/schema";
import { profiles } from "@/modules/profiles/schema";

export const communityKind = pgEnum("community_kind", [
  "province",
  "city",
  "origin",
  "topic",
]);
export const communityRole = pgEnum("community_role", ["member", "moderator"]);
export const postType = pgEnum("post_type", [
  "question",
  "info",
  "event",
  "service",
]);

export const communities = pgTable(
  "communities",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    kind: communityKind("kind").notNull(),
    provinceCode: varchar("province_code", { length: 2 }).references(
      () => provinces.code,
    ),
    cityId: integer("city_id").references(() => cities.id),
    countryOfOrigin: varchar("country_of_origin", { length: 2 }),
    tags: text("tags").array().notNull().default([]),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    memberCount: integer("member_count").notNull().default(0),
    postCount: integer("post_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("communities_kind_idx").on(table.kind)],
);

export const communityMembers = pgTable(
  "community_members",
  {
    communityId: integer("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    role: communityRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.communityId, table.userId] }),
    index("community_members_user_idx").on(table.userId),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    communityId: integer("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    type: postType("type").notNull().default("info"),
    score: integer("score").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_community_created_idx").on(table.communityId, table.createdAt),
    index("posts_author_idx").on(table.authorId),
    index("posts_type_idx").on(table.type),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("comments_post_created_idx").on(table.postId, table.createdAt),
  ],
);

export const postVotes = pgTable(
  "post_votes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);
