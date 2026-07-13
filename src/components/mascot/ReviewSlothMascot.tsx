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

export function ReviewSlothMascot({
  reviewCount,
  className = "",
}: ReviewSlothMascotProps) {
  const [frameIndex, setFrameIndex] = useState(frames.length - 1);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (reviewCount <= 0) return;

    const clearTimers = () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
    };

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // Keep the mascot anchored on the button from the first render. The
    // final seated frame is the stable idle pose; CSS provides the gentle
    // in-place motion without a climbing/reveal layout shift.
    setFrameIndex(frames.length - 1);

    if (reduceMotion) return clearTimers;

    frames.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    return clearTimers;
  }, [reviewCount]);

  if (reviewCount <= 0) return null;

  return (
    <div
      className={`review-sloth review-sloth--idle ${className}`.trim()}
      aria-hidden="true"
    >
      <img
        src={frames[frameIndex]}
        alt=""
        draggable={false}
      />
    </div>
  );
}
