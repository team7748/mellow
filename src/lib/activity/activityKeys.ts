export const GUEST_ACTIVITY_KEY = "english-app:guest:learning-activity"
export const GUEST_ACTIVITY_CLAIMED_BY_KEY =
  "english-app:guest:learning-activity:claimed-by"

export function getActivityStorageKey(userId?: string | null): string {
  return userId
    ? `english-app:user:${userId}:learning-activity`
    : GUEST_ACTIVITY_KEY
}
