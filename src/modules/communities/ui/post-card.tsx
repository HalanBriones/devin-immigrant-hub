import Link from "next/link";
import { togglePostVoteAction } from "@/modules/communities/actions";
import type { PostSummary } from "@/modules/communities/queries";
import { AttachmentGallery } from "@/modules/communities/ui/attachment-gallery";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(date);
}

const voteClass =
  "flex w-12 flex-col items-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors";

export function VoteButton({
  postId,
  score,
  voted,
  signedIn,
}: {
  postId: number;
  score: number;
  voted: boolean;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <Link
        href="/register"
        title="Create an account to upvote"
        className={`${voteClass} border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700`}
      >
        <span aria-hidden>▲</span>
        {score}
      </Link>
    );
  }
  return (
    <form action={togglePostVoteAction}>
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        aria-label={voted ? "Remove upvote" : "Upvote"}
        className={`${voteClass} ${
          voted
            ? "border-sky-300 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700"
        }`}
      >
        <span aria-hidden>▲</span>
        {score}
      </button>
    </form>
  );
}

export function PostCard({
  post,
  signedIn,
  showCommunity = true,
}: {
  post: PostSummary;
  signedIn: boolean;
  showCommunity?: boolean;
}) {
  return (
    <article className="card flex gap-4 p-5">
      <VoteButton
        postId={post.id}
        score={post.score}
        voted={post.viewerVoted}
        signedIn={signedIn}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          {showCommunity ? (
            <>
              <Link href={`/c/${post.communitySlug}`} className="font-medium text-sky-700">
                {post.communityName}
              </Link>
              <span aria-hidden>·</span>
            </>
          ) : null}
          <Link href={`/u/${post.authorHandle}`} className="font-medium text-slate-700">
            {post.authorName}
          </Link>
          <span aria-hidden>·</span>
          <span>{post.authorReputation} reputation</span>
          <span aria-hidden>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <Link href={`/p/${post.id}`} className="text-base font-semibold text-slate-900 hover:text-sky-700">
          {post.title}
        </Link>
        <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {post.body}
        </p>
        <AttachmentGallery images={post.images} alt={`Photo attached to ${post.title}`} />
        <Link href={`/p/${post.id}`} className="text-xs font-medium text-slate-500 hover:text-sky-700">
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </Link>
      </div>
    </article>
  );
}
