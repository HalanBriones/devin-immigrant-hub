import "@/lib/load-env";
import { db } from "@/db/client";
import { communities } from "@/modules/communities/schema";
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

const TOPIC_COMMUNITIES: [string, string][] = [
  ["Newcomer basics", "SIN, health card, banking, credit history and your first weeks in Canada."],
  ["Housing & rentals", "Finding a place, leases, tenant rights and roommate searches."],
  ["Jobs & credentials", "Canadian resumes, licensing bodies, credential recognition and interviews."],
  ["Immigration & status", "PR, work permits, study permits, sponsorship and citizenship questions."],
  ["Schools & families", "Registering kids, daycare, benefits and parenting in a new country."],
  ["Winter & daily life", "Clothing, transit, groceries and surviving your first Canadian winter."],
];

const PROVINCE_COMMUNITIES = ["AB", "BC", "MB", "NS", "ON", "QC", "SK"] as const;

const CITY_COMMUNITIES: [string, string][] = [
  ["BC", "Vancouver"],
  ["ON", "Toronto"],
  ["ON", "Ottawa"],
  ["AB", "Calgary"],
  ["QC", "Montreal"],
  ["MB", "Winnipeg"],
];

const ORIGIN_COMMUNITIES: [string, string][] = [
  ["IN", "Indians in Canada"],
  ["PH", "Filipinos in Canada"],
  ["CN", "Chinese community in Canada"],
  ["NG", "Nigerians in Canada"],
  ["CL", "Chileans in Canada"],
  ["VE", "Venezuelans in Canada"],
  ["UA", "Ukrainians in Canada"],
  ["SY", "Syrians in Canada"],
];

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

  const provinceRows = await db.select().from(provinces);
  const cityRows = await db.select().from(cities);
  const provinceName = new Map(provinceRows.map((row) => [row.code, row.nameEn]));

  const communityRows = [
    ...TOPIC_COMMUNITIES.map(([name, description]) => ({
      slug: slugify(name),
      name,
      description,
      kind: "topic" as const,
    })),
    ...PROVINCE_COMMUNITIES.map((code) => ({
      slug: slugify(`${provinceName.get(code) ?? code} newcomers`),
      name: `${provinceName.get(code) ?? code} newcomers`,
      description: `Settlement questions and local tips for ${provinceName.get(code) ?? code}.`,
      kind: "province" as const,
      provinceCode: code,
    })),
    ...CITY_COMMUNITIES.flatMap(([provinceCode, cityName]) => {
      const city = cityRows.find(
        (row) => row.provinceCode === provinceCode && row.name === cityName,
      );
      if (!city) return [];
      return [
        {
          slug: slugify(`${cityName} newcomers`),
          name: `${cityName} newcomers`,
          description: `Housing, jobs, events and everyday life in ${cityName}.`,
          kind: "city" as const,
          provinceCode,
          cityId: city.id,
        },
      ];
    }),
    ...ORIGIN_COMMUNITIES.map(([countryOfOrigin, name]) => ({
      slug: slugify(name),
      name,
      description: `Connect with people from your country of origin across Canada.`,
      kind: "origin" as const,
      countryOfOrigin,
    })),
  ];

  await db.insert(communities).values(communityRows).onConflictDoNothing();

  console.info(`Seed complete (${communityRows.length} communities)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
