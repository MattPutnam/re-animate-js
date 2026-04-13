import { useEffect, useRef, useState } from "react";

import { applyEasing, type EasingFunction } from "./easing";

export type AnimationRunParams = {
  value: number[];
  from: number[];
  durationMs: number;
  easingFunction: EasingFunction;
  before?: () => void;
  after?: () => void;
};

export type AnimationRunner = {
  animatedValue: number[];
  isAnimating: boolean;
  start: (params: AnimationRunParams) => void;
  stop: () => void;
};

const elementWiseEqual = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};

export const useAnimationRunner = (initialValue: number[]): AnimationRunner => {
  const [animatedValue, setAnimatedValue] = useState<number[]>(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);

  const latestValueRef = useRef<number[]>(initialValue);
  const rafIdRef = useRef<number | undefined>(undefined);
  const runTokenRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = undefined;
      }
    };
  }, []);

  const setValue = (next: number[]) => {
    latestValueRef.current = next;
    setAnimatedValue(next);
  };

  const start = (params: AnimationRunParams) => {
    if (rafIdRef.current !== undefined) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = undefined;
    }

    const { value, from, durationMs, easingFunction, before, after } = params;

    // Empty array: complete no-op (FR-013) — no callbacks, no rAF, no setState.
    if (value.length === 0) {
      runTokenRef.current++;
      return;
    }

    const token = ++runTokenRef.current;
    const span = new Array<number>(value.length);
    for (let i = 0; i < value.length; i++) span[i] = value[i] - from[i];

    // Seed write — skip if element-wise equal to current (mid-flight retarget case).
    if (!elementWiseEqual(from, latestValueRef.current)) {
      setValue(from.slice());
    }
    setIsAnimating(true);
    before?.();

    let startTime: number | undefined;

    const step = (timestamp: number) => {
      if (token !== runTokenRef.current || !mountedRef.current) return;
      if (startTime === undefined) startTime = timestamp;

      const elapsed = timestamp - startTime;

      if (durationMs <= 0 || elapsed >= durationMs) {
        setValue(value.slice());
        rafIdRef.current = undefined;
        setIsAnimating(false);
        after?.();
        return;
      }

      const fraction = applyEasing(easingFunction, elapsed / durationMs);
      const next = new Array<number>(value.length);
      for (let i = 0; i < value.length; i++) {
        next[i] = from[i] + span[i] * fraction;
      }
      setValue(next);
      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
  };

  const stop = () => {
    runTokenRef.current++;
    if (rafIdRef.current !== undefined) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = undefined;
    }
    setIsAnimating(false);
  };

  return { animatedValue, isAnimating, start, stop };
};
