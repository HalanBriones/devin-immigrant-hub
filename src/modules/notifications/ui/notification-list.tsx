import Link from "next/link";
import type { NotificationItem } from "@/modules/notifications/queries";

function describe(item: NotificationItem): { text: string; href: string } {
  const actor = item.actorName ?? "Someone";
  if (item.kind === "event_rsvp") {
    return {
      text: `${actor} is going to ${item.eventTitle ?? "your event"}`,
      href: item.eventId ? `/events/${item.eventId}` : "/events",
    };
  }
  const post = item.postTitle ?? "your post";
  return {
    text:
      item.kind === "post_comment"
        ? `${actor} commented on ${post}`
        : `${actor} upvoted ${post}`,
    href: item.postId ? `/p/${item.postId}` : "/feed",
  };
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  if (items.length === 0) {
    return (
      <p className="card text-sm text-slate-600">
        No notifications yet. Post something and you&apos;ll hear when people reply.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const { text, href } = describe(item);
        return (
          <li key={item.id}>
            <Link
              href={href}
              className={`card flex items-baseline justify-between gap-4 transition-colors hover:border-sky-300 ${
                item.read ? "" : "border-sky-200 bg-sky-50/60"
              }`}
            >
              <span className="text-sm text-slate-800">
                {item.read ? null : (
                  <span
                    aria-label="Unread"
                    className="mr-2 inline-block size-2 rounded-full bg-sky-600 align-middle"
                  />
                )}
                {text}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {item.createdAt.toLocaleDateString("en-CA", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
