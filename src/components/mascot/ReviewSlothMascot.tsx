import { useEffect, useRef, useState } from "react"

interface ReviewSlothMascotProps {
  reviewCount: number
  className?: string
}

// Generate the frame URLs correctly for Vite.
// We assume there are 12 frames named 01.png to 12.png inside src/assets/mascot/sloth-review/
const climbFrames = Array.from(
  { length: 12 },
  (_, index) =>
    new URL(
      `../../assets/mascot/sloth-review/${String(index + 1).padStart(2, "0")}.png`,
      import.meta.url
    ).href
)

const CLIMB_FRAME_DELAY = 145

export function ReviewSlothMascot({
  reviewCount,
  className = "",
}: ReviewSlothMascotProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const [hasFinishedClimbing, setHasFinishedClimbing] = useState(false)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    if (reviewCount <= 0) return

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

    const clearTimers = () => {
      timersRef.current.forEach(window.clearTimeout)
      timersRef.current = []
    }

    if (reduceMotion) {
      setFrameIndex(climbFrames.length - 1)
      setHasFinishedClimbing(true)
      return clearTimers
    }

    // Preload images for smooth transition
    climbFrames.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    const playClimbAnimation = () => {
      let currentFrame = 0

      const advanceFrame = () => {
        setFrameIndex(currentFrame)

        if (currentFrame < climbFrames.length - 1) {
          currentFrame += 1

          // Dynamic delay to give a "weighted" feel at the top
          const baseDelay = 130
          const easeOutDelay = currentFrame > 7 ? Math.pow(currentFrame - 7, 2) * 12 : 0
          const timer = window.setTimeout(
            advanceFrame,
            baseDelay + easeOutDelay
          )

          timersRef.current.push(timer)
        } else {
          setHasFinishedClimbing(true)
          scheduleWave()
        }
      }

      advanceFrame()
    }

    const scheduleWave = () => {
      // Much longer delay to avoid distraction (12 to 20 seconds)
      const delay = 12000 + Math.random() * 8000

      const waveTimer = window.setTimeout(() => {
        setFrameIndex(9)

        const returnTimer = window.setTimeout(() => {
          setFrameIndex(climbFrames.length - 1)
          scheduleWave()
        }, 800)

        timersRef.current.push(returnTimer)
      }, delay)

      timersRef.current.push(waveTimer)
    }

    const startTimer = window.setTimeout(playClimbAnimation, 800)
    timersRef.current.push(startTimer)

    return clearTimers
  }, [reviewCount])

  if (reviewCount <= 0) return null

  return (
    <div
      data-testid="review-sloth-mascot"
      className={[
        "review-sloth",
        hasFinishedClimbing ? "review-sloth--idle" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <img
        src={climbFrames[frameIndex]}
        alt=""
        draggable={false}
      />
    </div>
  )
}
