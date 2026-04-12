import { useCallback, useRef } from "react";

import { DEFAULT_DURATION_MS, type UseAnimateProps } from "./common";
import { Easings } from "./easing";
import { useAnimationRunner } from "./useAnimationRunner";

type UseAnimateOnActionProps = UseAnimateProps & {
  /** Starting value for animation, defaults to 0 */
  from?: number;
};

/**
 * Animates a given value when the returned `trigger` function is called.
 *
 * Configuration props are captured at the moment `trigger` is invoked: the
 * values used for each animation run are those provided on the latest render
 * prior to that invocation. Props changing mid-flight do NOT affect the
 * running animation.
 *
 * The returned `trigger` function is referentially stable across renders of
 * the same component instance — safe to pass to memoized children, event
 * handlers, or effect dependency arrays.
 *
 * Calling `trigger` during an in-flight animation cancels the running
 * animation (no `after` callback fires for the cancelled run) and starts a
 * fresh animation from `from`.
 */
export const useAnimateOnAction = ({
  value,
  from = 0,
  durationMs = DEFAULT_DURATION_MS,
  easingFunction = Easings.linear,
  before,
  after,
}: UseAnimateOnActionProps) => {
  const { animatedValue, isAnimating, start } = useAnimationRunner(from);

  const propsRef = useRef({ value, from, durationMs, easingFunction, before, after });
  propsRef.current = { value, from, durationMs, easingFunction, before, after };

  const trigger = useCallback(() => {
    const p = propsRef.current;
    start({
      value: p.value,
      from: p.from,
      durationMs: p.durationMs,
      easingFunction: p.easingFunction,
      before: p.before,
      after: p.after,
    });
    // `start` from the runner is stable across renders for a given mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { animatedValue, isAnimating, trigger };
};
