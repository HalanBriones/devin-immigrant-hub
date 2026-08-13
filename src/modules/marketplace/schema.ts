import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { communities } from "@/modules/communities/schema";
import { cities, provinces } from "@/modules/geo/schema";
import { profiles } from "@/modules/profiles/schema";

export const listingCategory = pgEnum("listing_category", [
  "housing",
  "jobs",
  "buy_sell",
  "services",
]);

export const listingStatus = pgEnum("listing_status", ["active", "closed"]);

export const listings = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    category: listingCategory("category").notNull(),
    status: listingStatus("status").notNull().default("active"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priceCents: integer("price_cents"),
    provinceCode: varchar("province_code", { length: 2 })
      .notNull()
      .references(() => provinces.code),
    cityId: integer("city_id").references(() => cities.id),
    communityId: integer("community_id").references(() => communities.id, {
      onDelete: "set null",
    }),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("listings_created_idx").on(table.createdAt),
    index("listings_category_idx").on(table.category),
    index("listings_province_idx").on(table.provinceCode),
    index("listings_city_idx").on(table.cityId),
    index("listings_community_idx").on(table.communityId),
    index("listings_seller_idx").on(table.sellerId),
  ],
);
