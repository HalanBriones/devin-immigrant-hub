import Link from "next/link";
import { ReputationBadge, VerificationBadge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { listFeedPosts, listJoinedCommunities } from "@/modules/communities/queries";
import { PostCard } from "@/modules/communities/ui/post-card";
import { getProfileByUserId } from "@/modules/profiles/queries";

export default async function FeedPage() {
  const user = await requireUser();
  const profile = await getProfileByUserId(user.id);
  const [feedPosts, joined] = await Promise.all([
    listFeedPosts(user.id),
    listJoinedCommunities(user.id),
  ]);

  const steps = [
    { label: "Verify your email", done: user.emailVerified, href: "/settings/verification" },
    { label: "Verify your phone number", done: user.phoneVerified, href: "/settings/verification" },
    {
      label: "Add your city and country of origin",
      done: Boolean(profile?.cityId && profile?.countryOfOrigin),
      href: "/settings/profile",
    },
    { label: "Write a short bio", done: Boolean(profile?.bio), href: "/settings/profile" },
    { label: "Join a community", done: joined.length > 0, href: "/communities" },
  ];
  const setupDone = steps.every((step) => step.done);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          Welcome, {profile?.displayName ?? user.email}
        </h1>
        <VerificationBadge label="Email verified" verified={user.emailVerified} />
        <VerificationBadge label="Phone verified" verified={user.phoneVerified} />
        <ReputationBadge score={profile?.reputationScore ?? 0} />
      </section>

      {joined.length > 0 ? (
        <section className="flex flex-wrap items-center gap-2">
          <span className="section-title">Your communities</span>
          {joined.map((community) => (
            <Link
              key={community.id}
              href={`/c/${community.slug}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700"
            >
              {community.name}
            </Link>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        {feedPosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            Your feed is empty.{" "}
            <Link href="/communities" className="font-medium text-sky-700">
              Join a community
            </Link>{" "}
            to see discussions here.
          </p>
        ) : (
          feedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </section>

      {setupDone ? null : (
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Get set up</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2 text-sm">
              <span aria-hidden className={step.done ? "text-emerald-600" : "text-slate-400"}>
                {step.done ? "✓" : "○"}
              </span>
              {step.done ? (
                <span className="text-slate-500 line-through">{step.label}</span>
              ) : (
                <Link href={step.href} className="font-medium text-sky-700">
                  {step.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
      )}
    </div>
  );
}
