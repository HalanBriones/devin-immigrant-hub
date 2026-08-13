import Link from "next/link";
import { AttachmentGallery } from "@/modules/communities/ui/attachment-gallery";
import type { EventSummary } from "@/modules/events/queries";
import { EventTags } from "@/modules/events/ui/event-tags";
import { RsvpButton } from "@/modules/events/ui/rsvp-button";

export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(date);
}

export function EventCard({
  event,
  signedIn,
}: {
  event: EventSummary;
  signedIn: boolean;
}) {
  const past = event.startsAt.getTime() < Date.now();

  return (
    <article className="card card-hover flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-title">{formatEventDate(event.startsAt)}</p>
          <Link
            href={`/events/${event.id}`}
            className="text-base font-semibold text-slate-900 hover:text-sky-700"
          >
            {event.title}
          </Link>
          <p className="mt-1 text-sm text-slate-600">
            {event.locationName} · {event.cityName}
          </p>
        </div>
        <RsvpButton
          eventId={event.id}
          attending={event.attending}
          signedIn={signedIn}
          past={past}
        />
      </div>
      <EventTags tags={event.tags} />
      <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
        {event.description}
      </p>
      <AttachmentGallery images={event.images} alt={`Photo for ${event.title}`} />
      <p className="text-xs text-slate-500">
        Hosted by{" "}
        <Link href={`/u/${event.hostHandle}`} className="font-medium text-slate-700">
          {event.hostName}
        </Link>{" "}
        · {event.attendeeCount} going
      </p>
    </article>
  );
}
