import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReputationBadge, VerificationBadge } from "@/components/ui/badge";
import { countryName } from "@/lib/countries";
import { getProfileByHandle, listInterests, listLanguages } from "@/modules/profiles/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  return { title: profile ? `${profile.displayName} — Immigrant Community Hub` : "Profile" };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const [languages, interests] = await Promise.all([listLanguages(), listInterests()]);
  const spoken = languages.filter((language) => profile.languages.includes(language.code));
  const chosen = interests.filter((interest) => profile.interests.includes(interest.id));
  const location = [profile.cityName, profile.provinceName].filter(Boolean).join(", ");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/" className="text-sm font-medium text-sky-700">
        ← Immigrant Community Hub
      </Link>

      <section className="card flex flex-col gap-4">
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

        <div className="flex flex-wrap gap-2">
          <VerificationBadge label="Email verified" verified={profile.emailVerified} />
          <VerificationBadge label="Phone verified" verified={profile.phoneVerified} />
          <ReputationBadge score={profile.reputationScore} />
        </div>

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
      </section>
    </main>
  );
}
