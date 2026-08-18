CREATE TYPE "public"."listing_category" AS ENUM('housing', 'jobs', 'buy_sell', 'services');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'closed');--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" uuid NOT NULL,
	"category" "listing_category" NOT NULL,
	"status" "listing_status" DEFAULT 'active' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price_cents" integer,
	"province_code" varchar(2) NOT NULL,
	"city_id" integer,
	"community_id" integer,
	"contact_email" text,
	"contact_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_single_owner";--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "listing_id" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_profiles_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_province_code_provinces_code_fk" FOREIGN KEY ("province_code") REFERENCES "public"."provinces"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_created_idx" ON "listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "listings_category_idx" ON "listings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "listings_province_idx" ON "listings" USING btree ("province_code");--> statement-breakpoint
CREATE INDEX "listings_city_idx" ON "listings" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "listings_community_idx" ON "listings" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "listings_seller_idx" ON "listings" USING btree ("seller_id");--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_listing_idx" ON "attachments" USING btree ("listing_id");--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_single_owner" CHECK (num_nonnulls("attachments"."post_id", "attachments"."comment_id", "attachments"."event_id", "attachments"."listing_id") = 1);