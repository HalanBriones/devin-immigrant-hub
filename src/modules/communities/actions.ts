"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionState } from "@/lib/forms";
import {
  COMMENT_REPUTATION,
  POST_UPVOTE_REPUTATION,
} from "@/modules/communities/reputation";
import { awardReputation } from "@/modules/profiles/reputation";
import {
  comments,
  communities,
  communityMembers,
  postVotes,
  posts,
} from "@/modules/communities/schema";

const postSchema = z.object({
  communityId: z.coerce.number().int().positive(),
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(140),
  body: z.string().trim().min(10, "Write at least 10 characters").max(5000),
});

const commentSchema = z.object({
  postId: z.coerce.number().int().positive(),
  body: z.string().trim().min(2, "Write at least 2 characters").max(2000),
});

const communitySchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  kind: z.enum(["province", "city", "origin", "topic"]),
});

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function joinCommunityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const communityId = Number(formData.get("communityId"));
  if (!Number.isInteger(communityId)) return;

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(communityMembers)
      .values({ communityId, userId: user.id })
      .onConflictDoNothing()
      .returning({ userId: communityMembers.userId });
    if (inserted.length > 0) {
      await tx
        .update(communities)
        .set({ memberCount: sql`${communities.memberCount} + 1` })
        .where(eq(communities.id, communityId));
    }
  });

  revalidatePath("/communities");
  revalidatePath("/feed");
}

export async function leaveCommunityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const communityId = Number(formData.get("communityId"));
  if (!Number.isInteger(communityId)) return;

  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(communityMembers)
      .where(
        and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, user.id)),
      )
      .returning({ userId: communityMembers.userId });
    if (deleted.length > 0) {
      await tx
        .update(communities)
        .set({ memberCount: sql`greatest(${communities.memberCount} - 1, 0)` })
        .where(eq(communities.id, communityId));
    }
  });

  revalidatePath("/communities");
  revalidatePath("/feed");
}

export async function createCommunityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const values = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values };
  }

  const slug = slugify(parsed.data.name);
  if (!slug) return { fieldErrors: { name: "Use at least a few letters or numbers" }, values };

  const [existing] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1);
  if (existing) {
    return { fieldErrors: { name: "A community with a similar name already exists" }, values };
  }

  await db.transaction(async (tx) => {
    const [community] = await tx
      .insert(communities)
      .values({
        slug,
        name: parsed.data.name,
        description: parsed.data.description || null,
        kind: parsed.data.kind,
        createdBy: user.id,
        memberCount: 1,
      })
      .returning({ id: communities.id });
    await tx
      .insert(communityMembers)
      .values({ communityId: community.id, userId: user.id, role: "moderator" });
  });

  revalidatePath("/communities");
  redirect(`/c/${slug}`);
}

export async function createPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const values = {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  };
  const parsed = postSchema.safeParse({
    communityId: formData.get("communityId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values };
  }

  const { communityId, title, body } = parsed.data;
  const [membership] = await db
    .select({ userId: communityMembers.userId })
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, user.id)))
    .limit(1);
  if (!membership) {
    return { error: "Join this community before posting", values };
  }

  const [community] = await db
    .select({ slug: communities.slug })
    .from(communities)
    .where(eq(communities.id, communityId))
    .limit(1);
  if (!community) return { error: "Community not found", values };

  await db.transaction(async (tx) => {
    await tx.insert(posts).values({ communityId, authorId: user.id, title, body });
    await tx
      .update(communities)
      .set({ postCount: sql`${communities.postCount} + 1` })
      .where(eq(communities.id, communityId));
  });

  revalidatePath(`/c/${community.slug}`);
  revalidatePath("/feed");
  return { success: "Post published" };
}

export async function createCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const values = { body: String(formData.get("body") ?? "") };
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values };
  }

  const { postId, body } = parsed.data;
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) return { error: "This post no longer exists", values };

  const commentId = await db.transaction(async (tx) => {
    const [comment] = await tx
      .insert(comments)
      .values({ postId, authorId: user.id, body })
      .returning({ id: comments.id });
    await tx
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));
    return comment.id;
  });

  await awardReputation(user.id, "helpful_comment", COMMENT_REPUTATION, {
    type: "comment",
    id: String(commentId),
  });

  revalidatePath(`/p/${postId}`);
  return { success: "Comment posted" };
}

export async function togglePostVoteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(postId)) return;

  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) return;

  const added = await db.transaction(async (tx) => {
    const removed = await tx
      .delete(postVotes)
      .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, user.id)))
      .returning({ userId: postVotes.userId });
    if (removed.length > 0) {
      await tx
        .update(posts)
        .set({ score: sql`greatest(${posts.score} - 1, 0)` })
        .where(eq(posts.id, postId));
      return false;
    }
    await tx.insert(postVotes).values({ postId, userId: user.id, value: 1 });
    await tx
      .update(posts)
      .set({ score: sql`${posts.score} + 1` })
      .where(eq(posts.id, postId));
    return true;
  });

  if (added && post.authorId !== user.id) {
    await awardReputation(post.authorId, "post_liked", POST_UPVOTE_REPUTATION, {
      type: "post",
      id: String(postId),
    });
  }

  revalidatePath(`/p/${postId}`);
  revalidatePath("/feed");
}
