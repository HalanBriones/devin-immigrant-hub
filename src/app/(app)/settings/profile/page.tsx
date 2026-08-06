import { ProfileFormLoader } from "@/modules/profiles/ui/profile-form-loader";

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          This is what other members see. Trust badges and reputation are shown instead of
          follower counts.
        </p>
      </div>
      <ProfileFormLoader />
    </div>
  );
}
