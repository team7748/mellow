export type UserRole = "user" | "admin"

export type UserProfile = {
  id: string
  email: string | null
  display_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}
