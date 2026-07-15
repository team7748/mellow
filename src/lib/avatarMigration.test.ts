/// <reference types="node" />
// @vitest-environment node

import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const migrationUrl = new URL(
  "../../supabase/migrations/005_user_avatars.sql",
  import.meta.url,
)

describe("005_user_avatars migration", () => {
  const sql = readFileSync(migrationUrl, "utf8").toLowerCase()

  it("creates a public avatar bucket with server-side file restrictions", () => {
    expect(sql).toContain("add column if not exists avatar_url text")
    expect(sql).toContain("file_size_limit")
    expect(sql).toContain("5242880")
    expect(sql).toContain("allowed_mime_types")
    expect(sql).toContain("'image/jpeg', 'image/png', 'image/webp'")
    expect(sql).toContain("on conflict (id) do update")
  })

  it("replaces old policies and relies on the public bucket for reads", () => {
    expect(sql).toContain(
      'drop policy if exists "avatar images are publicly accessible."',
    )
    expect(sql).not.toMatch(/create policy[^;]+for select/)
  })

  it("limits writes to the authenticated owner's folder", () => {
    expect(sql).toContain("for insert")
    expect(sql).toContain("for update")
    expect(sql).toContain("for delete")
    expect(sql.match(/bucket_id = 'avatars'/g)?.length).toBeGreaterThanOrEqual(4)
    expect(
      sql.match(/\(storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/g)
        ?.length,
    ).toBeGreaterThanOrEqual(4)
    expect(sql.match(/owner_id = \(select auth\.uid\(\)\)::text/g)?.length).toBe(3)
    expect(sql.match(/with check \(/g)?.length).toBe(2)
  })
})
