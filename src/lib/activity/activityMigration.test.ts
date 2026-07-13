/// <reference types="node" />
// @vitest-environment node

import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const migrationUrl = new URL(
  "../../../supabase/migrations/004_learning_activity_events.sql",
  import.meta.url,
)

describe("004_learning_activity_events migration", () => {
  const sql = readFileSync(migrationUrl, "utf8").toLowerCase()

  it("creates the idempotent activity table with validated event columns", () => {
    expect(sql).toContain(
      "create table if not exists public.learning_activity_events",
    )
    expect(sql).toMatch(/id\s+text\s+primary key/)
    expect(sql).toMatch(
      /user_id\s+uuid\s+not null\s+references auth\.users\(id\)\s+on delete cascade/,
    )
    expect(sql).toContain("kind in ('vocabulary_answer', 'grammar_answer', 'conversation_completed')")
    expect(sql).toContain("mode in ('flashcard', 'quiz', 'grammar', 'speak')")
    expect(sql).toContain("timezone_offset_minutes between -840 and 840")
    expect(sql).toContain("metadata jsonb not null default '{}'::jsonb")
  })

  it("indexes user and local date and enables row level security", () => {
    expect(sql).toMatch(
      /create index if not exists[^;]+on public\.learning_activity_events\s*\(user_id, local_date\)/,
    )
    expect(sql).toContain(
      "alter table public.learning_activity_events enable row level security",
    )
  })

  it("resets privileges and grants authenticated access only", () => {
    expect(sql).toContain(
      "revoke all on table public.learning_activity_events from anon, authenticated",
    )
    expect(sql).toContain(
      "grant select, insert, update, delete on table public.learning_activity_events to authenticated",
    )
  })

  it("defines separate own-row policies for every operation", () => {
    expect(sql).toContain("for select to authenticated")
    expect(sql).toContain("for insert to authenticated")
    expect(sql).toContain("for update to authenticated")
    expect(sql).toContain("for delete to authenticated")
    expect(sql.match(/auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(5)
    expect(sql.match(/using \(/g)?.length).toBeGreaterThanOrEqual(3)
    expect(sql.match(/with check \(/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it("removes previous policies before recreating strict policies", () => {
    expect(sql).toContain("from pg_policies")
    expect(sql).toContain("tablename = 'learning_activity_events'")
    expect(sql).toContain("drop policy if exists")
  })

  it("rejects legacy null rows before promoting required columns to NOT NULL", () => {
    expect(sql).toContain("raise exception")
    expect(sql).toContain("learning_activity_events contains null required fields")
    expect(sql).toMatch(
      /alter table public\.learning_activity_events[\s\S]+alter column user_id set not null/,
    )
    expect(sql).toMatch(
      /alter table public\.learning_activity_events[\s\S]+alter column kind set not null/,
    )
    expect(sql).toMatch(
      /alter table public\.learning_activity_events[\s\S]+alter column mode set not null/,
    )
    expect(sql).toMatch(
      /alter table public\.learning_activity_events[\s\S]+alter column entity_id set not null/,
    )
    expect(sql).toMatch(
      /alter table public\.learning_activity_events[\s\S]+alter column occurred_at set not null/,
    )
    expect(sql).toMatch(
      /alter table public\.learning_activity_events[\s\S]+alter column local_date set not null/,
    )
    expect(sql).toMatch(
      /alter table public\.learning_activity_events[\s\S]+alter column timezone_offset_minutes set not null/,
    )
    expect(sql).not.toMatch(/update\s+public\.learning_activity_events\s+set\s+user_id\s*=/)
  })
})
