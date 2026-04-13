import { useCallback, useRef } from "react";

import { DEFAULT_DURATION_MS, type Easable, type UseAnimateOpts } from "./common";
import { Easings } from "./easing";
import { useAnimationRunner } from "./useAnimationRunner";

type UseAnimateOnActionOpts<T extends Easable> = UseAnimateOpts & {
  /** Origin of the animation. Defaults to 0 (scalar) or Array(N).fill(0) (array). */
  from?: T;
};

const toArray = (v: number | number[]): number[] => (Array.isArray(v) ? v : [v]);

/**
 * Animates a value (or array of values) from `from` to `value` when the
 * returned `trigger` function is called. Configuration is captured at the
 * moment `trigger` is invoked. Re-trigger snaps back to `from` and starts
 * a fresh run.
 */
export function useAnimateOnAction<T extends Easable>(
  value: T,
  opts: UseAnimateOnActionOpts<T> = {} as UseAnimateOnActionOpts<T>,
): { animatedValue: T; isAnimating: boolean; trigger: () => void } {
  const isArray = Array.isArray(value);
  const valueArr = toArray(value);
  const fromArr =
    opts.from !== undefined ? toArray(opts.from) : new Array<number>(valueArr.length).fill(0);

  const { animatedValue, isAnimating, start } = useAnimationRunner(fromArr);

  const latestRef = useRef({ valueArr, fromArr, opts });
  latestRef.current = { valueArr, fromArr, opts };

  const trigger = useCallback(() => {
    const { valueArr, fromArr, opts } = latestRef.current;
    start({
      value: valueArr,
      from: fromArr,
      durationMs: opts.durationMs ?? DEFAULT_DURATION_MS,
      easingFunction: opts.easingFunction ?? Easings.linear,
      before: opts.before,
      after: opts.after,
    });
    // Stable identity; reads latest props from ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const out = (isArray ? animatedValue : animatedValue[0]) as T;
  return { animatedValue: out, isAnimating, trigger };
}
