import Link from "next/link";
import { ReputationBadge, VerificationBadge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listFeedPosts,
  listJoinedCommunities,
  listPublicPosts,
} from "@/modules/communities/queries";
import { PostCard } from "@/modules/communities/ui/post-card";
import { getProfileByUserId } from "@/modules/profiles/queries";

export default async function FeedPage() {
  const user = await getCurrentUser();

  if (!user) {
    const posts = await listPublicPosts(null);
    return (
      <div className="flex flex-col gap-6">
        <section className="card flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">What newcomers are discussing</h1>
            <p className="text-sm text-slate-600">
              Browse freely. Create a free account to join communities, post, comment and upvote.
            </p>
          </div>
          <Link
            href="/register"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
          >
            Create account
          </Link>
        </section>

        <section className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <p className="text-sm text-slate-500">No discussions yet.</p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} signedIn={false} />)
          )}
        </section>
      </div>
    );
  }

  const profile = await getProfileByUserId(user.id);
  const [feedPosts, joined] = await Promise.all([
    listFeedPosts(user.id),
    listJoinedCommunities(user.id),
  ]);

  const editProfileHref = profile ? `/u/${profile.handle}?edit=1` : "/onboarding";
  const steps = [
    { label: "Verify your email", done: user.emailVerified, href: "/settings/verification" },
    { label: "Verify your phone number", done: user.phoneVerified, href: "/settings/verification" },
    {
      label: "Add your city and country of origin",
      done: Boolean(profile?.cityId && profile?.countryOfOrigin),
      href: editProfileHref,
    },
    { label: "Write a short bio", done: Boolean(profile?.bio), href: editProfileHref },
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
          feedPosts.map((post) => <PostCard key={post.id} post={post} signedIn />)
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
