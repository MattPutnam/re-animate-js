import { useEffect, useRef } from "react";

import { DEFAULT_DURATION_MS, type UseAnimateProps } from "./common";
import { Easings } from "./easing";
import { useAnimationRunner } from "./useAnimationRunner";

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
  const { animatedValue, isAnimating, start } = useAnimationRunner(from);

  const propsRef = useRef({ value, from, durationMs, easingFunction, before, after });

  useEffect(() => {
    const p = propsRef.current;
    start({
      value: p.value,
      from: p.from,
      durationMs: p.durationMs,
      easingFunction: p.easingFunction,
      before: p.before,
      after: p.after,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { animatedValue, isAnimating };
};
