CREATE TABLE "event_attendees" (
	"event_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_attendees_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"location_name" text NOT NULL,
	"city_name" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"attendee_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_single_owner";--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_profiles_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_attendees_user_idx" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_host_idx" ON "events" USING btree ("host_id");--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_event_idx" ON "attachments" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_single_owner" CHECK (num_nonnulls("attachments"."post_id", "attachments"."comment_id", "attachments"."event_id") = 1);