import type {
  LearningActivityEvent,
  LearningActivityLedger,
} from "./activityTypes"
import { supabase } from "../supabaseClient"
import {
  normalizeActivityEvent,
  normalizeActivityLedger,
} from "./activityNormalizer"

export type LearningActivityEventRow = {
  id: string
  user_id: string
  kind: string
  mode: string
  entity_id: string
  occurred_at: string
  local_date: string
  timezone_offset_minutes: number
  metadata: Record<string, unknown>
}

export function activityEventToRow(
  userId: string,
  event: LearningActivityEvent,
): LearningActivityEventRow {
  return {
    id: event.id,
    user_id: userId,
    kind: event.kind,
    mode: event.mode,
    entity_id: event.entityId,
    occurred_at: event.occurredAt,
    local_date: event.localDate,
    timezone_offset_minutes: event.timezoneOffsetMinutes,
    metadata: event.metadata ?? {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function activityRowToEvent(row: unknown): LearningActivityEvent | null {
  if (!isRecord(row)) return null

  return normalizeActivityEvent({
    id: row.id,
    kind: row.kind,
    mode: row.mode,
    entityId: row.entity_id,
    occurredAt: row.occurred_at,
    localDate: row.local_date,
    timezoneOffsetMinutes: row.timezone_offset_minutes,
    metadata: row.metadata,
  })
}

export async function loadCloudActivityLedger(
  userId: string,
): Promise<LearningActivityLedger> {
  const { data, error } = await supabase
    .from("learning_activity_events")
    .select(
      "id,user_id,kind,mode,entity_id,occurred_at,local_date,timezone_offset_minutes,metadata",
    )
    .eq("user_id", userId)

  if (error) throw error

  const events = (data ?? [])
    .map(activityRowToEvent)
    .filter((event): event is LearningActivityEvent => event !== null)

  return normalizeActivityLedger({ version: 1, events, updatedAt: null })
}

export async function upsertCloudActivityEvents(
  userId: string,
  events: LearningActivityEvent[],
): Promise<void> {
  const normalized = normalizeActivityLedger({
    version: 1,
    events,
    updatedAt: null,
  })
  if (normalized.events.length === 0) return

  const { error } = await supabase
    .from("learning_activity_events")
    .upsert(
      normalized.events.map((event) => activityEventToRow(userId, event)),
      { onConflict: "id" },
    )

  if (error) throw error
}
