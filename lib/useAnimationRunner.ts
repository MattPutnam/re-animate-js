import { useEffect, useRef, useState } from "react";

import { applyEasing,type EasingFunction } from "./easing";

export type AnimationRunParams = {
  value: number;
  from: number;
  durationMs: number;
  easingFunction: EasingFunction;
  before?: () => void;
  after?: () => void;
};

export type AnimationRunner = {
  animatedValue: number;
  isAnimating: boolean;
  start: (params: AnimationRunParams) => void;
  stop: () => void;
};

export const useAnimationRunner = (initialValue = 0): AnimationRunner => {
  const [animatedValue, setAnimatedValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const start = (params: AnimationRunParams) => {
    if (rafIdRef.current !== undefined) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = undefined;
    }

    const token = ++runTokenRef.current;
    const { value, from, durationMs, easingFunction, before, after } = params;
    const outputSpan = value - from;

    setAnimatedValue(from);
    setIsAnimating(true);
    before?.();

    let startTime: number | undefined;

    const step = (timestamp: number) => {
      if (token !== runTokenRef.current || !mountedRef.current) {
        return;
      }

      if (startTime === undefined) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;

      if (durationMs <= 0 || elapsed >= durationMs) {
        setAnimatedValue(value);
        rafIdRef.current = undefined;
        setIsAnimating(false);
        after?.();
        return;
      }

      const fraction = applyEasing(easingFunction, elapsed / durationMs);
      setAnimatedValue(from + outputSpan * fraction);
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
