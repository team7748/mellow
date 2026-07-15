import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { getSupabaseClientConfig } from "./supabaseClient"

describe("Supabase client configuration", () => {
  const originalEnv = import.meta.env

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("requires the public URL and publishable key", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "")
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
    expect(() => getSupabaseClientConfig()).toThrow(
      "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY",
    )
  })

  it("rejects service-role and secret keys in frontend configuration", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co")
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_secret_do_not_expose")
    expect(() =>
      getSupabaseClientConfig(),
    ).toThrow("must never be exposed")
  })

  it("returns trimmed public configuration", () => {
    vi.stubEnv("VITE_SUPABASE_URL", " https://example.supabase.co ")
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", " sb_publishable_key ")
    expect(
      getSupabaseClientConfig(),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_key",
    })
  })
})
