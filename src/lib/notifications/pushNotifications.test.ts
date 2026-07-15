import { describe, expect, it } from "vitest"
import { getPushCapability, serializePushSubscription, urlBase64ToUint8Array } from "./pushNotifications"

describe("pushNotifications", () => {
  it("reports missing browser support and missing public configuration", () => {
    expect(getPushCapability({ serviceWorker: false, pushManager: false, notification: false, publicKey: "key" })).toEqual({ supported: false, configured: true, permission: "unsupported" })
    expect(getPushCapability({ serviceWorker: true, pushManager: true, notification: true, publicKey: "" })).toEqual({ supported: true, configured: false, permission: "default" })
  })

  it("converts URL-safe VAPID keys", () => {
    expect([...urlBase64ToUint8Array("AQIDBA")]).toEqual([1, 2, 3, 4])
  })

  it("serializes the endpoint and both Web Push keys", () => {
    const subscription = {
      endpoint: "https://push.test/1",
      getKey: (name: string) => name === "p256dh" ? Uint8Array.from([1, 2, 3]).buffer : Uint8Array.from([4, 5]).buffer,
    } as unknown as PushSubscription
    expect(serializePushSubscription(subscription)).toEqual({ endpoint: "https://push.test/1", p256dh: "AQID", auth: "BAU=" })
  })
})
