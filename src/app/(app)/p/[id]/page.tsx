import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPost, isMember, listComments } from "@/modules/communities/queries";
import { getCommunityBySlug } from "@/modules/communities/queries";
import { CommentForm } from "@/modules/communities/ui/comment-form";
import { VoteButton } from "@/modules/communities/ui/post-card";
import { SignUpPrompt } from "@/modules/communities/ui/sign-up-prompt";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const user = await getCurrentUser();
  const post = await getPost(postId, user?.id ?? null);
  if (!post) notFound();

  const community = await getCommunityBySlug(post.communitySlug, user?.id ?? null);
  const [comments, member] = await Promise.all([
    listComments(postId),
    community && user ? isMember(community.id, user.id) : Promise.resolve(false),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <article className="card flex gap-4">
        <VoteButton
          postId={post.id}
          score={post.score}
          voted={post.viewerVoted}
          signedIn={Boolean(user)}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <Link href={`/c/${post.communitySlug}`} className="font-medium text-sky-700">
              {post.communityName}
            </Link>
            <span aria-hidden>·</span>
            <Link href={`/u/${post.authorHandle}`} className="font-medium text-slate-700">
              {post.authorName}
            </Link>
            <span aria-hidden>·</span>
            <span>{post.authorReputation} reputation</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{post.body}</p>
        </div>
      </article>

      <section className="card flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-900">
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </h2>
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
              <p className="text-xs text-slate-500">
                <Link href={`/u/${comment.authorHandle}`} className="font-medium text-slate-700">
                  {comment.authorName}
                </Link>
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
        {!user ? (
          <SignUpPrompt action="join the conversation" />
        ) : member ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-slate-500">
            Join{" "}
            <Link href={`/c/${post.communitySlug}`} className="font-medium text-sky-700">
              {post.communityName}
            </Link>{" "}
            to join the conversation.
          </p>
        )}
      </section>
    </div>
  );
}
