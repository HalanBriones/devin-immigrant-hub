import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/modules/auth/schema";
import { cities, interests, languages, provinces } from "@/modules/geo/schema";
import { profileInterests, profileLanguages, profiles } from "@/modules/profiles/schema";

export type PublicProfile = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  countryOfOrigin: string | null;
  provinceCode: string | null;
  provinceName: string | null;
  cityId: number | null;
  cityName: string | null;
  occupation: string | null;
  reputationScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  memberSince: Date;
  languages: string[];
  interests: number[];
};

async function loadProfileRow(where: ReturnType<typeof eq>) {
  const [row] = await db
    .select({
      userId: profiles.userId,
      handle: profiles.handle,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      bio: profiles.bio,
      countryOfOrigin: profiles.countryOfOrigin,
      provinceCode: profiles.provinceCode,
      provinceName: provinces.nameEn,
      cityId: profiles.cityId,
      cityName: cities.name,
      occupation: profiles.occupation,
      reputationScore: profiles.reputationScore,
      emailVerifiedAt: users.emailVerifiedAt,
      phoneVerifiedAt: users.phoneVerifiedAt,
      memberSince: users.createdAt,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .leftJoin(provinces, eq(provinces.code, profiles.provinceCode))
    .leftJoin(cities, eq(cities.id, profiles.cityId))
    .where(where)
    .limit(1);
  return row;
}

async function withRelations(
  row: NonNullable<Awaited<ReturnType<typeof loadProfileRow>>>,
): Promise<PublicProfile> {
  const [spoken, chosen] = await Promise.all([
    db
      .select({ code: profileLanguages.languageCode })
      .from(profileLanguages)
      .where(eq(profileLanguages.userId, row.userId)),
    db
      .select({ id: profileInterests.interestId })
      .from(profileInterests)
      .where(eq(profileInterests.userId, row.userId)),
  ]);

  return {
    userId: row.userId,
    handle: row.handle,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    countryOfOrigin: row.countryOfOrigin,
    provinceCode: row.provinceCode,
    provinceName: row.provinceName,
    cityId: row.cityId,
    cityName: row.cityName,
    occupation: row.occupation,
    reputationScore: row.reputationScore,
    emailVerified: row.emailVerifiedAt !== null,
    phoneVerified: row.phoneVerifiedAt !== null,
    memberSince: row.memberSince,
    languages: spoken.map((item) => item.code),
    interests: chosen.map((item) => item.id),
  };
}

export async function getProfileByHandle(handle: string): Promise<PublicProfile | null> {
  const row = await loadProfileRow(eq(profiles.handle, handle));
  return row ? withRelations(row) : null;
}

export async function getProfileByUserId(userId: string): Promise<PublicProfile | null> {
  const row = await loadProfileRow(eq(profiles.userId, userId));
  return row ? withRelations(row) : null;
}

export function listProvinces() {
  return db.select().from(provinces).orderBy(asc(provinces.nameEn));
}

export function listCities(provinceCode?: string) {
  const query = db
    .select({ id: cities.id, name: cities.name, provinceCode: cities.provinceCode })
    .from(cities);
  return provinceCode
    ? query.where(eq(cities.provinceCode, provinceCode)).orderBy(asc(cities.name))
    : query.orderBy(asc(cities.name));
}

export function listLanguages() {
  return db.select().from(languages).orderBy(asc(languages.nameEn));
}

export function listInterests() {
  return db.select().from(interests).orderBy(asc(interests.nameEn));
}
