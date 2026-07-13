export const LEGACY_VOCAB_KEY = "thai-english-vocab-progress";
export const MIGRATION_VOCAB_V1_KEY = "english-app:migrations:legacy-vocab-v1";
export const GUEST_CLAIM_MARKER_PREFIX = "english-app:guest:vocabulary:claimed-by";

export function getVocabularyStorageKey(userId: string | null | undefined): string {
  if (!userId) {
    return "english-app:guest:vocabulary";
  }
  return `english-app:user:${userId}:vocabulary`;
}

export function getGuestClaimMarkerKey(): string {
  return GUEST_CLAIM_MARKER_PREFIX;
}

export function getGrammarStorageKey(userId: string | null | undefined): string {
  if (!userId) {
    return "english-app:guest:grammar";
  }
  return `english-app:user:${userId}:grammar`;
}

export function getSrsStorageKey(userId: string | null | undefined): string {
  if (!userId) {
    return "english-app:guest:srs";
  }
  return `english-app:user:${userId}:srs`;
}
