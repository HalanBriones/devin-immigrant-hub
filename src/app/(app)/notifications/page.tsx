import { requireUser } from "@/lib/auth/session";
import { SubmitButton } from "@/components/ui/submit-button";
import { markNotificationsReadAction } from "@/modules/notifications/actions";
import { listNotifications } from "@/modules/notifications/queries";
import { NotificationList } from "@/modules/notifications/ui/notification-list";

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-600">
            Comments and upvotes on your posts, and RSVPs to your events.
          </p>
        </div>
        {unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <SubmitButton label="Mark all as read" variant="secondary" />
          </form>
        ) : null}
      </header>
      <NotificationList items={items} />
    </div>
  );
}
