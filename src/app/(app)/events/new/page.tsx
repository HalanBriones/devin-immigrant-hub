import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { CreateEventForm } from "@/modules/events/ui/create-event-form";

export default async function NewEventPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link href="/events" className="text-xs font-medium text-sky-700">
          ← Back to events
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Create an event</h1>
        <p className="text-sm text-slate-600">
          Organise a meet-up for other newcomers. You are counted as going automatically.
        </p>
      </header>
      <CreateEventForm />
    </div>
  );
}
