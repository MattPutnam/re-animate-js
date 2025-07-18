import { type EasingFunction } from "./easing";

export const DEFAULT_DURATION_MS = 1000;

export type UseAnimateProps = {
  /** The value to animate */
  value: number;
  /** The time duration for the animation to last in milliseconds, defaults to 1000 */
  durationMs?: number;
  /** The easing function to use, defaults to linear */
  easingFunction?: EasingFunction;
  /** Code to run immediately before animation starts */
  before?: () => void;
  /** Code to run immediately after animation finishes */
  after?: () => void;
};
