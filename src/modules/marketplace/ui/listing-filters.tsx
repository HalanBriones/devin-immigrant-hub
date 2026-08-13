import Link from "next/link";
import { inputClass } from "@/components/ui/field";
import {
  LISTING_CATEGORIES,
  LISTING_CATEGORY_LABELS,
} from "@/modules/marketplace/categories";
import type { ListingFilters } from "@/modules/marketplace/queries";

export type FilterOptions = {
  provinces: { code: string; nameEn: string }[];
  cities: { id: number; name: string; provinceCode: string }[];
  communities: { id: number; name: string }[];
};

const DATE_RANGES = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export function ListingFilterBar({
  filters,
  options,
}: {
  filters: ListingFilters;
  options: FilterOptions;
}) {
  const cities = filters.provinceCode
    ? options.cities.filter((city) => city.provinceCode === filters.provinceCode)
    : options.cities;
  const active =
    Boolean(filters.category) ||
    Boolean(filters.provinceCode) ||
    Boolean(filters.cityId) ||
    Boolean(filters.communityId) ||
    Boolean(filters.postedWithinDays) ||
    Boolean(filters.verifiedOnly);

  return (
    <form method="get" className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Filters</h2>
        {active ? (
          <Link href="/marketplace" className="text-xs font-medium text-sky-700">
            Clear all
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className={inputClass}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {LISTING_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {LISTING_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>

        <select
          name="province"
          defaultValue={filters.provinceCode ?? ""}
          className={inputClass}
          aria-label="Province"
        >
          <option value="">All provinces</option>
          {options.provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.nameEn}
            </option>
          ))}
        </select>

        <select
          name="city"
          defaultValue={filters.cityId ? String(filters.cityId) : ""}
          className={inputClass}
          aria-label="City"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        <select
          name="community"
          defaultValue={filters.communityId ? String(filters.communityId) : ""}
          className={inputClass}
          aria-label="Community"
        >
          <option value="">Any community</option>
          {options.communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>

        <select
          name="since"
          defaultValue={
            filters.postedWithinDays ? String(filters.postedWithinDays) : ""
          }
          className={inputClass}
          aria-label="Posted"
        >
          <option value="">Any date</option>
          {DATE_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="verified"
            value="1"
            defaultChecked={filters.verifiedOnly}
            className="size-4 accent-sky-600"
          />
          Verified sellers only
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          Apply filters
        </button>
      </div>
    </form>
  );
}
