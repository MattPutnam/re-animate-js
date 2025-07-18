import { useEffect, useRef, useState } from "react";

import { DEFAULT_DURATION_MS, type UseAnimateProps } from "./common";
import { applyEasing, Easings } from "./easing";

type UseAnimateOnMountProps = UseAnimateProps & {
  /** Starting value for animation, defaults to 0 */
  from?: number;
};

/**
 * Animates a given value when the component mounts
 */
export const useAnimateOnMount = ({
  value,
  from = 0,
  durationMs = DEFAULT_DURATION_MS,
  easingFunction = Easings.linear,
  before,
  after,
}: UseAnimateOnMountProps) => {
  const outputSpan = value - from;
  const [animatedValue, setAnimatedValue] = useState(from);

  const [isAnimating, setIsAnimating] = useState(true);
  const startTime = useRef<number | undefined>(undefined);

  function step(timestamp: number) {
    if (startTime.current === undefined) {
      startTime.current = timestamp;
    }

    const elapsedTime = timestamp - startTime.current;
    const elapsedFraction = elapsedTime / durationMs;
    const outputFraction = applyEasing(easingFunction, elapsedFraction);
    const outputDiff = outputSpan * outputFraction;

    setAnimatedValue(value + outputDiff);

    if (elapsedTime < durationMs) {
      requestAnimationFrame(step);
    } else {
      after?.();
      setIsAnimating(false);
    }
  }

  useEffect(() => {
    before?.();
    requestAnimationFrame(step);
  });

  return {
    animatedValue,
    isAnimating
  }
}
