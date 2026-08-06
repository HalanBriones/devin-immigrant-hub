import "@/lib/load-env";
import { db } from "@/db/client";
import { cities, interests, languages, provinces } from "@/modules/geo/schema";

const PROVINCES = [
  ["AB", "Alberta", "Alberta"],
  ["BC", "British Columbia", "Colombie-Britannique"],
  ["MB", "Manitoba", "Manitoba"],
  ["NB", "New Brunswick", "Nouveau-Brunswick"],
  ["NL", "Newfoundland and Labrador", "Terre-Neuve-et-Labrador"],
  ["NS", "Nova Scotia", "Nouvelle-Écosse"],
  ["NT", "Northwest Territories", "Territoires du Nord-Ouest"],
  ["NU", "Nunavut", "Nunavut"],
  ["ON", "Ontario", "Ontario"],
  ["PE", "Prince Edward Island", "Île-du-Prince-Édouard"],
  ["QC", "Quebec", "Québec"],
  ["SK", "Saskatchewan", "Saskatchewan"],
  ["YT", "Yukon", "Yukon"],
] as const;

const CITIES: [string, string[]][] = [
  ["AB", ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Fort McMurray"]],
  ["BC", ["Vancouver", "Surrey", "Burnaby", "Victoria", "Kelowna", "Richmond"]],
  ["MB", ["Winnipeg", "Brandon", "Steinbach"]],
  ["NB", ["Moncton", "Saint John", "Fredericton"]],
  ["NL", ["St. John's", "Corner Brook"]],
  ["NS", ["Halifax", "Sydney", "Truro"]],
  ["NT", ["Yellowknife"]],
  ["NU", ["Iqaluit"]],
  [
    "ON",
    [
      "Toronto",
      "Ottawa",
      "Mississauga",
      "Brampton",
      "Hamilton",
      "London",
      "Kitchener",
      "Windsor",
      "Waterloo",
      "Sudbury",
    ],
  ],
  ["PE", ["Charlottetown", "Summerside"]],
  ["QC", ["Montreal", "Quebec City", "Laval", "Gatineau", "Sherbrooke"]],
  ["SK", ["Saskatoon", "Regina", "Prince Albert"]],
  ["YT", ["Whitehorse"]],
];

const LANGUAGES = [
  ["en", "English"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["pt", "Portuguese"],
  ["ar", "Arabic"],
  ["zh", "Mandarin"],
  ["yue", "Cantonese"],
  ["hi", "Hindi"],
  ["pa", "Punjabi"],
  ["ur", "Urdu"],
  ["tl", "Tagalog"],
  ["fa", "Persian"],
  ["ru", "Russian"],
  ["uk", "Ukrainian"],
  ["ta", "Tamil"],
  ["vi", "Vietnamese"],
  ["ko", "Korean"],
  ["sw", "Swahili"],
] as const;

const INTERESTS = [
  ["housing", "Housing & roommates"],
  ["jobs", "Jobs & careers"],
  ["education", "Study & credentials"],
  ["entrepreneurship", "Entrepreneurship"],
  ["tech", "Tech"],
  ["healthcare", "Healthcare"],
  ["trades", "Skilled trades"],
  ["parenting", "Parenting & schools"],
  ["sports", "Sports & outdoors"],
  ["faith", "Faith communities"],
  ["food", "Food & cooking"],
  ["volunteering", "Volunteering"],
  ["language-exchange", "Language exchange"],
  ["arts", "Arts & culture"],
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  await db
    .insert(provinces)
    .values(PROVINCES.map(([code, nameEn, nameFr]) => ({ code, nameEn, nameFr })))
    .onConflictDoNothing();

  await db
    .insert(cities)
    .values(
      CITIES.flatMap(([provinceCode, names]) =>
        names.map((name) => ({ provinceCode, name, slug: slugify(name) })),
      ),
    )
    .onConflictDoNothing();

  await db
    .insert(languages)
    .values(LANGUAGES.map(([code, nameEn]) => ({ code, nameEn })))
    .onConflictDoNothing();

  await db
    .insert(interests)
    .values(INTERESTS.map(([slug, nameEn]) => ({ slug, nameEn })))
    .onConflictDoNothing();

  console.info("Seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
