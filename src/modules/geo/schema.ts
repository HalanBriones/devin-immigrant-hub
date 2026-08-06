import { pgTable, serial, text, varchar, uniqueIndex } from "drizzle-orm/pg-core";

export const provinces = pgTable("provinces", {
  code: varchar("code", { length: 2 }).primaryKey(),
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr").notNull(),
});

export const cities = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),
    provinceCode: varchar("province_code", { length: 2 })
      .notNull()
      .references(() => provinces.code),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [uniqueIndex("cities_province_slug_idx").on(table.provinceCode, table.slug)],
);

export const languages = pgTable("languages", {
  code: varchar("code", { length: 8 }).primaryKey(),
  nameEn: text("name_en").notNull(),
});

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
});
