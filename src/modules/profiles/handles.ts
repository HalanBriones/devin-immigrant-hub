import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/modules/profiles/schema";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export async function generateUniqueHandle(displayName: string): Promise<string> {
  const base = slugify(displayName) || "newcomer";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const [existing] = await db
      .select({ handle: profiles.handle })
      .from(profiles)
      .where(eq(profiles.handle, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
