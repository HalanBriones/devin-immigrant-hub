"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth/session";
import { notifications } from "@/modules/notifications/schema";

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser();

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

  revalidatePath("/notifications");
  revalidatePath("/feed");
}
