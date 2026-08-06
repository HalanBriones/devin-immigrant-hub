/**
 * Development-only seed: demo accounts with content so the app can be explored manually.
 * Idempotent — re-running resets the demo users' passwords and skips existing content.
 */
import "@/lib/load-env";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hashPassword } from "@/lib/auth/password";
import { users } from "@/modules/auth/schema";
import {
  comments,
  communities,
  communityMembers,
  postVotes,
  posts,
} from "@/modules/communities/schema";
import { cities } from "@/modules/geo/schema";
import { profiles } from "@/modules/profiles/schema";

const PASSWORD = "NewcomerDemo2026!";

const DEMO_USERS = [
  {
    email: "demo@immigranthub.ca",
    handle: "demo-newcomer",
    displayName: "Demo Newcomer",
    bio: "Trying out the hub. Recently landed in Vancouver.",
    countryOfOrigin: "CL",
    provinceCode: "BC",
    cityName: "Vancouver",
    occupation: "Software developer",
    reputation: 15,
  },
  {
    email: "priya@immigranthub.ca",
    handle: "priya-nair",
    displayName: "Priya Nair",
    bio: "Landed in Toronto in 2023, happy to help with credential recognition.",
    countryOfOrigin: "IN",
    provinceCode: "ON",
    cityName: "Toronto",
    occupation: "Registered nurse",
    reputation: 42,
  },
  {
    email: "marc@immigranthub.ca",
    handle: "marc-dubois",
    displayName: "Marc Dubois",
    bio: "Moved from Haiti to Montreal. Volunteer at a settlement agency.",
    countryOfOrigin: "HT",
    provinceCode: "QC",
    cityName: "Montreal",
    occupation: "Settlement worker",
    reputation: 30,
  },
];

const DEMO_POSTS = [
  {
    author: "priya-nair",
    community: "jobs-credentials",
    title: "How I got my nursing credentials recognized in Ontario",
    body: "The order matters: start the NNAS assessment before you land if you can, it took me 5 months.\n\nBudget roughly $1,000 in fees, and ask your school for sealed transcripts early — that was my longest delay.",
  },
  {
    author: "marc-dubois",
    community: "newcomer-basics",
    title: "First-week checklist that actually worked for me",
    body: "1. SIN at a Service Canada office (bring your permit).\n2. Bank account — most big banks have a newcomer package with no fees for a year.\n3. Provincial health card, even if there is a waiting period.\n4. Phone plan: prepaid first, contracts need credit history.",
  },
  {
    author: "priya-nair",
    community: "housing-rentals",
    title: "Renting without Canadian credit history",
    body: "Landlords asked me for a credit score I did not have yet. What worked: an employment letter, 3 months of rent up front offered voluntarily, and a reference letter from my previous landlord abroad.",
  },
  {
    author: "marc-dubois",
    community: "winter-daily-life",
    title: "Winter gear: what to buy and what to skip",
    body: "Buy: a parka rated to -30, real winter boots, merino base layers.\nSkip: expensive brands. End-of-season sales in March are 50-70% off.",
  },
];

const DEMO_COMMENTS = [
  {
    author: "demo-newcomer",
    postTitle: "How I got my nursing credentials recognized in Ontario",
    body: "This is really useful, thank you. Did you work in another role while waiting?",
  },
  {
    author: "priya-nair",
    postTitle: "First-week checklist that actually worked for me",
    body: "Adding one: register for the GST/HST credit when you file taxes, a lot of newcomers miss it.",
  },
];

const DEMO_MEMBERSHIPS = [
  "newcomer-basics",
  "housing-rentals",
  "jobs-credentials",
  "winter-daily-life",
  "vancouver-newcomers",
];

async function main() {
  const passwordHash = await hashPassword(PASSWORD);
  const userIds = new Map<string, string>();

  for (const demo of DEMO_USERS) {
    const [city] = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.name, demo.cityName))
      .limit(1);

    const [user] = await db
      .insert(users)
      .values({
        email: demo.email,
        passwordHash,
        emailVerifiedAt: new Date(),
        phone: "+15550000000",
        phoneVerifiedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { passwordHash, emailVerifiedAt: new Date(), phoneVerifiedAt: new Date() },
      })
      .returning({ id: users.id });
    userIds.set(demo.handle, user.id);

    await db
      .insert(profiles)
      .values({
        userId: user.id,
        handle: demo.handle,
        displayName: demo.displayName,
        bio: demo.bio,
        countryOfOrigin: demo.countryOfOrigin,
        provinceCode: demo.provinceCode,
        cityId: city?.id,
        occupation: demo.occupation,
        reputationScore: demo.reputation,
      })
      .onConflictDoNothing();
  }

  const communityRows = await db
    .select({ id: communities.id, slug: communities.slug })
    .from(communities);
  const communityIds = new Map(communityRows.map((row) => [row.slug, row.id]));

  for (const [handle, userId] of userIds) {
    const slugs = handle === "demo-newcomer" ? DEMO_MEMBERSHIPS : communityRows.map((c) => c.slug);
    for (const slug of slugs) {
      const communityId = communityIds.get(slug);
      if (!communityId) continue;
      const inserted = await db
        .insert(communityMembers)
        .values({ communityId, userId })
        .onConflictDoNothing()
        .returning({ userId: communityMembers.userId });
      if (inserted.length > 0) {
        await db
          .update(communities)
          .set({ memberCount: sql`${communities.memberCount} + 1` })
          .where(eq(communities.id, communityId));
      }
    }
  }

  const postIds = new Map<string, number>();
  for (const demo of DEMO_POSTS) {
    const communityId = communityIds.get(demo.community);
    const authorId = userIds.get(demo.author);
    if (!communityId || !authorId) continue;

    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.title, demo.title))
      .limit(1);
    if (existing) {
      postIds.set(demo.title, existing.id);
      continue;
    }

    const [post] = await db
      .insert(posts)
      .values({ communityId, authorId, title: demo.title, body: demo.body })
      .returning({ id: posts.id });
    postIds.set(demo.title, post.id);
    await db
      .update(communities)
      .set({ postCount: sql`${communities.postCount} + 1` })
      .where(eq(communities.id, communityId));
  }

  for (const demo of DEMO_COMMENTS) {
    const postId = postIds.get(demo.postTitle);
    const authorId = userIds.get(demo.author);
    if (!postId || !authorId) continue;
    const [existing] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.body, demo.body))
      .limit(1);
    if (existing) continue;
    await db.insert(comments).values({ postId, authorId, body: demo.body });
    await db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));
  }

  const voterId = userIds.get("marc-dubois");
  if (voterId) {
    for (const postId of postIds.values()) {
      const inserted = await db
        .insert(postVotes)
        .values({ postId, userId: voterId, value: 1 })
        .onConflictDoNothing()
        .returning({ userId: postVotes.userId });
      if (inserted.length > 0) {
        await db
          .update(posts)
          .set({ score: sql`${posts.score} + 1` })
          .where(eq(posts.id, postId));
      }
    }
  }

  console.info(`Demo data ready. Sign in with ${DEMO_USERS[0].email} / ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
