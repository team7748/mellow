import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  deletePushSubscription: vi.fn(),
}))

vi.mock("../../services/pushSubscriptionService", () => ({
  deletePushSubscription: mocks.deletePushSubscription,
  upsertPushSubscription: vi.fn(),
}))

import {
  disablePushNotifications,
  getPushCapability,
  serializePushSubscription,
  urlBase64ToUint8Array,
} from "./pushNotifications"

describe("pushNotifications", () => {
  beforeEach(() => vi.clearAllMocks())

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

  it("still unsubscribes this browser when database cleanup fails", async () => {
    const unsubscribe = vi.fn().mockResolvedValue(true)
    const getSubscription = vi.fn().mockResolvedValue({
      endpoint: "https://push.test/1",
      unsubscribe,
    })
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: { getSubscription },
        }),
      },
    })
    mocks.deletePushSubscription.mockRejectedValue(new Error("database unavailable"))

    await expect(disablePushNotifications("user-1")).rejects.toThrow("database unavailable")
    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(mocks.deletePushSubscription).toHaveBeenCalledWith(
      "user-1",
      "https://push.test/1",
    )
  })
})
