import { deletePushSubscription, upsertPushSubscription } from "../../services/pushSubscriptionService"

type CapabilityInput = {
  serviceWorker: boolean
  pushManager: boolean
  notification: boolean
  publicKey: string
  permission?: NotificationPermission
}

export type PushCapability = {
  supported: boolean
  configured: boolean
  permission: NotificationPermission | "unsupported"
}

export function getPushCapability(input?: CapabilityInput): PushCapability {
  const serviceWorker = input?.serviceWorker ?? ("serviceWorker" in navigator)
  const pushManager = input?.pushManager ?? ("PushManager" in window)
  const notification = input?.notification ?? ("Notification" in window)
  const publicKey = input?.publicKey ?? import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? ""
  const supported = serviceWorker && pushManager && notification
  return {
    supported,
    configured: Boolean(publicKey),
    permission: supported
      ? (input?.permission ?? (typeof Notification === "undefined" ? "default" : Notification.permission))
      : "unsupported",
  }
}

export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - value.length % 4) % 4)
  const decoded = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}

function arrayBufferToBase64(value: ArrayBuffer | null) {
  if (!value) return ""
  const bytes = new Uint8Array(value)
  let binary = ""
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

export function serializePushSubscription(subscription: PushSubscription) {
  return {
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
    auth: arrayBufferToBase64(subscription.getKey("auth")),
  }
}

export async function enablePushNotifications(userId: string) {
  const capability = getPushCapability()
  if (!capability.supported) throw new Error("unsupported")
  if (!capability.configured) throw new Error("missing-public-key")
  const permission = capability.permission === "default"
    ? await Notification.requestPermission()
    : capability.permission
  if (permission !== "granted") throw new Error(permission === "denied" ? "permission-denied" : "permission-dismissed")

  const registration = await navigator.serviceWorker.register("/mellow-sw.js")
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? ""),
  })
  await upsertPushSubscription(userId, serializePushSubscription(subscription))
  return subscription
}

export async function disablePushNotifications(userId: string) {
  if (!("serviceWorker" in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration("/mellow-sw.js")
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await deletePushSubscription(userId, subscription.endpoint)
  await subscription.unsubscribe()
}
