import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"
import { buildReminderPayload, getDueReminder, isExpiredPushStatus } from "./reminderLogic.ts"

const jsonHeaders = { "content-type": "application/json; charset=utf-8" }

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get("REMINDER_CRON_SECRET")
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const publicKey = Deno.env.get("WEB_PUSH_PUBLIC_KEY")
  const privateKey = Deno.env.get("WEB_PUSH_PRIVATE_KEY")
  const subject = Deno.env.get("WEB_PUSH_SUBJECT")
  if (!supabaseUrl || !serviceRoleKey || !publicKey || !privateKey || !subject) {
    return new Response(JSON.stringify({ error: "Reminder secrets are incomplete" }), { status: 500, headers: jsonHeaders })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  webpush.setVapidDetails(subject, publicKey, privateKey)
  const [{ data: preferences, error: preferenceError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
    supabase.from("user_preferences").select("user_id, reminder_enabled, reminder_time, timezone, language").eq("reminder_enabled", true),
    supabase.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth_key, last_notified_local_date"),
  ])
  if (preferenceError || subscriptionError) {
    return new Response(JSON.stringify({ error: "Database query failed" }), { status: 500, headers: jsonHeaders })
  }

  const now = new Date()
  let checked = 0
  let sent = 0
  let expired = 0
  let failed = 0
  const subscriptionsByUser = new Map<string, typeof subscriptions>()
  for (const subscription of subscriptions ?? []) {
    const existing = subscriptionsByUser.get(subscription.user_id) ?? []
    existing.push(subscription)
    subscriptionsByUser.set(subscription.user_id, existing)
  }

  for (const preference of preferences ?? []) {
    const due = getDueReminder(preference, now)
    if (!due) continue
    for (const subscription of subscriptionsByUser.get(preference.user_id) ?? []) {
      if (subscription.last_notified_local_date === due.localDate) continue
      checked += 1
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
        }, JSON.stringify(buildReminderPayload(due.language)))
        const { error } = await supabase.from("push_subscriptions").update({ last_notified_local_date: due.localDate }).eq("id", subscription.id).eq("user_id", preference.user_id)
        if (error) throw error
        sent += 1
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : undefined
        if (isExpiredPushStatus(statusCode)) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id).eq("user_id", preference.user_id)
          expired += 1
        } else {
          failed += 1
        }
      }
    }
  }

  return new Response(JSON.stringify({ checked, sent, expired, failed }), { headers: jsonHeaders })
})
