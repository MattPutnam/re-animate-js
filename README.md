# re-animate-js

A lightweight React hook library for animating numeric values with configurable easing.

## Installation

```bash
npm install re-animate-js
```

Peer dependency: `react` ^19.

## Usage

```tsx
import { useAnimateOnMount, Easings } from "re-animate-js";
import { ProgressBar } from "./ProgressBar";

export const LoadingBar = () => {
  const { animatedValue } = useAnimateOnMount({
    value: 100,
    from: 0,
    durationMs: 1500,
    easingFunction: Easings.sine.inOut,
  });

  return <ProgressBar percentage={animatedValue} />;
};
```

## API

### `useAnimateOnMount(props)`

Animates a numeric value once when the component mounts, using `requestAnimationFrame`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | — | Target value to animate to. |
| `from` | `number` | `0` | Starting value. |
| `durationMs` | `number` | `1000` | Animation duration in milliseconds. |
| `easingFunction` | `EasingFunction` | `Easings.linear` | Easing curve to apply. |
| `before` | `() => void` | — | Called immediately before the animation starts. |
| `after` | `() => void` | — | Called immediately after the animation finishes. |

Returns `{ animatedValue: number, isAnimating: boolean }`.

Props are captured at mount time; subsequent changes are ignored. Remount the component (e.g. with a changing `key`) to re-run.

### `useAnimateOnAction(props)`

Same animation semantics as `useAnimateOnMount`, but fires when the caller invokes the returned `trigger` function. Does not animate on mount.

```tsx
import { useAnimateOnAction, Easings } from "re-animate-js";

export const PulseCounter = () => {
  const { animatedValue, isAnimating, trigger } = useAnimateOnAction({
    value: 100,
    from: 0,
    durationMs: 400,
    easingFunction: Easings.sine.inOut,
  });

  return (
    <>
      <button onClick={trigger} disabled={isAnimating}>Pulse</button>
      <div>{animatedValue.toFixed(1)}</div>
    </>
  );
};
```

Props are identical to `useAnimateOnMount`. Returns `{ animatedValue: number, isAnimating: boolean, trigger: () => void }`.

- `trigger` has a stable identity across renders — safe to pass into memoized children or effect dependency arrays.
- Props are captured at the moment `trigger` is invoked; mid-flight prop changes do not disturb a running animation.
- Calling `trigger` during an in-flight animation cancels the running animation (no `after` callback for the cancelled run) and starts a new one from `from`.

### `useAnimateOnChange(props)`

Animates whenever the `value` prop changes. No animation on mount. Mid-flight changes continue from the current exposed value (no snap-back) over a fresh full `durationMs`.

```tsx
import { useAnimateOnChange } from "re-animate-js";

export const AnimatedScore = ({ score }: { score: number }) => {
  const { animatedValue } = useAnimateOnChange({ value: score, durationMs: 400 });
  return <div>{animatedValue.toFixed(0)}</div>;
};
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | — | Target value. Animations fire when this changes (equality by `Object.is`). |
| `durationMs` | `number` | `1000` | Duration of each run, captured at the render that delivered the new `value`. |
| `easingFunction` | `EasingFunction` | `Easings.linear` | Captured at the same render as `durationMs`. |
| `before` | `() => void` | — | Fires once per animation start (including runs later cancelled). |
| `after` | `() => void` | — | Fires once per animation that completes. Not fired for cancelled runs. |

Returns `{ animatedValue: number, isAnimating: boolean }`. No `trigger` — animations are driven by prop changes. Mid-flight retargets start from the current exposed value; `isAnimating` stays `true` across the handoff.

### `Easings`

Ready-to-use easing functions. Each family (except `linear`) exposes `in`, `out`, and `inOut` variants:

- `linear`
- `sine`
- `polynomial(degree)` — call with a degree, e.g. `Easings.polynomial(3).inOut`
- `exponential`
- `circular`
- `back`
- `elastic`
- `bounce`

### `EasingFunction`

`(x: number) => number` where `x` is in `[0, 1]`. Custom easing functions are supported — pass any function satisfying this signature to `easingFunction`.

## Development

```bash
npm run build
```

Outputs compiled JS and type declarations to `dist/`.
