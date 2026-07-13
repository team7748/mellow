import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "../types/profile"
import { fetchProfile } from "../services/profileService"
import { useAuth } from "./useAuth"

export function useProfileForAuth(
  user: User | null,
  authLoading: boolean,
) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      if (!user) {
        if (isMounted) {
          setProfile(null)
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      const data = await fetchProfile(user.id)
      if (isMounted) {
        setProfile(data)
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      loadProfile()
    }

    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  return { profile, isLoading, setProfile }
}

export function useProfile() {
  const { user, isLoading: authLoading } = useAuth()

  return useProfileForAuth(user, authLoading)
}
