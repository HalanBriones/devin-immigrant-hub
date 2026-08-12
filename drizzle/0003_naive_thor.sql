CREATE TYPE "public"."post_type" AS ENUM('question', 'info', 'event', 'service');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "type" "post_type" DEFAULT 'info' NOT NULL;--> statement-breakpoint
CREATE INDEX "posts_type_idx" ON "posts" USING btree ("type");