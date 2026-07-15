import { assertAuthenticatedUser } from "../lib/authUserScope"
import { supabase } from "../lib/supabaseClient"

export type SerializedPushSubscription = {
  endpoint: string
  p256dh: string
  auth: string
}

export async function upsertPushSubscription(userId: string, subscription: SerializedPushSubscription) {
  await assertAuthenticatedUser(userId)
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.p256dh,
    auth_key: subscription.auth,
    user_agent: typeof navigator === "undefined" ? null : navigator.userAgent,
  }, { onConflict: "endpoint" })
  if (error) throw error
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  await assertAuthenticatedUser(userId)
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
  if (error) throw error
}
