ALTER TABLE "listings" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DELETE FROM "listings" WHERE "category" IN ('jobs', 'services');--> statement-breakpoint
DROP TYPE "public"."listing_category";--> statement-breakpoint
CREATE TYPE "public"."listing_category" AS ENUM('housing', 'buy_sell');--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "category" SET DATA TYPE "public"."listing_category" USING "category"::"public"."listing_category";