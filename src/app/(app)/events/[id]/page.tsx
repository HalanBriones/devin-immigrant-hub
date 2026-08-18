import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AttachmentGallery } from "@/modules/communities/ui/attachment-gallery";
import { SignUpPrompt } from "@/modules/communities/ui/sign-up-prompt";
import { getEvent, listEventAttendees } from "@/modules/events/queries";
import { formatEventDate } from "@/modules/events/ui/event-card";
import { EventTags } from "@/modules/events/ui/event-tags";
import { RsvpButton } from "@/modules/events/ui/rsvp-button";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();

  const user = await getCurrentUser();
  const event = await getEvent(eventId, user?.id ?? null);
  if (!event) notFound();

  const attendees = await listEventAttendees(event.id);
  const past = event.startsAt.getTime() < Date.now();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/events" className="text-xs font-medium text-sky-700">
        ← Back to events
      </Link>

      <article className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="section-title">{formatEventDate(event.startsAt)}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            <p className="text-sm text-slate-600">
              {event.locationName} · {event.cityName}
            </p>
            <EventTags tags={event.tags} />
          </div>
          <RsvpButton
            eventId={event.id}
            attending={event.attending}
            signedIn={Boolean(user)}
            past={past}
          />
        </div>

        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {event.description}
        </p>
        <AttachmentGallery images={event.images} alt={`Photo for ${event.title}`} />

        <p className="text-xs text-slate-500">
          Hosted by{" "}
          <Link href={`/u/${event.hostHandle}`} className="font-medium text-slate-700">
            {event.hostName}
          </Link>
        </p>
      </article>

      <section className="card flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          {event.attendeeCount} {event.attendeeCount === 1 ? "person is" : "people are"} going
        </h2>
        {attendees.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {attendees.map((attendee) => (
              <li key={attendee.handle}>
                <Link
                  href={`/u/${attendee.handle}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700"
                >
                  {attendee.displayName}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {user ? null : <SignUpPrompt action="join events and meet people" />}
      </section>
    </div>
  );
}
