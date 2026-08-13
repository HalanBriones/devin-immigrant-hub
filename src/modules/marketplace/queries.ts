import { and, desc, eq, gte, inArray, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { imageUrl } from "@/lib/uploads";
import { attachments } from "@/modules/attachments/schema";
import { users } from "@/modules/auth/schema";
import { communities } from "@/modules/communities/schema";
import { cities, provinces } from "@/modules/geo/schema";
import {
  asListingCategory,
  type ListingCategory,
} from "@/modules/marketplace/categories";
import { listings } from "@/modules/marketplace/schema";
import { profiles } from "@/modules/profiles/schema";

export type ListingSummary = {
  id: number;
  category: ListingCategory;
  status: "active" | "closed";
  title: string;
  description: string;
  priceCents: number | null;
  provinceCode: string;
  provinceName: string;
  cityName: string | null;
  communitySlug: string | null;
  communityName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  sellerHandle: string;
  sellerName: string;
  sellerReputation: number;
  sellerVerified: boolean;
  images: string[];
};

export type ListingFilters = {
  category?: ListingCategory;
  provinceCode?: string;
  cityId?: number;
  communityId?: number;
  postedWithinDays?: number;
  verifiedOnly?: boolean;
};

const listingSelection = {
  id: listings.id,
  category: listings.category,
  status: listings.status,
  title: listings.title,
  description: listings.description,
  priceCents: listings.priceCents,
  provinceCode: listings.provinceCode,
  provinceName: provinces.nameEn,
  cityName: cities.name,
  communitySlug: communities.slug,
  communityName: communities.name,
  contactEmail: listings.contactEmail,
  contactPhone: listings.contactPhone,
  createdAt: listings.createdAt,
  sellerHandle: profiles.handle,
  sellerName: profiles.displayName,
  sellerReputation: profiles.reputationScore,
  sellerVerified: sql<boolean>`${users.emailVerifiedAt} is not null`,
};

type ListingRow = Omit<ListingSummary, "category" | "images"> & {
  category: string;
};

async function imagesByListing(ids: number[]): Promise<Map<number, string[]>> {
  const byListing = new Map<number, string[]>();
  if (ids.length === 0) return byListing;

  const rows = await db
    .select({
      listingId: attachments.listingId,
      fileName: attachments.fileName,
    })
    .from(attachments)
    .where(
      and(inArray(attachments.listingId, ids), isNotNull(attachments.listingId)),
    )
    .orderBy(attachments.id);

  for (const row of rows) {
    if (row.listingId === null) continue;
    const urls = byListing.get(row.listingId) ?? [];
    urls.push(imageUrl(row.fileName));
    byListing.set(row.listingId, urls);
  }
  return byListing;
}

async function toSummaries(rows: ListingRow[]): Promise<ListingSummary[]> {
  const byListing = await imagesByListing(rows.map((row) => row.id));
  return rows.flatMap((row) => {
    const category = asListingCategory(row.category);
    if (!category) return [];
    return [{ ...row, category, images: byListing.get(row.id) ?? [] }];
  });
}

function baseQuery() {
  return db
    .select(listingSelection)
    .from(listings)
    .innerJoin(profiles, eq(profiles.userId, listings.sellerId))
    .innerJoin(users, eq(users.id, listings.sellerId))
    .innerJoin(provinces, eq(provinces.code, listings.provinceCode))
    .leftJoin(cities, eq(cities.id, listings.cityId))
    .leftJoin(communities, eq(communities.id, listings.communityId));
}

export async function listListings(
  filters: ListingFilters,
): Promise<ListingSummary[]> {
  const conditions: SQL[] = [eq(listings.status, "active")];
  if (filters.category) {
    conditions.push(eq(listings.category, filters.category));
  }
  if (filters.provinceCode) {
    conditions.push(eq(listings.provinceCode, filters.provinceCode));
  }
  if (filters.cityId) conditions.push(eq(listings.cityId, filters.cityId));
  if (filters.communityId) {
    conditions.push(eq(listings.communityId, filters.communityId));
  }
  if (filters.postedWithinDays) {
    const since = new Date();
    since.setDate(since.getDate() - filters.postedWithinDays);
    conditions.push(gte(listings.createdAt, since));
  }
  if (filters.verifiedOnly) conditions.push(isNotNull(users.emailVerifiedAt));

  const rows = await baseQuery()
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt))
    .limit(60);
  return toSummaries(rows);
}

export async function getListing(id: number): Promise<ListingSummary | null> {
  const [row] = await baseQuery().where(eq(listings.id, id)).limit(1);
  if (!row) return null;
  const [summary] = await toSummaries([row]);
  return summary ?? null;
}

export async function listListingsBySeller(
  sellerId: string,
): Promise<ListingSummary[]> {
  const rows = await baseQuery()
    .where(eq(listings.sellerId, sellerId))
    .orderBy(desc(listings.createdAt))
    .limit(60);
  return toSummaries(rows);
}
