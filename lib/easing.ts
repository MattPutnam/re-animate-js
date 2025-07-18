/**
 * An easing function defines the shape of the animation transition. It is a function of type
 * `number => number`, where both input and output range from 0 to 1, representing the fraction
 * of the animation that is complete. It is required that f(0) = 0 and f(1) = 1. The function is
 * not defined for inputs outside of [0, 1]. Outputs may extend outside of [0, 1].
 */
export type EasingFunction = (x: number) => number;

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

const n1 = 7.5625;
const d1 = 2.75;

/**
 * A collection of ready-to-use easing functions. Note that these have not been "clamped" so that
 * f(0) = 0 and f(1) = 1; values may differ slightly due to floating point error. The algorithm in
 * this library ensures clamped values, therefore these functions will work for this library but
 * may be unsuitable outside of it.
 */
export const Easings = {
  linear: ((x: number) => x) as EasingFunction,
  sine: {
    in: ((x: number) => 1 - Math.cos((x * Math.PI) / 2)) as EasingFunction,
    out: ((x: number) => Math.sin((x * Math.PI) / 2)) as EasingFunction,
    inOut: ((x: number) => -(Math.cos(x * Math.PI) - 1) / 2) as EasingFunction,
  },
  polynomial: (degree: number) => ({
    in: ((x: number) => Math.pow(x, degree)) as EasingFunction,
    out: ((x: number) => 1 - Math.pow(1 - x, degree)) as EasingFunction,
    inOut: ((x: number) => x < 0.5 ? Math.pow(2, degree - 1) * Math.pow(x, degree) : 1 - Math.pow(-2 * x + 2, degree) / 2) as EasingFunction,
  }),
  exponential: {
    in: ((x: number) => Math.pow(2, 10 * x - 10)) as EasingFunction,
    out: ((x: number) => 1 - Math.pow(2, -10 * x)) as EasingFunction,
    inOut: ((x: number) => x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
      : (2 - Math.pow(2, -20 * x + 10)) / 2) as EasingFunction,
  },
  circular: {
    in: ((x: number) => 1 - Math.sqrt(1 - Math.pow(x, 2))) as EasingFunction,
    out: ((x: number) => Math.sqrt(1 - Math.pow(x - 1, 2))) as EasingFunction,
    inOut: ((x: number) => x < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2) as EasingFunction,
  },
  back: {
    in: ((x: number) => c3 * x * x * x - c1 * x * x) as EasingFunction,
    out: ((x: number) => 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)) as EasingFunction,
    inOut: ((x: number) => x < 0.5
      ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2) as EasingFunction,
  },
  elastic: {
    in: ((x: number) => -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4)) as EasingFunction,
    out: ((x: number) => Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1) as EasingFunction,
    inOut: ((x: number) => x < 0.5
      ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1) as EasingFunction,
  },
  bounce: {
    in: ((x: number) => 1 - Easings.bounce.out(1 - x)) as EasingFunction,
    out: ((x: number) => {
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
      } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
      } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
      }
    }) as EasingFunction,
    inOut: ((x: number) => x < 0.5
      ? (1 - Easings.bounce.out(1 - 2 * x)) / 2
      : (1 + Easings.bounce.out(2 * x - 1)) / 2) as EasingFunction,
  },
} as const;

export const applyEasing = (f: EasingFunction, x: number) => {
  if (x <= 0) {
    return 0;
  } else if (x >= 1) {
    return 1;
  } else {
    return f(x);
  }
}
