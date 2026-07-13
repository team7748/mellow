import { act, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  ReviewSlothMascot,
  type ReviewSlothMascotHandle,
} from "./ReviewSlothMascot"

describe("ReviewSlothMascot", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it("renders no mascot or speech bubble when hidden", () => {
    const mascotRef = createRef<ReviewSlothMascotHandle>()
    render(<ReviewSlothMascot ref={mascotRef} visible={false} />)

    expect(screen.queryByTestId("review-sloth-mascot")).not.toBeInTheDocument()
    expect(screen.queryByText("มาทบทวนกัน!")).not.toBeInTheDocument()
  })

  it("renders a decorative mascot when visible", () => {
    const mascotRef = createRef<ReviewSlothMascotHandle>()
    const { container } = render(<ReviewSlothMascot ref={mascotRef} visible />)

    expect(screen.getByTestId("review-sloth-mascot")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
    expect(container.querySelector("img")).toHaveAttribute("alt", "")
  })

  it("reveals the mascot and speech bubble on a delayed schedule", () => {
    const mascotRef = createRef<ReviewSlothMascotHandle>()
    render(<ReviewSlothMascot ref={mascotRef} visible />)

    expect(screen.getByTestId("review-sloth-mascot")).not.toHaveClass(
      "is-revealed",
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByTestId("review-sloth-mascot")).toHaveClass("is-revealed")
    expect(screen.queryByText("มาทบทวนกัน!")).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByText("มาทบทวนกัน!")).toBeInTheDocument()
  })

  it("plays celebration and invokes the existing callback once", () => {
    const mascotRef = createRef<ReviewSlothMascotHandle>()
    const onDone = vi.fn()
    render(<ReviewSlothMascot ref={mascotRef} visible />)

    act(() => {
      mascotRef.current?.playCelebrate(onDone)
    })
    expect(screen.getByTestId("review-sloth-mascot")).toHaveAttribute(
      "data-pose",
      "celebrate",
    )
    expect(onDone).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(320)
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("cleans reveal, speech, and recurring timers on unmount", () => {
    const mascotRef = createRef<ReviewSlothMascotHandle>()
    const { unmount } = render(<ReviewSlothMascot ref={mascotRef} visible />)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
