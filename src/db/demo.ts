/**
 * Development-only seed: demo accounts with content so the app can be explored manually.
 * Idempotent — re-running resets the demo users' passwords and skips existing content.
 */
import "@/lib/load-env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { generateImage } from "@/db/demo-images";
import { hashPassword } from "@/lib/auth/password";
import { UPLOAD_DIR } from "@/lib/uploads";
import { users } from "@/modules/auth/schema";
import type { PostType } from "@/modules/communities/post-types";
import { attachments } from "@/modules/attachments/schema";
import {
  comments,
  communities,
  communityMembers,
  postVotes,
  posts,
} from "@/modules/communities/schema";
import { eventAttendees, events } from "@/modules/events/schema";
import type { EventTag } from "@/modules/events/tags";
import { cities } from "@/modules/geo/schema";
import type { ListingCategory } from "@/modules/marketplace/categories";
import { listings } from "@/modules/marketplace/schema";
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

const DEMO_POSTS: {
  author: string;
  community: string;
  title: string;
  body: string;
  type: PostType;
}[] = [
  {
    type: "info",
    author: "priya-nair",
    community: "jobs-credentials",
    title: "How I got my nursing credentials recognized in Ontario",
    body: "The order matters: start the NNAS assessment before you land if you can, it took me 5 months.\n\nBudget roughly $1,000 in fees, and ask your school for sealed transcripts early — that was my longest delay.",
  },
  {
    type: "info",
    author: "marc-dubois",
    community: "newcomer-basics",
    title: "First-week checklist that actually worked for me",
    body: "1. SIN at a Service Canada office (bring your permit).\n2. Bank account — most big banks have a newcomer package with no fees for a year.\n3. Provincial health card, even if there is a waiting period.\n4. Phone plan: prepaid first, contracts need credit history.",
  },
  {
    type: "info",
    author: "priya-nair",
    community: "housing-rentals",
    title: "Renting without Canadian credit history",
    body: "Landlords asked me for a credit score I did not have yet. What worked: an employment letter, 3 months of rent up front offered voluntarily, and a reference letter from my previous landlord abroad.",
  },
  {
    type: "info",
    author: "marc-dubois",
    community: "winter-daily-life",
    title: "Winter gear: what to buy and what to skip",
    body: "Buy: a parka rated to -30, real winter boots, merino base layers.\nSkip: expensive brands. End-of-season sales in March are 50-70% off.",
  },
  {
    type: "info",
    author: "wei-zhang",
    community: "immigration-status",
    title: "Study permit to PR: the timeline that actually happened",
    body: "Graduated in April, PGWP approved in 7 weeks, Express Entry profile the same month.\nITA came 11 months later once I had one year of skilled work. Keep every pay stub and a signed reference letter with hours per week — that is what IRCC asked for.",
  },
  {
    type: "info",
    author: "amina-hassan",
    community: "schools-families",
    title: "Registering kids in school mid-year in Alberta",
    body: "You do not need a permanent address to register, a lease or utility bill for the area is enough.\nBring passports, permits, immunization records and any school reports (translated is fine). Ask about the free EAL assessment — it took a week for us.",
  },
  {
    type: "info",
    author: "amina-hassan",
    community: "calgary-newcomers",
    title: "Cheapest ways to get around Calgary in your first month",
    body: "The low-income monthly transit pass is means tested and was $5.60/month for us in the first year. Apply at a Calgary Transit customer service centre with your notice of assessment or permit.",
  },
  {
    type: "service",
    author: "olena-kovalenko",
    community: "ottawa-newcomers",
    title: "Free French classes in Ottawa that accept newcomers fast",
    body: "CLIC/LINC classes through settlement agencies had a 2-3 month waitlist for me, but the community centre conversation circles started the same week and were free.",
  },
  {
    type: "info",
    author: "olena-kovalenko",
    community: "ukrainians-in-canada",
    title: "CUAET arrivals: what helped us in the first 30 days",
    body: "Open work permit at the airport, then SIN the same day at Service Canada.\nThe temporary hotel program filled fast — the local Ukrainian church network found us a host family in four days.",
  },
  {
    type: "info",
    author: "wei-zhang",
    community: "winnipeg-newcomers",
    title: "Winnipeg rent reality check (2026)",
    body: "A one bedroom near downtown ran us $1,100-1,300 including heat. Ask explicitly whether hydro is included — that is another $80-150 in winter.",
  },
  {
    type: "info",
    author: "priya-nair",
    community: "toronto-newcomers",
    title: "Toronto: neighbourhoods that worked for a car-free family",
    body: "We looked only along subway lines and it was worth the extra rent. East York and Danforth gave us the best price per minute of commute.",
  },
  {
    type: "info",
    author: "marc-dubois",
    community: "quebec-newcomers",
    title: "Francisation and RAMQ: two things to start on day one",
    body: "RAMQ has a three month waiting period for most, so buy private coverage for that window.\nFrancisation is free and pays a small allowance if you attend full time.",
  },
  {
    type: "info",
    author: "amina-hassan",
    community: "nigerians-in-canada",
    title: "Sending money home without losing 8% to fees",
    body: "Bank wires cost us the most. Comparison sites plus a mid-market rate transfer service cut the total cost to around 1%. Always compare the rate, not just the flat fee.",
  },
  {
    type: "info",
    author: "demo-newcomer",
    community: "vancouver-newcomers",
    title: "Landed in Vancouver last month — what surprised me",
    body: "Rent is the obvious one, but the hidden cost was furniture. Buy Nothing groups and the local Facebook marketplace furnished our whole apartment for under $400.",
  },
  {
    type: "info",
    author: "priya-nair",
    community: "newcomer-basics",
    title: "Building credit from zero in six months",
    body: "A secured credit card with a $500 deposit, one small recurring bill on it, paid in full automatically. My score was usable for a lease by month six.",
  },
  {
    type: "info",
    author: "wei-zhang",
    community: "jobs-credentials",
    title: "Canadian-style resume changes that got me interviews",
    body: "Cut it to two pages, dropped photo/age/marital status, and rewrote bullets as impact + number.\nThe biggest single change: a short summary line naming the exact job title I was applying for.",
  },
  {
    type: "info",
    author: "olena-kovalenko",
    community: "housing-rentals",
    title: "Red flags I learned to spot in rental listings",
    body: "No viewing allowed, deposit by e-transfer before signing, and a landlord who is always abroad. Anything asking for money before you see the unit and the lease is a scam.",
  },
  {
    type: "info",
    author: "marc-dubois",
    community: "winter-daily-life",
    title: "Groceries: how we cut our bill by a third",
    body: "Flyer apps for price matching, ethnic grocers for produce and spices, and warehouse clubs only for things you actually store. Buying seasonal made the biggest difference.",
  },
  {
    type: "question",
    author: "demo-newcomer",
    community: "newcomer-basics",
    title: "Which bank actually waives fees for newcomers in year one?",
    body: "Two branches quoted me different things for the same newcomer package. Which bank did you open with, and did they ask for a Canadian address before issuing the card?",
  },
  {
    type: "question",
    author: "amina-hassan",
    community: "housing-rentals",
    title: "Is it normal for a landlord to ask for 12 postdated cheques?",
    body: "We were asked for a year of postdated cheques plus first and last month. Is that allowed here, or should I walk away?",
  },
  {
    type: "event",
    author: "olena-kovalenko",
    community: "ottawa-newcomers",
    title: "Newcomer coffee meetup — Saturday 10am, Ottawa Public Library",
    body: "Informal meetup for anyone who arrived in the last year. Ground floor cafe, look for the blue tote bag. No registration, kids welcome.",
  },
  {
    type: "event",
    author: "wei-zhang",
    community: "jobs-credentials",
    title: "Free resume clinic next Thursday 6pm (online)",
    body: "A settlement agency runs a two hour resume and LinkedIn clinic with recruiters reviewing in breakout rooms. Bring a draft; sign up closes the day before.",
  },
  {
    type: "service",
    author: "marc-dubois",
    community: "quebec-newcomers",
    title: "Translator who handles official document translation cheaply",
    body: "Certified translation for diplomas and birth certificates, accepted by IRCC and by the school board. Around $40 per page and a three day turnaround in my case.",
  },
  {
    type: "service",
    author: "priya-nair",
    community: "toronto-newcomers",
    title: "Moving help: two students with a van, $60/hour",
    body: "They moved our one bedroom across the city in three hours. Cash or e-transfer, they bring straps and blankets but not boxes.",
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

/** Post titles / comment bodies that get generated placeholder photos, with how many. */
const POST_PHOTOS: Record<string, number> = {
  "Winter gear: what to buy and what to skip": 2,
  "Landed in Vancouver last month — what surprised me": 3,
  "Toronto: neighbourhoods that worked for a car-free family": 1,
  "Winnipeg rent reality check (2026)": 2,
  "Cheapest ways to get around Calgary in your first month": 1,
  "Free French classes in Ottawa that accept newcomers fast": 1,
  "Groceries: how we cut our bill by a third": 2,
  "Red flags I learned to spot in rental listings": 1,
  "Newcomer coffee meetup — Saturday 10am, Ottawa Public Library": 1,
  "Moving help: two students with a van, $60/hour": 2,
};

const COMMENT_PHOTOS: Record<string, number> = {
  "A guarantor letter from my employer also worked, worth asking HR — mine had a template ready.": 1,
  "Adding one: if the lease is not the standard provincial form, read every clause twice.": 2,
};

async function attachPhotos(
  owner:
    | { postId: number }
    | { commentId: number }
    | { eventId: number }
    | { listingId: number },
  seed: string,
  count: number,
): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const image = generateImage(`${seed}#${index}`);
    await writeFile(path.join(UPLOAD_DIR, image.fileName), image.data);
    await db
      .insert(attachments)
      .values({
        ...owner,
        fileName: image.fileName,
        mimeType: image.mimeType,
        byteSize: image.byteSize,
      })
      .onConflictDoNothing();
  }
}

type DemoEvent = {
  host: string;
  title: string;
  description: string;
  inDays: number;
  hour: number;
  locationName: string;
  cityName: string;
  tags: EventTag[];
  photos: number;
  guests: string[];
};

const DEMO_EVENTS: DemoEvent[] = [
  {
    host: "priya-nair",
    title: "Newcomer potluck — bring a dish from home",
    description:
      "Everyone brings one dish from their home country and we eat together in the community room. Kids welcome, there is a play corner. Label your dish with the ingredients so people with allergies can pick safely. We usually end with a round of introductions so nobody leaves without meeting someone.",
    inDays: 6,
    hour: 18,
    locationName: "Regent Park Community Centre, 402 Shuter St",
    cityName: "Toronto",
    tags: ["food", "family", "social"],
    photos: 2,
    guests: ["demo-newcomer", "marc-dubois", "amina-hassan"],
  },
  {
    host: "marc-dubois",
    title: "Resume clinic for internationally trained professionals",
    description:
      "Bring a printed copy of your resume and we rewrite it together in Canadian format: no photo, no age, achievements over duties. Two recruiters are joining to answer questions about credential recognition. Free, no registration, drop in any time in the two hours.",
    inDays: 12,
    hour: 17,
    locationName: "Bibliothèque Saint-Sulpice, 1700 rue Saint-Denis",
    cityName: "Montreal",
    tags: ["jobs", "workshop", "networking"],
    photos: 1,
    guests: ["wei-zhang"],
  },
  {
    host: "amina-hassan",
    title: "English–French conversation walk",
    description:
      "A slow walk along the river where we swap thirty minutes of English for thirty minutes of French. No teachers, no grammar drills, just conversation with people who are also learning. Dress warm and bring water.",
    inDays: 3,
    hour: 10,
    locationName: "Rideau Canal, Fifth Avenue entrance",
    cityName: "Ottawa",
    tags: ["language", "outdoors", "social"],
    photos: 2,
    guests: ["olena-kovalenko", "demo-newcomer"],
  },
  {
    host: "wei-zhang",
    title: "Winter gear swap and free tune-up",
    description:
      "Outgrown boots, jackets and snow pants find a new owner. Bring what no longer fits and take what you need — no money changes hands. A volunteer will patch small tears and replace zippers on the spot.",
    inDays: 20,
    hour: 13,
    locationName: "Mount Pleasant Neighbourhood House, 800 E Broadway",
    cityName: "Vancouver",
    tags: ["volunteering", "family", "social"],
    photos: 1,
    guests: ["priya-nair"],
  },
  {
    host: "olena-kovalenko",
    title: "Weekend soccer pick-up game",
    description:
      "Mixed level pick-up game, all ages and abilities. We split teams on the spot so it does not matter if you come alone. Bring indoor shoes; the field is booked for two hours.",
    inDays: -9,
    hour: 15,
    locationName: "Genesis Centre, 7555 Falconridge Blvd NE",
    cityName: "Calgary",
    tags: ["sports", "social"],
    photos: 1,
    guests: ["marc-dubois", "wei-zhang"],
  },
];

type DemoListing = {
  seller: string;
  category: ListingCategory;
  title: string;
  description: string;
  price: number | null;
  provinceCode: string;
  cityName: string;
  community: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  photos: number;
};

const DEMO_LISTINGS: DemoListing[] = [
  {
    seller: "priya-nair",
    category: "housing",
    title: "Bright 1-bedroom near Danforth, utilities included",
    description:
      "Second floor of a semi-detached house, ten minutes on foot from Pape station. Heat, hydro and water are included; laundry is shared with the owners downstairs. No credit history required — an employment letter or a settlement agency reference is enough. Available from the first of next month, twelve month lease.",
    price: 1850,
    provinceCode: "ON",
    cityName: "Toronto",
    community: "housing-rentals",
    contactEmail: "priya@immigranthub.ca",
    contactPhone: "+1 416 555 0142",
    photos: 3,
  },
  {
    seller: "marc-dubois",
    category: "housing",
    title: "3½ in Villeray, heated, available October 1st",
    description:
      "Quiet ground floor apartment on a tree-lined street, ten minutes from Jarry metro. Heating and hot water are included, the fridge and stove stay. The landlord speaks French and Creole and has rented to newly arrived families before, so no Canadian credit history is required.",
    price: 1250,
    provinceCode: "QC",
    cityName: "Montreal",
    community: "housing-rentals",
    contactEmail: "marc@immigranthub.ca",
    contactPhone: null,
    photos: 1,
  },
  {
    seller: "wei-zhang",
    category: "buy_sell",
    title: "Full winter kit for a family of three, barely used",
    description:
      "Two adult parkas rated to -30, one kids parka, three pairs of boots (sizes 8, 10 and kids 2), snow pants and a bin of mitts and toques. We bought all of it last October and are moving to Victoria. Everything washed and ready. Selling as one lot only, pick up in the north end.",
    price: 220,
    provinceCode: "MB",
    cityName: "Winnipeg",
    community: "winter-daily-life",
    contactEmail: "wei@immigranthub.ca",
    contactPhone: "+1 204 555 0188",
    photos: 2,
  },
  {
    seller: "amina-hassan",
    category: "buy_sell",
    title: "Kids' bunk bed, mattresses included",
    description:
      "Solid pine bunk bed with both mattresses, taken apart and ready to load into a van. We used it for two years and are switching to single beds now that the kids are older. Small dent on one post, everything else is sound. Pick up in the northeast, cash only.",
    price: 180,
    provinceCode: "AB",
    cityName: "Calgary",
    community: null,
    contactEmail: "amina@immigranthub.ca",
    contactPhone: "+1 403 555 0119",
    photos: 1,
  },
  {
    seller: "olena-kovalenko",
    category: "housing",
    title: "Room in a shared apartment, women only, near uOttawa",
    description:
      "Furnished room in a three bedroom apartment shared with two Ukrainian students. Bed, desk, wardrobe and a shared kitchen and bathroom. Internet and utilities included, no deposit beyond the first month. Bus 11 stops at the corner; the campus is a twenty minute walk.",
    price: 750,
    provinceCode: "ON",
    cityName: "Ottawa",
    community: "housing-rentals",
    contactEmail: "olena@immigranthub.ca",
    contactPhone: null,
    photos: 2,
  },
  {
    seller: "demo-newcomer",
    category: "buy_sell",
    title: "IKEA desk and office chair, moving out sale",
    description:
      "Bekant desk (160x80) and a Markus chair, both two years old and in good shape apart from a scratch on the desk edge. Ideal for anyone setting up a first apartment. Pick up only in Mount Pleasant, I can help you carry them to the car.",
    price: 120,
    provinceCode: "BC",
    cityName: "Vancouver",
    community: "vancouver-newcomers",
    contactEmail: "demo@immigranthub.ca",
    contactPhone: null,
    photos: 1,
  },
  {
    seller: "priya-nair",
    category: "buy_sell",
    title: "Pressure cooker, tawa and a full set of pots",
    description:
      "Everything I bought when I landed and no longer need after moving in with family: a five litre pressure cooker, a cast iron tawa and four pots with lids. All clean and in working order. Selling the lot for less than one new pot costs, pick up near Pape station.",
    price: 60,
    provinceCode: "ON",
    cityName: "Toronto",
    community: null,
    contactEmail: null,
    contactPhone: "+1 416 555 0177",
    photos: 1,
  },
  {
    seller: "wei-zhang",
    category: "housing",
    title: "Basement suite in Surrey, separate entrance, furnished",
    description:
      "One bedroom suite with its own entrance, kitchenette and bathroom, fully furnished. Utilities and internet included, laundry once a week upstairs. Ten minute walk to the SkyTrain and the bus loop. Suits a single person or a couple, no smoking, references welcome from abroad.",
    price: 1100,
    provinceCode: "BC",
    cityName: "Surrey",
    community: "housing-rentals",
    contactEmail: "wei@immigranthub.ca",
    contactPhone: null,
    photos: 1,
  },
];

function eventDate(inDays: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + inDays);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const DEMO_MEMBERSHIPS = [
  "newcomer-basics",
  "housing-rentals",
  "jobs-credentials",
  "winter-daily-life",
  "vancouver-newcomers",
];

async function main() {
  await mkdir(UPLOAD_DIR, { recursive: true });
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
        set: {
          passwordHash,
          emailVerifiedAt: new Date(),
          phoneVerifiedAt: new Date(),
        },
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
    const slugs =
      handle === "demo-newcomer"
        ? DEMO_MEMBERSHIPS
        : communityRows.map((c) => c.slug);
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

    let postId = existing?.id;
    if (postId) {
      await db
        .update(posts)
        .set({ type: demo.type })
        .where(eq(posts.id, postId));
    } else {
      const [post] = await db
        .insert(posts)
        .values({
          communityId,
          authorId,
          title: demo.title,
          body: demo.body,
          type: demo.type,
        })
        .returning({ id: posts.id });
      postId = post.id;
      await db
        .update(communities)
        .set({ postCount: sql`${communities.postCount} + 1` })
        .where(eq(communities.id, communityId));
    }
    postIds.set(demo.title, postId);

    const photos = POST_PHOTOS[demo.title];
    if (photos) await attachPhotos({ postId }, `post:${demo.title}`, photos);
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
    let commentId = existing?.id;
    if (!commentId) {
      const [comment] = await db
        .insert(comments)
        .values({ postId, authorId, body: demo.body })
        .returning({ id: comments.id });
      commentId = comment.id;
      await db
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, postId));
    }

    const photos = COMMENT_PHOTOS[demo.body];
    if (photos)
      await attachPhotos({ commentId }, `comment:${demo.body}`, photos);
  }

  for (const demo of DEMO_EVENTS) {
    const hostId = userIds.get(demo.host);
    if (!hostId) continue;
    const [existing] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.title, demo.title))
      .limit(1);
    if (existing) continue;

    const guestIds = demo.guests
      .map((handle) => userIds.get(handle))
      .filter((id): id is string => Boolean(id));

    const [event] = await db
      .insert(events)
      .values({
        hostId,
        title: demo.title,
        description: demo.description,
        startsAt: eventDate(demo.inDays, demo.hour),
        locationName: demo.locationName,
        cityName: demo.cityName,
        tags: demo.tags,
        attendeeCount: guestIds.length + 1,
      })
      .returning({ id: events.id });

    await db
      .insert(eventAttendees)
      .values(
        [hostId, ...guestIds].map((userId) => ({ eventId: event.id, userId })),
      )
      .onConflictDoNothing();

    await attachPhotos({ eventId: event.id }, `event:${demo.title}`, demo.photos);
  }

  for (const demo of DEMO_LISTINGS) {
    const sellerId = userIds.get(demo.seller);
    if (!sellerId) continue;
    const [existing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.title, demo.title))
      .limit(1);
    if (existing) continue;

    const [city] = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.name, demo.cityName))
      .limit(1);

    const [listing] = await db
      .insert(listings)
      .values({
        sellerId,
        category: demo.category,
        title: demo.title,
        description: demo.description,
        priceCents: demo.price === null ? null : demo.price * 100,
        provinceCode: demo.provinceCode,
        cityId: city?.id,
        communityId: demo.community
          ? communityIds.get(demo.community)
          : undefined,
        contactEmail: demo.contactEmail,
        contactPhone: demo.contactPhone,
      })
      .returning({ id: listings.id });

    if (demo.photos > 0) {
      await attachPhotos(
        { listingId: listing.id },
        `listing:${demo.title}`,
        demo.photos,
      );
    }
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

  console.info(
    `Demo data ready. Sign in with ${DEMO_USERS[0].email} / ${PASSWORD}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
