import { useEffect, useRef, useState } from "react";

interface ReviewSlothMascotProps {
  reviewCount: number;
  className?: string;
}

const frames = Array.from(
  { length: 12 },
  (_, index) =>
    new URL(
      `../../assets/mascot/sloth-review/${String(index + 1).padStart(2, "0")}.png`,
      import.meta.url
    ).href
);

const START_DELAY = 850;
const FRAME_DELAY = 260;
const LAST_FRAME_HOLD = 2000;

/* Cute English greetings the sloth cycles through */
const BUBBLE_MESSAGES = [
  "Let's review!",
  "Hi there!",
  "Ready to learn?",
  "You got this!",
  "Keep going!",
  "Great job!",
];

/* Frames 8–11 (index 7–10) are the "hand wave" frames */
const WAVE_START_FRAME = 7;
const WAVE_END_FRAME = 10;

export function ReviewSlothMascot({
  reviewCount,
  className = "",
}: ReviewSlothMascotProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const timersRef = useRef<number[]>([]);
  const cycleCountRef = useRef(0);

  const showBubble =
    frameIndex >= WAVE_START_FRAME && frameIndex <= WAVE_END_FRAME;

  useEffect(() => {
    if (reviewCount <= 0) return;

    const clearTimers = () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setFrameIndex(frames.length - 1);
      return clearTimers;
    }

    // 1. เปิดหน้าแสดงเฟรม 01 ทันที
    setFrameIndex(0);

    const playCycle = () => {
      let currentFrame = 0;

      /* Pick next message for this cycle */
      setMessageIndex(
        cycleCountRef.current % BUBBLE_MESSAGES.length
      );
      cycleCountRef.current += 1;

      const showNextFrame = () => {
        // 3. เล่นเฟรม 01-12 ตามลำดับ
        setFrameIndex(currentFrame);

        if (currentFrame < frames.length - 1) {
          currentFrame += 1;
          const frameTimer = window.setTimeout(showNextFrame, FRAME_DELAY); // 4. ใช้เวลา 260ms ต่อเฟรม
          timersRef.current.push(frameTimer);
        } else {
          // 5. ค้างเฟรม 12 เป็นเวลา 2000ms
          // 6. แล้ววนกลับไปเล่นใหม่ 01-12 ด้วยฟังก์ชัน playCycle
          const holdTimer = window.setTimeout(playCycle, LAST_FRAME_HOLD);
          timersRef.current.push(holdTimer);
        }
      };

      showNextFrame();
    };

    // 2. รอก่อนเริ่มประมาณ 850ms
    const startTimer = window.setTimeout(playCycle, START_DELAY);
    timersRef.current.push(startTimer);

    return clearTimers;
  }, [reviewCount]);

  if (reviewCount <= 0) return null;

  return (
    <div
      className={`absolute z-30 left-[55%] bottom-[calc(100%-6px)] w-[clamp(100px,30vw,130px)] sm:w-[clamp(96px,15vw,160px)] aspect-square pointer-events-none select-none -translate-x-1/2 opacity-100 motion-reduce:transform-none motion-reduce:-translate-x-1/2 ${className}`.trim()}
      aria-hidden="true"
      data-testid="review-sloth-mascot"
    >
      {/* Speech bubble */}
      <div
        className={`sloth-bubble ${showBubble ? "sloth-bubble--visible" : ""}`}
      >
        {BUBBLE_MESSAGES[messageIndex]}
      </div>

      <img
        src={frames[frameIndex]}
        alt=""
        draggable={false}
        className="block w-full h-full object-contain object-bottom origin-bottom motion-reduce:animate-none motion-reduce:transition-none"
      />
    </div>
  );
}
