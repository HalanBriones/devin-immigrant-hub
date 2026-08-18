import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listCommunities, listPublicPosts } from "@/modules/communities/queries";
import { PostCard } from "@/modules/communities/ui/post-card";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [posts, communities] = await Promise.all([
    listPublicPosts(user?.id ?? null),
    listCommunities(user?.id ?? null),
  ]);
  const topCommunities = communities.slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      <header className="card flex flex-col items-start gap-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700">
          Canada
        </p>
        <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Immigrant Community Hub
        </h1>
        <p className="max-w-2xl text-slate-600">
          One place to settle in Canada: community support, housing and job tips, local events,
          and guidance from people who arrived before you.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link
              href="/feed"
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700"
            >
              Go to your feed
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Popular communities
          </h2>
          <Link href="/communities" className="text-sm font-medium text-sky-700">
            Browse all {communities.length}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {topCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/c/${community.slug}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700"
            >
              {community.name}
              <span className="ml-2 text-xs text-slate-400">{community.memberCount}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Latest across communities
        </h2>
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">No discussions yet.</p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} signedIn={Boolean(user)} />
          ))
        )}
      </section>
    </div>
  );
}
