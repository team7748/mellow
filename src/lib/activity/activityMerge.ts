import type { LearningActivityLedger } from "./activityTypes"
import { normalizeActivityLedger } from "./activityNormalizer"

function newestUpdatedAt(
  left: string | null,
  right: string | null,
): string | null {
  if (!left) return right
  if (!right) return left
  return Date.parse(left) >= Date.parse(right) ? left : right
}

export function mergeActivityLedgers(
  local: LearningActivityLedger,
  cloud: LearningActivityLedger,
): LearningActivityLedger {
  const normalizedLocal = normalizeActivityLedger(local)
  const normalizedCloud = normalizeActivityLedger(cloud)

  return normalizeActivityLedger({
    version: 1,
    events: [...normalizedLocal.events, ...normalizedCloud.events],
    updatedAt: newestUpdatedAt(
      normalizedLocal.updatedAt,
      normalizedCloud.updatedAt,
    ),
  })
}
