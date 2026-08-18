import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

export default async function ProfileSettingsPage() {
  const user = await requireUser();
  redirect(user.handle ? `/u/${user.handle}?edit=1` : "/onboarding");
}
