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
  {
    email: "amina@immigranthub.ca",
    handle: "amina-hassan",
    displayName: "Amina Hassan",
    bio: "Arrived in Calgary from Nigeria with two kids. School and benefits questions welcome.",
    countryOfOrigin: "NG",
    provinceCode: "AB",
    cityName: "Calgary",
    occupation: "Accountant",
    reputation: 27,
  },
  {
    email: "wei@immigranthub.ca",
    handle: "wei-zhang",
    displayName: "Wei Zhang",
    bio: "Study permit to PR in Winnipeg. I track immigration paperwork obsessively.",
    countryOfOrigin: "CN",
    provinceCode: "MB",
    cityName: "Winnipeg",
    occupation: "Data analyst",
    reputation: 33,
  },
  {
    email: "olena@immigranthub.ca",
    handle: "olena-kovalenko",
    displayName: "Olena Kovalenko",
    bio: "Came to Ottawa under CUAET. Sharing what worked for housing and French classes.",
    countryOfOrigin: "UA",
    provinceCode: "ON",
    cityName: "Ottawa",
    occupation: "Graphic designer",
    reputation: 21,
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
  {
    author: "wei-zhang",
    community: "immigration-status",
    title: "Study permit to PR: the timeline that actually happened",
    body: "Graduated in April, PGWP approved in 7 weeks, Express Entry profile the same month.\nITA came 11 months later once I had one year of skilled work. Keep every pay stub and a signed reference letter with hours per week — that is what IRCC asked for.",
  },
  {
    author: "amina-hassan",
    community: "schools-families",
    title: "Registering kids in school mid-year in Alberta",
    body: "You do not need a permanent address to register, a lease or utility bill for the area is enough.\nBring passports, permits, immunization records and any school reports (translated is fine). Ask about the free EAL assessment — it took a week for us.",
  },
  {
    author: "amina-hassan",
    community: "calgary-newcomers",
    title: "Cheapest ways to get around Calgary in your first month",
    body: "The low-income monthly transit pass is means tested and was $5.60/month for us in the first year. Apply at a Calgary Transit customer service centre with your notice of assessment or permit.",
  },
  {
    author: "olena-kovalenko",
    community: "ottawa-newcomers",
    title: "Free French classes in Ottawa that accept newcomers fast",
    body: "CLIC/LINC classes through settlement agencies had a 2-3 month waitlist for me, but the community centre conversation circles started the same week and were free.",
  },
  {
    author: "olena-kovalenko",
    community: "ukrainians-in-canada",
    title: "CUAET arrivals: what helped us in the first 30 days",
    body: "Open work permit at the airport, then SIN the same day at Service Canada.\nThe temporary hotel program filled fast — the local Ukrainian church network found us a host family in four days.",
  },
  {
    author: "wei-zhang",
    community: "winnipeg-newcomers",
    title: "Winnipeg rent reality check (2026)",
    body: "A one bedroom near downtown ran us $1,100-1,300 including heat. Ask explicitly whether hydro is included — that is another $80-150 in winter.",
  },
  {
    author: "priya-nair",
    community: "toronto-newcomers",
    title: "Toronto: neighbourhoods that worked for a car-free family",
    body: "We looked only along subway lines and it was worth the extra rent. East York and Danforth gave us the best price per minute of commute.",
  },
  {
    author: "marc-dubois",
    community: "quebec-newcomers",
    title: "Francisation and RAMQ: two things to start on day one",
    body: "RAMQ has a three month waiting period for most, so buy private coverage for that window.\nFrancisation is free and pays a small allowance if you attend full time.",
  },
  {
    author: "amina-hassan",
    community: "nigerians-in-canada",
    title: "Sending money home without losing 8% to fees",
    body: "Bank wires cost us the most. Comparison sites plus a mid-market rate transfer service cut the total cost to around 1%. Always compare the rate, not just the flat fee.",
  },
  {
    author: "demo-newcomer",
    community: "vancouver-newcomers",
    title: "Landed in Vancouver last month — what surprised me",
    body: "Rent is the obvious one, but the hidden cost was furniture. Buy Nothing groups and the local Facebook marketplace furnished our whole apartment for under $400.",
  },
  {
    author: "priya-nair",
    community: "newcomer-basics",
    title: "Building credit from zero in six months",
    body: "A secured credit card with a $500 deposit, one small recurring bill on it, paid in full automatically. My score was usable for a lease by month six.",
  },
  {
    author: "wei-zhang",
    community: "jobs-credentials",
    title: "Canadian-style resume changes that got me interviews",
    body: "Cut it to two pages, dropped photo/age/marital status, and rewrote bullets as impact + number.\nThe biggest single change: a short summary line naming the exact job title I was applying for.",
  },
  {
    author: "olena-kovalenko",
    community: "housing-rentals",
    title: "Red flags I learned to spot in rental listings",
    body: "No viewing allowed, deposit by e-transfer before signing, and a landlord who is always abroad. Anything asking for money before you see the unit and the lease is a scam.",
  },
  {
    author: "marc-dubois",
    community: "winter-daily-life",
    title: "Groceries: how we cut our bill by a third",
    body: "Flyer apps for price matching, ethnic grocers for produce and spices, and warehouse clubs only for things you actually store. Buying seasonal made the biggest difference.",
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
  {
    author: "wei-zhang",
    postTitle: "Renting without Canadian credit history",
    body: "A guarantor letter from my employer also worked, worth asking HR — mine had a template ready.",
  },
  {
    author: "olena-kovalenko",
    postTitle: "Canadian-style resume changes that got me interviews",
    body: "Same experience here. Naming the exact job title in the summary doubled my callback rate.",
  },
  {
    author: "amina-hassan",
    postTitle: "Building credit from zero in six months",
    body: "Which bank did you use? Two of ours wanted a deposit larger than $500.",
  },
  {
    author: "demo-newcomer",
    postTitle: "Study permit to PR: the timeline that actually happened",
    body: "Thank you for the detail on reference letters — I would not have thought to ask for hours per week.",
  },
  {
    author: "marc-dubois",
    postTitle: "Red flags I learned to spot in rental listings",
    body: "Adding one: if the lease is not the standard provincial form, read every clause twice.",
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
