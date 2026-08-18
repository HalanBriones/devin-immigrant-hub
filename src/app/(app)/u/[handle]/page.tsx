import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReputationBadge, VerificationBadge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { countryName } from "@/lib/countries";
import { VerificationPanel } from "@/modules/auth/ui/verification-panel";
import { getProfileByHandle, listInterests, listLanguages } from "@/modules/profiles/queries";
import { ProfileFormLoader } from "@/modules/profiles/ui/profile-form-loader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  return { title: profile ? `${profile.displayName} — Immigrant Community Hub` : "Profile" };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ handle }, { edit }] = await Promise.all([params, searchParams]);
  const [profile, user] = await Promise.all([getProfileByHandle(handle), getCurrentUser()]);
  if (!profile) notFound();

  const isOwner = user?.handle === profile.handle;
  const editing = isOwner && edit === "1";

  const [languages, interests] = await Promise.all([listLanguages(), listInterests()]);
  const spoken = languages.filter((language) => profile.languages.includes(language.code));
  const chosen = interests.filter((interest) => profile.interests.includes(interest.id));
  const location = [profile.cityName, profile.provinceName].filter(Boolean).join(", ");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl ?? "/avatar-placeholder.svg"}
              alt=""
              className="h-16 w-16 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
              <p className="text-sm text-slate-500">@{profile.handle}</p>
            </div>
          </div>
          {isOwner ? (
            <Link
              href={editing ? `/u/${profile.handle}` : `/u/${profile.handle}?edit=1`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              {editing ? "Done editing" : "Edit profile"}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <VerificationBadge label="Email verified" verified={profile.emailVerified} />
          <VerificationBadge label="Phone verified" verified={profile.phoneVerified} />
          <ReputationBadge score={profile.reputationScore} />
        </div>

        {editing ? null : (
          <>
            {profile.bio ? <p className="text-sm text-slate-700">{profile.bio}</p> : null}

            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {profile.countryOfOrigin ? (
                <div>
                  <dt className="text-slate-500">From</dt>
                  <dd className="font-medium">{countryName(profile.countryOfOrigin)}</dd>
                </div>
              ) : null}
              {location ? (
                <div>
                  <dt className="text-slate-500">Settling in</dt>
                  <dd className="font-medium">{location}</dd>
                </div>
              ) : null}
              {profile.occupation ? (
                <div>
                  <dt className="text-slate-500">Occupation</dt>
                  <dd className="font-medium">{profile.occupation}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Member since</dt>
                <dd className="font-medium">
                  {profile.memberSince.toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                  })}
                </dd>
              </div>
              {spoken.length > 0 ? (
                <div>
                  <dt className="text-slate-500">Languages</dt>
                  <dd className="font-medium">
                    {spoken.map((language) => language.nameEn).join(", ")}
                  </dd>
                </div>
              ) : null}
              {chosen.length > 0 ? (
                <div>
                  <dt className="text-slate-500">Interests</dt>
                  <dd className="font-medium">
                    {chosen.map((interest) => interest.nameEn).join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </>
        )}
      </section>

      {isOwner && user ? (
        <>
          {editing ? (
            <section className="card flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">Edit your profile</h2>
                <p className="mt-1 text-sm text-slate-600">
                  This is what other members see. Trust badges and reputation are shown instead
                  of follower counts.
                </p>
              </div>
              <ProfileFormLoader />
            </section>
          ) : null}

          <section id="verification" className="card flex flex-col gap-4 scroll-mt-20">
            <div>
              <h2 className="text-lg font-semibold">Verification</h2>
              <p className="mt-1 text-sm text-slate-600">
                Only you see this section. Verified members earn trust badges and reputation
                points. In development, codes and links are printed to the server console.
              </p>
            </div>
            <VerificationPanel
              email={user.email}
              emailVerified={user.emailVerified}
              phone={user.phone}
              phoneVerified={user.phoneVerified}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
