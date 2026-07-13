import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import idleUrl from "../../assets/mascot/sloth/idle.png"
import waveUrl from "../../assets/mascot/sloth/wave.png"
import celebrateUrl from "../../assets/mascot/sloth/celebrate.png"
import thumbsUpUrl from "../../assets/mascot/sloth/thumbs-up.png"
import blinkUrl from "../../assets/mascot/sloth/blink.png"
import nodUrl from "../../assets/mascot/sloth/nod.png"
import "./reviewSlothMascot.css"

export type ReviewSlothMascotHandle = {
  playWave: () => void
  playCelebrate: (onDone: () => void) => void
}

type ReviewSlothMascotProps = {
  visible: boolean
}

type Pose = "idle" | "wave" | "celebrate" | "thumbs-up" | "blink" | "nod"

const poseUrls: Record<Pose, string> = {
  idle: idleUrl,
  wave: waveUrl,
  celebrate: celebrateUrl,
  "thumbs-up": thumbsUpUrl,
  blink: blinkUrl,
  nod: nodUrl,
}

const actionPoses: Pose[] = ["wave", "nod", "thumbs-up", "blink"]

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
}

export const ReviewSlothMascot = forwardRef<
  ReviewSlothMascotHandle,
  ReviewSlothMascotProps
>(function ReviewSlothMascot({ visible }, ref) {
  const [pose, setPose] = useState<Pose>("idle")
  const [revealed, setRevealed] = useState(false)
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const timersRef = useRef<Set<ReturnType<typeof window.setTimeout>>>(new Set())
  const actionResetRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const clearTimer = (timer: ReturnType<typeof window.setTimeout>) => {
    window.clearTimeout(timer)
    timersRef.current.delete(timer)
  }

  const schedule = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer)
      callback()
    }, delay)
    timersRef.current.add(timer)
    return timer
  }

  const clearAllTimers = () => {
    for (const timer of timersRef.current) window.clearTimeout(timer)
    timersRef.current.clear()
    if (actionResetRef.current) {
      window.clearTimeout(actionResetRef.current)
      actionResetRef.current = null
    }
  }

  useEffect(() => {
    clearAllTimers()
    setPose("idle")
    setRevealed(false)
    setBubbleVisible(false)

    if (!visible) return undefined

    const reducedMotion = prefersReducedMotion()
    const scheduleNextAction = () => {
      if (reducedMotion) return
      schedule(() => {
        const nextPose = actionPoses[Math.floor(Math.random() * actionPoses.length)]
        setPose(nextPose)
        actionResetRef.current = schedule(() => {
          actionResetRef.current = null
          setPose("idle")
          scheduleNextAction()
        }, 1400)
      }, 6000 + Math.floor(Math.random() * 4001))
    }

    schedule(() => {
      setRevealed(true)
      if (!reducedMotion) {
        schedule(() => setBubbleVisible(true), 500)
        schedule(() => setBubbleVisible(false), 3000)
        scheduleNextAction()
      }
    }, reducedMotion ? 100 : 1000)

    return clearAllTimers
  }, [visible])

  useImperativeHandle(
    ref,
    () => ({
      playWave() {
        if (!visible || prefersReducedMotion()) return
        if (actionResetRef.current) clearTimer(actionResetRef.current)
        setPose("wave")
        actionResetRef.current = schedule(() => {
          actionResetRef.current = null
          setPose("idle")
        }, 1100)
      },
      playCelebrate(onDone) {
        if (!visible) return
        if (actionResetRef.current) clearTimer(actionResetRef.current)
        if (prefersReducedMotion()) {
          onDone()
          return
        }
        setPose("celebrate")
        actionResetRef.current = schedule(() => {
          actionResetRef.current = null
          setPose("idle")
          onDone()
        }, 320)
      },
    }),
    [ref, visible],
  )

  if (!visible) return null

  return (
    <div
      data-testid="review-sloth-mascot"
      aria-hidden="true"
      data-pose={pose}
      className={`review-sloth-mascot ${revealed ? "is-revealed" : ""} review-sloth-mascot--${pose}`}
    >
      <img
        src={poseUrls[pose]}
        alt=""
        draggable={false}
        className="review-sloth-mascot__image"
      />
      {bubbleVisible ? (
        <span className="review-sloth-bubble">มาทบทวนกัน!</span>
      ) : null}
    </div>
  )
})
