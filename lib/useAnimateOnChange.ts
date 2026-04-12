import { useEffect, useRef } from "react";

import { DEFAULT_DURATION_MS, type UseAnimateProps } from "./common";
import { Easings } from "./easing";
import { useAnimationRunner } from "./useAnimationRunner";

type UseAnimateOnChangeProps = UseAnimateProps;

/**
 * Animates the exposed value whenever the `value` prop changes.
 *
 * No animation runs on mount — the initial exposed value simply equals the
 * initial `value`. When `value` changes between renders (equality by
 * `Object.is`), an animation starts from the current exposed value toward
 * the new `value` over `durationMs`.
 *
 * If `value` changes again while an animation is in flight, the current
 * animation is cancelled cleanly (no `after` callback for the cancelled run)
 * and a new animation starts from the current exposed value — wherever the
 * previous animation had reached — toward the new target over a fresh full
 * `durationMs`. `isAnimating` stays `true` across the handoff.
 */
export const useAnimateOnChange = ({
  value,
  durationMs = DEFAULT_DURATION_MS,
  easingFunction = Easings.linear,
  before,
  after,
}: UseAnimateOnChangeProps) => {
  const { animatedValue, isAnimating, start } = useAnimationRunner(value);

  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (Object.is(value, animatedValue)) {
      return;
    }
    start({
      value,
      from: animatedValue,
      durationMs,
      easingFunction,
      before,
      after,
    });
    // `animatedValue` is intentionally excluded: the hook retargets only on
    // `value` changes, reading the current `animatedValue` as the origin at
    // that moment. Including it in deps would re-fire the effect mid-animation
    // and restart the run on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { animatedValue, isAnimating };
};
