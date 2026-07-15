export type UserRole = "user" | "admin"

export type UserProfile = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}
