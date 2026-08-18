import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { imageUrl } from "@/lib/uploads";
import type { PostType } from "@/modules/communities/post-types";
import { asCommunityTags, type CommunityTag } from "@/modules/communities/tags";
import { cities, provinces } from "@/modules/geo/schema";
import { profiles } from "@/modules/profiles/schema";
import { attachments } from "@/modules/attachments/schema";
import {
  comments,
  communities,
  communityMembers,
  postVotes,
  posts,
} from "@/modules/communities/schema";

export type CommunitySummary = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  kind: "province" | "city" | "origin" | "topic";
  memberCount: number;
  postCount: number;
  tags: CommunityTag[];
  joined: boolean;
};

export type PostSummary = {
  id: number;
  title: string;
  body: string;
  type: PostType;
  score: number;
  commentCount: number;
  createdAt: Date;
  authorHandle: string;
  authorName: string;
  authorReputation: number;
  communitySlug: string;
  communityName: string;
  viewerVoted: boolean;
  images: string[];
};

type WithId = { id: number };

async function imagesByOwner(
  ownerIds: number[],
  owner: "post" | "comment",
): Promise<Map<number, string[]>> {
  const ownerColumn =
    owner === "post" ? attachments.postId : attachments.commentId;
  const byOwner = new Map<number, string[]>();
  if (ownerIds.length === 0) return byOwner;

  const rows = await db
    .select({ ownerId: ownerColumn, fileName: attachments.fileName })
    .from(attachments)
    .where(and(inArray(ownerColumn, ownerIds), isNotNull(ownerColumn)))
    .orderBy(attachments.id);

  for (const row of rows) {
    if (row.ownerId === null) continue;
    const urls = byOwner.get(row.ownerId) ?? [];
    urls.push(imageUrl(row.fileName));
    byOwner.set(row.ownerId, urls);
  }
  return byOwner;
}

async function withImages<T extends WithId>(
  rows: T[],
  owner: "post" | "comment",
): Promise<(T & { images: string[] })[]> {
  const byOwner = await imagesByOwner(
    rows.map((row) => row.id),
    owner,
  );
  return rows.map((row) => ({ ...row, images: byOwner.get(row.id) ?? [] }));
}

function joinedExpr(viewerId: string | null) {
  if (!viewerId) return sql<boolean>`false`;
  return sql<boolean>`exists (
    select 1 from ${communityMembers}
    where ${communityMembers.communityId} = ${communities.id}
      and ${communityMembers.userId} = ${viewerId}
  )`;
}

export async function listCommunities(
  viewerId: string | null,
): Promise<CommunitySummary[]> {
  const rows = await db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      description: communities.description,
      kind: communities.kind,
      memberCount: communities.memberCount,
      postCount: communities.postCount,
      tags: communities.tags,
      joined: joinedExpr(viewerId),
    })
    .from(communities)
    .orderBy(desc(communities.memberCount), communities.name);
  return rows.map((row) => ({ ...row, tags: asCommunityTags(row.tags) }));
}

export type CommunityDetail = CommunitySummary & {
  provinceName: string | null;
  cityName: string | null;
  countryOfOrigin: string | null;
};

export async function getCommunityBySlug(
  slug: string,
  viewerId: string | null,
): Promise<CommunityDetail | null> {
  const [row] = await db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      description: communities.description,
      kind: communities.kind,
      memberCount: communities.memberCount,
      postCount: communities.postCount,
      tags: communities.tags,
      provinceName: provinces.nameEn,
      cityName: cities.name,
      countryOfOrigin: communities.countryOfOrigin,
      joined: joinedExpr(viewerId),
    })
    .from(communities)
    .leftJoin(provinces, eq(provinces.code, communities.provinceCode))
    .leftJoin(cities, eq(cities.id, communities.cityId))
    .where(eq(communities.slug, slug))
    .limit(1);
  if (!row) return null;
  return { ...row, tags: asCommunityTags(row.tags) };
}

function postSelection(viewerId: string | null) {
  const viewerVoted = viewerId
    ? sql<boolean>`exists (
        select 1 from ${postVotes}
        where ${postVotes.postId} = ${posts.id} and ${postVotes.userId} = ${viewerId}
      )`
    : sql<boolean>`false`;
  return {
    id: posts.id,
    title: posts.title,
    body: posts.body,
    type: posts.type,
    score: posts.score,
    commentCount: posts.commentCount,
    createdAt: posts.createdAt,
    authorHandle: profiles.handle,
    authorName: profiles.displayName,
    authorReputation: profiles.reputationScore,
    communitySlug: communities.slug,
    communityName: communities.name,
    viewerVoted,
  };
}

export async function listCommunityPosts(
  communityId: number,
  viewerId: string | null,
): Promise<PostSummary[]> {
  const rows = await db
    .select(postSelection(viewerId))
    .from(posts)
    .innerJoin(profiles, eq(profiles.userId, posts.authorId))
    .innerJoin(communities, eq(communities.id, posts.communityId))
    .where(and(eq(posts.communityId, communityId), isNull(posts.removedAt)))
    .orderBy(desc(posts.createdAt))
    .limit(50);
  return withImages(rows, "post");
}

export async function listFeedPosts(viewerId: string): Promise<PostSummary[]> {
  const memberships = await db
    .select({ communityId: communityMembers.communityId })
    .from(communityMembers)
    .where(eq(communityMembers.userId, viewerId));
  if (memberships.length === 0) return [];

  const rows = await db
    .select(postSelection(viewerId))
    .from(posts)
    .innerJoin(profiles, eq(profiles.userId, posts.authorId))
    .innerJoin(communities, eq(communities.id, posts.communityId))
    .where(
      and(
        inArray(
          posts.communityId,
          memberships.map((row) => row.communityId),
        ),
        isNull(posts.removedAt),
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(30);
  return withImages(rows, "post");
}

export async function listPublicPosts(
  viewerId: string | null,
): Promise<PostSummary[]> {
  const rows = await db
    .select(postSelection(viewerId))
    .from(posts)
    .innerJoin(profiles, eq(profiles.userId, posts.authorId))
    .innerJoin(communities, eq(communities.id, posts.communityId))
    .where(isNull(posts.removedAt))
    .orderBy(desc(posts.createdAt))
    .limit(30);
  return withImages(rows, "post");
}

export async function getPost(
  id: number,
  viewerId: string | null,
): Promise<PostSummary | null> {
  const [row] = await db
    .select(postSelection(viewerId))
    .from(posts)
    .innerJoin(profiles, eq(profiles.userId, posts.authorId))
    .innerJoin(communities, eq(communities.id, posts.communityId))
    .where(and(eq(posts.id, id), isNull(posts.removedAt)))
    .limit(1);
  if (!row) return null;
  const [withImage] = await withImages([row], "post");
  return withImage;
}

export type CommentView = {
  id: number;
  body: string;
  createdAt: Date;
  authorHandle: string;
  authorName: string;
  images: string[];
};

export async function listComments(postId: number): Promise<CommentView[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorHandle: profiles.handle,
      authorName: profiles.displayName,
    })
    .from(comments)
    .innerJoin(profiles, eq(profiles.userId, comments.authorId))
    .where(and(eq(comments.postId, postId), isNull(comments.removedAt)))
    .orderBy(comments.createdAt);
  return withImages(rows, "comment");
}

export async function isMember(
  communityId: number,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ userId: communityMembers.userId })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function listJoinedCommunities(
  userId: string,
): Promise<CommunitySummary[]> {
  const rows = await db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      description: communities.description,
      kind: communities.kind,
      memberCount: communities.memberCount,
      postCount: communities.postCount,
      tags: communities.tags,
      joined: sql<boolean>`true`,
    })
    .from(communityMembers)
    .innerJoin(communities, eq(communities.id, communityMembers.communityId))
    .where(eq(communityMembers.userId, userId))
    .orderBy(communities.name);
  return rows.map((row) => ({ ...row, tags: asCommunityTags(row.tags) }));
}
