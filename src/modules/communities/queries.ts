import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { imageUrl } from "@/lib/uploads";
import { cities, provinces } from "@/modules/geo/schema";
import { profiles } from "@/modules/profiles/schema";
import {
  attachments,
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
  joined: boolean;
};

export type PostSummary = {
  id: number;
  title: string;
  body: string;
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
  return db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      description: communities.description,
      kind: communities.kind,
      memberCount: communities.memberCount,
      postCount: communities.postCount,
      joined: joinedExpr(viewerId),
    })
    .from(communities)
    .orderBy(desc(communities.memberCount), communities.name);
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
  return row ?? null;
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
    .where(eq(posts.communityId, communityId))
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
      inArray(
        posts.communityId,
        memberships.map((row) => row.communityId),
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
    .where(eq(posts.id, id))
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
    .where(eq(comments.postId, postId))
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
  return db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      description: communities.description,
      kind: communities.kind,
      memberCount: communities.memberCount,
      postCount: communities.postCount,
      joined: sql<boolean>`true`,
    })
    .from(communityMembers)
    .innerJoin(communities, eq(communities.id, communityMembers.communityId))
    .where(eq(communityMembers.userId, userId))
    .orderBy(communities.name);
}
