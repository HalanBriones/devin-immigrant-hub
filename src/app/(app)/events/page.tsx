import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listPastEvents, listUpcomingEvents } from "@/modules/events/queries";
import { EventCard } from "@/modules/events/ui/event-card";

export default async function EventsPage() {
  const user = await getCurrentUser();
  const [upcoming, past] = await Promise.all([
    listUpcomingEvents(user?.id ?? null),
    listPastEvents(user?.id ?? null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-slate-600">
            Meet other newcomers in person — potlucks, job clinics, language exchanges and
            more. Join the ones you like so the host knows you are coming.
          </p>
        </div>
        <Link
          href={user ? "/events/new" : "/register"}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          Create an event
        </Link>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="section-title">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            No upcoming events yet — be the first to organise one.
          </p>
        ) : (
          upcoming.map((event) => (
            <EventCard key={event.id} event={event} signedIn={Boolean(user)} />
          ))
        )}
      </section>

      {past.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="section-title">Past events</h2>
          {past.map((event) => (
            <EventCard key={event.id} event={event} signedIn={Boolean(user)} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
