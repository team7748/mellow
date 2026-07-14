import { describe, expect, it } from "vitest"
import { getSupabaseClientConfig } from "./supabaseClient"

describe("Supabase client configuration", () => {
  it("requires the public URL and publishable key", () => {
    expect(() => getSupabaseClientConfig({})).toThrow(
      "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY",
    )
  })

  it("rejects service-role and secret keys in frontend configuration", () => {
    expect(() =>
      getSupabaseClientConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_do_not_expose",
      }),
    ).toThrow("must never be exposed")
  })

  it("returns trimmed public configuration", () => {
    expect(
      getSupabaseClientConfig({
        VITE_SUPABASE_URL: " https://example.supabase.co ",
        VITE_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_key ",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_key",
    })
  })
})
