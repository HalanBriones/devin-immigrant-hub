import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles, reputationEvents } from "@/modules/profiles/schema";

type ReputationSource = (typeof reputationEvents.source.enumValues)[number];

export const REPUTATION_REWARDS: Record<"emailVerified" | "phoneVerified", number> = {
  emailVerified: 5,
  phoneVerified: 10,
};

export async function awardReputation(
  userId: string,
  source: ReputationSource,
  delta: number,
  ref?: { type: string; id: string },
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(reputationEvents).values({
      userId,
      source,
      delta,
      refType: ref?.type,
      refId: ref?.id,
    });
    await tx
      .update(profiles)
      .set({ reputationScore: sql`${profiles.reputationScore} + ${delta}` })
      .where(eq(profiles.userId, userId));
  });
}
