import Link from "next/link";
import { ProfileFormLoader } from "@/modules/profiles/ui/profile-form-loader";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tell us about you</h1>
        <p className="mt-1 text-sm text-slate-600">
          Where you came from and where you are settling helps us connect you to the right
          communities. You can change any of this later.
        </p>
      </div>
      <ProfileFormLoader submitLabel="Save and continue" />
      <Link href="/settings/verification" className="text-sm font-medium text-sky-700">
        Skip for now — verify my email and phone
      </Link>
    </div>
  );
}
