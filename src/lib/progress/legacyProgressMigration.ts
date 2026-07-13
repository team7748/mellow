import { LEGACY_VOCAB_KEY, MIGRATION_VOCAB_V1_KEY, getVocabularyStorageKey } from "./progressKeys";
import { normalizeUserProgress } from "./vocabularyNormalizer";

export function runLegacyMigration(): void {
  try {
    const hasMigrated = localStorage.getItem(MIGRATION_VOCAB_V1_KEY) === "completed";
    if (hasMigrated) return;

    const legacyDataRaw = localStorage.getItem(LEGACY_VOCAB_KEY);
    if (!legacyDataRaw) {
      // Nothing to migrate
      localStorage.setItem(MIGRATION_VOCAB_V1_KEY, "completed");
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(legacyDataRaw);
    } catch {
      // Corrupt legacy data, mark as migrated to stop trying
      localStorage.setItem(MIGRATION_VOCAB_V1_KEY, "completed");
      return;
    }

    // Normalize
    const normalized = normalizeUserProgress(parsed);
    
    // Save to guest key
    const guestKey = getVocabularyStorageKey(null);
    localStorage.setItem(guestKey, JSON.stringify(normalized));

    // Mark as migrated
    localStorage.setItem(MIGRATION_VOCAB_V1_KEY, "completed");
  } catch (err) {
    console.error("Failed to run legacy vocabulary migration", err);
  }
}
