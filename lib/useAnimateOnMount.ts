import { useEffect, useRef } from "react";

import { DEFAULT_DURATION_MS, type Easable, type UseAnimateOpts } from "./common";
import { Easings } from "./easing";
import { useAnimationRunner } from "./useAnimationRunner";

type UseAnimateOnMountOpts<T extends Easable> = UseAnimateOpts & {
  /** Origin of the animation. Defaults to 0 (scalar) or Array(N).fill(0) (array). */
  from?: T;
};

const toArray = (v: number | number[]): number[] => (Array.isArray(v) ? v : [v]);

/**
 * Animates a value (or array of values) from `from` to `value` once on mount.
 *
 * Props are captured at mount time; subsequent prop changes are ignored.
 * To re-run, remount the component (e.g. with a changing `key`).
 */
export function useAnimateOnMount<T extends Easable>(
  value: T,
  opts: UseAnimateOnMountOpts<T> = {} as UseAnimateOnMountOpts<T>,
): { animatedValue: T; isAnimating: boolean } {
  const isArray = Array.isArray(value);
  const valueArr = toArray(value);
  const fromArr =
    opts.from !== undefined ? toArray(opts.from) : new Array<number>(valueArr.length).fill(0);

  const { animatedValue, isAnimating, start } = useAnimationRunner(fromArr);

  const propsRef = useRef({
    value: valueArr,
    from: fromArr,
    durationMs: opts.durationMs ?? DEFAULT_DURATION_MS,
    easingFunction: opts.easingFunction ?? Easings.linear,
    before: opts.before,
    after: opts.after,
  });

  useEffect(() => {
    start(propsRef.current);
    // Mount-once semantics; props captured at mount via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const out = (isArray ? animatedValue : animatedValue[0]) as T;
  return { animatedValue: out, isAnimating };
}
