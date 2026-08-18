import Link from "next/link";
import { countUnreadNotifications } from "@/modules/notifications/queries";

export async function NotificationBell({ userId }: { userId: string }) {
  const unread = await countUnreadNotifications(userId);

  return (
    <Link
      href="/notifications"
      className="nav-link relative"
      aria-label={
        unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
      }
    >
      <span aria-hidden>🔔</span>
      <span className="ml-1 hidden sm:inline">Notifications</span>
      {unread > 0 ? (
        <span className="ml-1 rounded-full bg-sky-600 px-1.5 py-0.5 text-xs font-semibold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
