import { useEffect, useRef, useState } from "react";

import { DEFAULT_DURATION_MS, type UseAnimateProps } from "./common";
import { applyEasing, Easings } from "./easing";

type UseAnimateOnMountProps = UseAnimateProps & {
  /** Starting value for animation, defaults to 0 */
  from?: number;
};

/**
 * Animates a given value when the component mounts.
 *
 * Props are captured at mount time: subsequent changes to `value`, `from`,
 * `durationMs`, `easingFunction`, `before`, or `after` are intentionally
 * ignored. To re-run the animation with new values, remount the component
 * (e.g. via a changing `key`).
 */
export const useAnimateOnMount = ({
  value,
  from = 0,
  durationMs = DEFAULT_DURATION_MS,
  easingFunction = Easings.linear,
  before,
  after,
}: UseAnimateOnMountProps) => {
  const [animatedValue, setAnimatedValue] = useState(from);
  const [isAnimating, setIsAnimating] = useState(true);

  const propsRef = useRef({ value, from, durationMs, easingFunction, before, after });

  useEffect(() => {
    const { value, from, durationMs, easingFunction, before, after } = propsRef.current;
    const outputSpan = value - from;

    let rafId: number;
    let startTime: number | undefined;

    const step = (timestamp: number) => {
      if (startTime === undefined) {
        startTime = timestamp;
      }

      const elapsedTime = timestamp - startTime;
      const elapsedFraction = elapsedTime / durationMs;
      const outputFraction = applyEasing(easingFunction, elapsedFraction);
      const outputDiff = outputSpan * outputFraction;

      setAnimatedValue(from + outputDiff);

      if (elapsedTime < durationMs) {
        rafId = requestAnimationFrame(step);
      } else {
        setAnimatedValue(value);
        after?.();
        setIsAnimating(false);
      }
    };

    before?.();
    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return {
    animatedValue,
    isAnimating,
  };
};
