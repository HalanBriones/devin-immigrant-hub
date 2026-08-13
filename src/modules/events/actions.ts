"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionState } from "@/lib/forms";
import { saveImages } from "@/lib/uploads";
import { attachments } from "@/modules/communities/schema";
import { eventAttendees, events } from "@/modules/events/schema";
import { EVENT_TAGS, MAX_EVENT_IMAGES, MAX_EVENT_TAGS } from "@/modules/events/tags";

const eventSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(140),
  description: z
    .string()
    .trim()
    .min(20, "Describe the event in at least 20 characters")
    .max(5000),
  startsAt: z.coerce.date({ message: "Pick a date and time" }),
  locationName: z
    .string()
    .trim()
    .min(3, "Where is it happening?")
    .max(160),
  cityName: z.string().trim().min(2, "Add the city").max(80),
  tags: z
    .array(z.enum(EVENT_TAGS))
    .min(1, "Pick at least one tag")
    .max(MAX_EVENT_TAGS, `Pick at most ${MAX_EVENT_TAGS} tags`),
});

function imageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File);
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const values = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    locationName: String(formData.get("locationName") ?? ""),
    cityName: String(formData.get("cityName") ?? ""),
  };
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    locationName: formData.get("locationName"),
    cityName: formData.get("cityName"),
    tags: formData.getAll("tags").map(String),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values };
  }

  const uploads = await saveImages(imageFiles(formData), MAX_EVENT_IMAGES);
  if ("error" in uploads) return { error: uploads.error, values };

  let eventId = 0;
  await db.transaction(async (tx) => {
    const [event] = await tx
      .insert(events)
      .values({
        hostId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        startsAt: parsed.data.startsAt,
        locationName: parsed.data.locationName,
        cityName: parsed.data.cityName,
        tags: parsed.data.tags,
        attendeeCount: 1,
      })
      .returning({ id: events.id });
    eventId = event.id;

    await tx
      .insert(eventAttendees)
      .values({ eventId: event.id, userId: user.id });

    if (uploads.images.length > 0) {
      await tx
        .insert(attachments)
        .values(uploads.images.map((image) => ({ ...image, eventId: event.id })));
    }
  });

  revalidatePath("/events");
  redirect(`/events/${eventId}`);
}

export async function joinEventAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const eventId = Number(formData.get("eventId"));
  if (!Number.isInteger(eventId)) return;

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(eventAttendees)
      .values({ eventId, userId: user.id })
      .onConflictDoNothing()
      .returning({ userId: eventAttendees.userId });
    if (inserted.length > 0) {
      await tx
        .update(events)
        .set({ attendeeCount: sql`${events.attendeeCount} + 1` })
        .where(eq(events.id, eventId));
    }
  });

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function leaveEventAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const eventId = Number(formData.get("eventId"));
  if (!Number.isInteger(eventId)) return;

  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, user.id),
        ),
      )
      .returning({ userId: eventAttendees.userId });
    if (deleted.length > 0) {
      await tx
        .update(events)
        .set({ attendeeCount: sql`greatest(${events.attendeeCount} - 1, 0)` })
        .where(eq(events.id, eventId));
    }
  });

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}
