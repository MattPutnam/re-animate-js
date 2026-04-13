import { useEffect, useRef } from "react";

import { DEFAULT_DURATION_MS, type Easable, type UseAnimateOpts } from "./common";
import { Easings } from "./easing";
import { useAnimationRunner } from "./useAnimationRunner";

const toArray = (v: number | number[]): number[] => (Array.isArray(v) ? v : [v]);

const elementWiseEqual = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};

/**
 * Animates the exposed value whenever the `value` argument changes.
 *
 * Equality between renders is `Object.is` for scalars and length+element-wise
 * `Object.is` for arrays. Mid-flight changes continue from the current
 * exposed value (no snap-back). For arrays, length MUST remain stable for
 * the lifetime of a hook instance (FR-009).
 */
export function useAnimateOnChange<T extends Easable>(
  value: T,
  opts: UseAnimateOpts = {},
): { animatedValue: T; isAnimating: boolean } {
  const isArray = Array.isArray(value);
  const valueArr = toArray(value);

  const { animatedValue, isAnimating, start } = useAnimationRunner(valueArr);

  const firstRenderRef = useRef(true);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    if (elementWiseEqual(animatedValue, valueArr)) {
      return;
    }

    const o = optsRef.current;
    start({
      value: valueArr,
      from: animatedValue,
      durationMs: o.durationMs ?? DEFAULT_DURATION_MS,
      easingFunction: o.easingFunction ?? Easings.linear,
      before: o.before,
      after: o.after,
    });
    // Effect intentionally depends on `valueArr` element-wise: spreading
    // exploits React's per-element Object.is dep comparison. Length is
    // assumed stable per FR-009. `animatedValue`, `start`, and opts are
    // intentionally excluded — see hook docstring.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, valueArr);

  const out = (isArray ? animatedValue : animatedValue[0]) as T;
  return { animatedValue: out, isAnimating };
}
