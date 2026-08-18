import type { CurrentUser } from "@/lib/auth/session";

export function isModerator(user: CurrentUser): boolean {
  return user.role === "moderator" || user.role === "admin";
}
