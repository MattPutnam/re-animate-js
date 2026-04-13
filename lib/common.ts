import { type EasingFunction } from "./easing";

export const DEFAULT_DURATION_MS = 1000;

export type Easable = number | number[];

export type UseAnimateOpts = {
  /** Duration in ms; defaults to 1000 */
  durationMs?: number;
  /** Easing curve; defaults to linear */
  easingFunction?: EasingFunction;
  /** Fires once per animation that starts */
  before?: () => void;
  /** Fires once per animation that completes (never for cancelled runs) */
  after?: () => void;
};
