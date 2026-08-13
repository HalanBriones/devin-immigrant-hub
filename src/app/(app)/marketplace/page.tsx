import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listCommunities } from "@/modules/communities/queries";
import { asListingCategory } from "@/modules/marketplace/categories";
import { listListings, type ListingFilters } from "@/modules/marketplace/queries";
import { ListingCard } from "@/modules/marketplace/ui/listing-card";
import { ListingFilterBar } from "@/modules/marketplace/ui/listing-filters";
import { listCities, listProvinces } from "@/modules/profiles/queries";

type SearchParams = Record<string, string | string[] | undefined>;

function first(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function positiveInt(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseFilters(params: SearchParams): ListingFilters {
  const province = first(params, "province");
  return {
    category: asListingCategory(first(params, "category") ?? "") ?? undefined,
    provinceCode: province && province.length === 2 ? province : undefined,
    cityId: positiveInt(first(params, "city")),
    communityId: positiveInt(first(params, "community")),
    postedWithinDays: positiveInt(first(params, "since")),
    verifiedOnly: first(params, "verified") === "1",
  };
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const user = await getCurrentUser();
  const [listings, provinces, cities, communities] = await Promise.all([
    listListings(filters),
    listProvinces(),
    listCities(),
    listCommunities(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
          <p className="text-sm text-slate-600">
            Things to buy and sell, and rooms and apartments for rent, posted by
            other newcomers. Contact details are on each listing — no fees, no
            middlemen.
          </p>
        </div>
        <Link
          href={user ? "/marketplace/new" : "/register"}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          Post a listing
        </Link>
      </header>

      <ListingFilterBar
        filters={filters}
        options={{
          provinces: provinces.map((province) => ({
            code: province.code,
            nameEn: province.nameEn,
          })),
          cities,
          communities: communities.map((community) => ({
            id: community.id,
            name: community.name,
          })),
        }}
      />

      <section className="flex flex-col gap-4">
        <h2 className="section-title">
          {listings.length} {listings.length === 1 ? "listing" : "listings"}
        </h2>
        {listings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            Nothing matches these filters yet — try widening them.
          </p>
        ) : (
          listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        )}
      </section>
    </div>
  );
}
