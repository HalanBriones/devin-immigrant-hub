import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { joinEventAction, leaveEventAction } from "@/modules/events/actions";

export function RsvpButton({
  eventId,
  attending,
  signedIn,
  past,
}: {
  eventId: number;
  attending: boolean;
  signedIn: boolean;
  past: boolean;
}) {
  if (past) {
    return (
      <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-500">
        Finished
      </span>
    );
  }
  if (!signedIn) {
    return (
      <Link
        href="/register"
        className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
      >
        Join event
      </Link>
    );
  }
  return (
    <form action={attending ? leaveEventAction : joinEventAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton
        label={attending ? "Cancel RSVP" : "Join event"}
        variant={attending ? "secondary" : "primary"}
      />
    </form>
  );
}
