import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCommunityBySlug, listCommunityPosts } from "@/modules/communities/queries";
import { MembershipButton } from "@/modules/communities/ui/community-card";
import { PostCard } from "@/modules/communities/ui/post-card";
import { PostComposer } from "@/modules/communities/ui/post-composer";

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const community = await getCommunityBySlug(slug, user.id);
  if (!community) notFound();

  const posts = await listCommunityPosts(community.id, user.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="card flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{community.name}</h1>
          {community.description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              {community.description}
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            {community.memberCount} members · {community.postCount} posts
          </p>
        </div>
        <MembershipButton communityId={community.id} joined={community.joined} />
      </header>

      {community.joined ? (
        <PostComposer communityId={community.id} />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          Join this community to post and comment.
        </p>
      )}

      <section className="flex flex-col gap-4">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">No posts yet — be the first to share something.</p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} showCommunity={false} />)
        )}
      </section>
    </div>
  );
}
