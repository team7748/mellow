import { createClient } from "@supabase/supabase-js"

export type SupabaseClientConfig = {
  url: string
  publishableKey: string
}

export function getSupabaseClientConfig(): SupabaseClientConfig {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase configuration missing: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    )
  }

  if (publishableKey.includes("service_role") || publishableKey.startsWith("sb_secret_")) {
    throw new Error(
      "Invalid Supabase frontend key: service_role and sb_secret keys must never be exposed to VITE_ variables.",
    )
  }

  return { url, publishableKey }
}

const { url, publishableKey } = getSupabaseClientConfig()

export const supabase = createClient(url, publishableKey)
