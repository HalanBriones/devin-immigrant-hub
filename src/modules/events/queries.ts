import { and, asc, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { imageUrl } from "@/lib/uploads";
import { attachments } from "@/modules/communities/schema";
import { eventAttendees, events } from "@/modules/events/schema";
import { asEventTags, type EventTag } from "@/modules/events/tags";
import { profiles } from "@/modules/profiles/schema";

export type EventSummary = {
  id: number;
  title: string;
  description: string;
  startsAt: Date;
  locationName: string;
  cityName: string;
  tags: EventTag[];
  attendeeCount: number;
  hostHandle: string;
  hostName: string;
  attending: boolean;
  images: string[];
};

async function imagesByEvent(
  eventIds: number[],
): Promise<Map<number, string[]>> {
  const byEvent = new Map<number, string[]>();
  if (eventIds.length === 0) return byEvent;

  const rows = await db
    .select({ eventId: attachments.eventId, fileName: attachments.fileName })
    .from(attachments)
    .where(
      and(inArray(attachments.eventId, eventIds), isNotNull(attachments.eventId)),
    )
    .orderBy(attachments.id);

  for (const row of rows) {
    if (row.eventId === null) continue;
    const urls = byEvent.get(row.eventId) ?? [];
    urls.push(imageUrl(row.fileName));
    byEvent.set(row.eventId, urls);
  }
  return byEvent;
}

function eventSelection(viewerId: string | null) {
  const attending = viewerId
    ? sql<boolean>`exists (
        select 1 from ${eventAttendees}
        where ${eventAttendees.eventId} = ${events.id}
          and ${eventAttendees.userId} = ${viewerId}
      )`
    : sql<boolean>`false`;
  return {
    id: events.id,
    title: events.title,
    description: events.description,
    startsAt: events.startsAt,
    locationName: events.locationName,
    cityName: events.cityName,
    tags: events.tags,
    attendeeCount: events.attendeeCount,
    hostHandle: profiles.handle,
    hostName: profiles.displayName,
    attending,
  };
}

type EventRow = Omit<EventSummary, "tags" | "images"> & { tags: string[] };

async function toSummaries(rows: EventRow[]): Promise<EventSummary[]> {
  const byEvent = await imagesByEvent(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    tags: asEventTags(row.tags),
    images: byEvent.get(row.id) ?? [],
  }));
}

export async function listUpcomingEvents(
  viewerId: string | null,
): Promise<EventSummary[]> {
  const rows = await db
    .select(eventSelection(viewerId))
    .from(events)
    .innerJoin(profiles, eq(profiles.userId, events.hostId))
    .where(gte(events.startsAt, sql`now()`))
    .orderBy(asc(events.startsAt))
    .limit(50);
  return toSummaries(rows);
}

export async function listPastEvents(
  viewerId: string | null,
): Promise<EventSummary[]> {
  const rows = await db
    .select(eventSelection(viewerId))
    .from(events)
    .innerJoin(profiles, eq(profiles.userId, events.hostId))
    .where(lt(events.startsAt, sql`now()`))
    .orderBy(desc(events.startsAt))
    .limit(10);
  return toSummaries(rows);
}

export async function getEvent(
  id: number,
  viewerId: string | null,
): Promise<EventSummary | null> {
  const [row] = await db
    .select(eventSelection(viewerId))
    .from(events)
    .innerJoin(profiles, eq(profiles.userId, events.hostId))
    .where(eq(events.id, id))
    .limit(1);
  if (!row) return null;
  const [summary] = await toSummaries([row]);
  return summary;
}

export type EventAttendee = {
  handle: string;
  displayName: string;
};

export async function listEventAttendees(
  eventId: number,
): Promise<EventAttendee[]> {
  return db
    .select({ handle: profiles.handle, displayName: profiles.displayName })
    .from(eventAttendees)
    .innerJoin(profiles, eq(profiles.userId, eventAttendees.userId))
    .where(eq(eventAttendees.eventId, eventId))
    .orderBy(eventAttendees.joinedAt)
    .limit(30);
}
