import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

export default async function VerificationSettingsPage() {
  const user = await requireUser();
  redirect(user.handle ? `/u/${user.handle}#verification` : "/onboarding");
}
