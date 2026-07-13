import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  LearningActivityEvent,
  LearningActivityLedger,
} from "./activityTypes"

const mocks = vi.hoisted(() => ({
  loadLocal: vi.fn(),
  saveLocal: vi.fn(),
  getClaimedBy: vi.fn(),
  setClaimedBy: vi.fn(),
  loadCloud: vi.fn(),
  upsertCloud: vi.fn(),
}))

vi.mock("./activityLocalStorage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./activityLocalStorage")>()
  return {
    ...actual,
    loadLocalActivityLedger: mocks.loadLocal,
    saveLocalActivityLedger: mocks.saveLocal,
    getGuestActivityClaimedBy: mocks.getClaimedBy,
    setGuestActivityClaimedBy: mocks.setClaimedBy,
  }
})

vi.mock("./activityCloudRepository", () => ({
  loadCloudActivityLedger: mocks.loadCloud,
  upsertCloudActivityEvents: mocks.upsertCloud,
}))

import {
  getActiveActivityUserId,
  handleActivitySignIn,
  handleActivitySignOut,
  scheduleActivitySync,
} from "./activitySyncManager"

function makeEvent(id: string): LearningActivityEvent {
  return {
    id,
    kind: "vocabulary_answer",
    mode: "quiz",
    entityId: `word-${id}`,
    occurredAt: "2026-07-13T05:00:00.000Z",
    localDate: "2026-07-13",
    timezoneOffsetMinutes: -420,
  }
}

function ledger(...events: LearningActivityEvent[]): LearningActivityLedger {
  return { version: 1, events, updatedAt: null }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe("activitySyncManager", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    handleActivitySignOut()
    vi.clearAllMocks()
    mocks.loadLocal.mockReturnValue(ledger())
    mocks.saveLocal.mockImplementation((_userId, value) => value)
    mocks.getClaimedBy.mockReturnValue(null)
    mocks.loadCloud.mockResolvedValue(ledger())
    mocks.upsertCloud.mockResolvedValue(undefined)
  })

  it("pulls, merges, saves local, and pushes on sign-in", async () => {
    const local = makeEvent("local")
    const cloud = makeEvent("cloud")
    mocks.loadLocal.mockImplementation((userId) =>
      userId === "user-1" ? ledger(local) : ledger(),
    )
    mocks.loadCloud.mockResolvedValue(ledger(cloud))

    await handleActivitySignIn("user-1")

    expect(getActiveActivityUserId()).toBe("user-1")
    expect(mocks.loadLocal).toHaveBeenCalledWith("user-1")
    expect(mocks.loadCloud).toHaveBeenCalledWith("user-1")
    expect(mocks.saveLocal).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ events: expect.arrayContaining([local, cloud]) }),
    )
    expect(mocks.upsertCloud).toHaveBeenCalledWith(
      "user-1",
      expect.arrayContaining([local, cloud]),
    )
    expect(mocks.saveLocal.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.upsertCloud.mock.invocationCallOrder[0],
    )
  })

  it("claims Guest only when both User ledgers are empty and Guest is unclaimed", async () => {
    const guest = makeEvent("guest")
    mocks.loadLocal.mockImplementation((userId) =>
      userId ? ledger() : ledger(guest),
    )

    await handleActivitySignIn("user-1")

    expect(mocks.saveLocal).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ events: [guest] }),
    )
    expect(mocks.upsertCloud).toHaveBeenCalledWith("user-1", [guest])
    expect(mocks.setClaimedBy).toHaveBeenCalledWith("user-1")
    expect(mocks.setClaimedBy.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.upsertCloud.mock.invocationCallOrder[0],
    )
  })

  it.each([
    ["non-empty local", ledger(makeEvent("local")), ledger()],
    ["non-empty cloud", ledger(), ledger(makeEvent("cloud"))],
  ])("does not claim Guest for a %s User ledger", async (_label, local, cloud) => {
    mocks.loadLocal.mockImplementation((userId) =>
      userId ? local : ledger(makeEvent("guest")),
    )
    mocks.loadCloud.mockResolvedValue(cloud)

    await handleActivitySignIn("user-1")

    expect(mocks.setClaimedBy).not.toHaveBeenCalled()
  })

  it("does not claim Guest when a prior claim marker exists", async () => {
    mocks.loadLocal.mockImplementation((userId) =>
      userId ? ledger() : ledger(makeEvent("guest")),
    )
    mocks.getClaimedBy.mockReturnValue("another-user")

    await handleActivitySignIn("user-1")

    expect(mocks.setClaimedBy).not.toHaveBeenCalled()
    expect(mocks.upsertCloud).toHaveBeenCalledWith("user-1", [])
  })

  it("writes the Guest claim marker only after cloud persistence succeeds", async () => {
    const push = deferred<void>()
    mocks.loadLocal.mockImplementation((userId) =>
      userId ? ledger() : ledger(makeEvent("guest")),
    )
    mocks.upsertCloud.mockReturnValue(push.promise)

    const signingIn = handleActivitySignIn("user-1")
    await Promise.resolve()
    await Promise.resolve()

    expect(mocks.saveLocal).toHaveBeenCalled()
    expect(mocks.setClaimedBy).not.toHaveBeenCalled()

    push.resolve()
    await signingIn

    expect(mocks.setClaimedBy).toHaveBeenCalledWith("user-1")
  })

  it("pulls the latest cloud ledger before every scheduled merge and push", async () => {
    await handleActivitySignIn("user-1")
    vi.clearAllMocks()
    const local = makeEvent("local-latest")
    const cloud = makeEvent("cloud-latest")
    mocks.loadLocal.mockReturnValue(ledger(local))
    mocks.loadCloud.mockResolvedValue(ledger(cloud))
    mocks.upsertCloud.mockResolvedValue(undefined)

    scheduleActivitySync()
    await vi.advanceTimersByTimeAsync(2_000)

    expect(mocks.loadCloud).toHaveBeenCalledWith("user-1")
    expect(mocks.saveLocal).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ events: expect.arrayContaining([local, cloud]) }),
    )
    expect(mocks.upsertCloud).toHaveBeenCalledWith(
      "user-1",
      expect.arrayContaining([local, cloud]),
    )
  })

  it("preserves local data and performs at most three scheduled retries", async () => {
    await handleActivitySignIn("user-1")
    vi.clearAllMocks()
    const local = makeEvent("local")
    mocks.loadLocal.mockReturnValue(ledger(local))
    mocks.loadCloud.mockResolvedValue(ledger())
    mocks.upsertCloud.mockRejectedValue(new Error("offline"))

    scheduleActivitySync()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await vi.advanceTimersByTimeAsync(2_000)
    }

    expect(mocks.saveLocal).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ events: [local] }),
    )
    expect(mocks.upsertCloud).toHaveBeenCalledTimes(4)
    expect(mocks.loadLocal).toHaveBeenCalledTimes(4)
  })

  it("retries queued work when the browser returns online", async () => {
    await handleActivitySignIn("user-1")
    vi.clearAllMocks()
    mocks.loadLocal.mockReturnValue(ledger(makeEvent("local")))
    mocks.loadCloud.mockResolvedValue(ledger())
    mocks.upsertCloud
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined)

    scheduleActivitySync()
    await vi.advanceTimersByTimeAsync(2_000)
    vi.clearAllTimers()

    window.dispatchEvent(new Event("online"))
    await vi.advanceTimersByTimeAsync(2_000)

    expect(mocks.upsertCloud).toHaveBeenCalledTimes(2)
  })

  it("cancels timers and clears the active User on sign-out", async () => {
    await handleActivitySignIn("user-1")
    vi.clearAllMocks()

    scheduleActivitySync()
    handleActivitySignOut()
    await vi.advanceTimersByTimeAsync(2_000)

    expect(getActiveActivityUserId()).toBeNull()
    expect(mocks.loadCloud).not.toHaveBeenCalled()
    expect(mocks.upsertCloud).not.toHaveBeenCalled()
  })

  it("discards a stale response after switching accounts", async () => {
    const userACloud = deferred<LearningActivityLedger>()
    mocks.loadCloud.mockImplementation((userId) =>
      userId === "user-a" ? userACloud.promise : Promise.resolve(ledger()),
    )

    const signingInA = handleActivitySignIn("user-a")
    await Promise.resolve()
    await handleActivitySignIn("user-b")
    userACloud.resolve(ledger(makeEvent("stale-a")))
    await signingInA

    expect(getActiveActivityUserId()).toBe("user-b")
    expect(mocks.saveLocal).not.toHaveBeenCalledWith(
      "user-a",
      expect.anything(),
    )
    expect(mocks.upsertCloud).not.toHaveBeenCalledWith(
      "user-a",
      expect.anything(),
    )
  })
})
