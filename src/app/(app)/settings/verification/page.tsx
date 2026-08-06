import { requireUser } from "@/lib/auth/session";
import { VerificationPanel } from "@/modules/auth/ui/verification-panel";

export default async function VerificationSettingsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Verification</h1>
        <p className="mt-1 text-sm text-slate-600">
          Verified members earn trust badges and reputation points. In development, codes and links
          are printed to the server console.
        </p>
      </div>
      <VerificationPanel
        email={user.email}
        emailVerified={user.emailVerified}
        phone={user.phone}
        phoneVerified={user.phoneVerified}
      />
    </div>
  );
}
