# re-animate-js

A lightweight React hook library for animating numeric values (or arrays of numeric values) with configurable easing.

## Introduction

Animations are great. They can draw attention to important areas of the application, smooth transitions to help the user maintain context, or just make things look snazzy. And it's really great when you can implement your animations in CSS - they perform well and there's lots of support out there. But sometimes, what you really need to do is animate the property of a React component, especially if the source is closed.

`re-animate-js` solves this problem. With one simple hook, you can have any numeric parameter slide from one value to another over time. If you have a lot of values that you need to animate in sync, you can pass them as an array. Arbitrary easing functions are supported, with many of the most common ones built in. Pass in `before` and `after` functions if you need to run additional logic when the animation runs.

Play around with it [in the live demo](https://mattputnam.github.io/re-animate-js/)

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
  const { animatedValue } = useAnimateOnMount(100, {
    from: 0,
    durationMs: 1500,
    easingFunction: Easings.sine.inOut,
  });

  return <ProgressBar percentage={animatedValue} />;
};
```

All hooks share the same shape: `useAnimateXxx(value, opts?)`. The first argument is the value being animated (or, for `useAnimateOnChange`, the value being driven). Pass a `number` to get a `number` back; pass a `number[]` to get a `number[]` of the same length back. Array inputs animate every element on a single shared rAF cycle (one `before`, one `after`, one `isAnimating`).

## API

### `useAnimateOnMount(value, opts?)`

Animates from `opts.from` to `value` once when the component mounts.

| Prop (in `opts`) | Type | Default | Description |
| --- | --- | --- | --- |
| `from` | `T` | `0` (scalar) / `Array(N).fill(0)` (array) | Origin of the animation. |
| `durationMs` | `number` | `1000` | Animation duration in milliseconds. |
| `easingFunction` | `EasingFunction` | `Easings.linear` | Easing curve to apply. |
| `before` | `() => void` | — | Called once before the animation starts. |
| `after` | `() => void` | — | Called once after the animation finishes. |

Returns `{ animatedValue: T, isAnimating: boolean }`. Props are captured at mount; subsequent prop changes are ignored. Remount via a changing `key` to re-run.

### `useAnimateOnAction(value, opts?)`

Same animation semantics as `useAnimateOnMount`, but fires when the caller invokes the returned `trigger` function. Does not animate on mount.

```tsx
import { useAnimateOnAction, Easings } from "re-animate-js";

export const PulseCounter = () => {
  const { animatedValue, isAnimating, trigger } = useAnimateOnAction(100, {
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

Same `opts` as `useAnimateOnMount`. Returns `{ animatedValue: T, isAnimating: boolean, trigger: () => void }`.

- `trigger` has a stable identity across renders.
- Props are captured at the moment `trigger` is invoked; mid-flight prop changes do not disturb a running animation.
- Calling `trigger` mid-animation cancels the current run (no `after` for the cancelled run) and starts fresh from `from`.

### `useAnimateOnChange(value, opts?)`

Animates whenever `value` changes. No animation on mount. Mid-flight changes continue from the current exposed value (no snap-back) over a fresh full `durationMs`.

```tsx
import { useAnimateOnChange } from "re-animate-js";

export const AnimatedScore = ({ score }: { score: number }) => {
  const { animatedValue } = useAnimateOnChange(score, { durationMs: 400 });
  return <div>{animatedValue.toFixed(0)}</div>;
};
```

| Prop (in `opts`) | Type | Default | Description |
| --- | --- | --- | --- |
| `durationMs` | `number` | `1000` | Duration of each run. |
| `easingFunction` | `EasingFunction` | `Easings.linear` | Easing curve. |
| `before` | `() => void` | — | Fires once per animation start. |
| `after` | `() => void` | — | Fires once per completed run. Not fired for cancelled runs. |

No `from` — origin is always the current exposed value. Returns `{ animatedValue: T, isAnimating: boolean }`. Equality between renders is `Object.is` for scalars and length-and-element-wise `Object.is` for arrays. For arrays, length must remain stable for the lifetime of the hook instance.

### Animating arrays

Pass a `number[]` as the first argument to any of the three hooks. All elements share one animation cycle:

```tsx
import { useAnimateOnChange } from "re-animate-js";

export const MovingPoints = ({ xs }: { xs: number[] }) => {
  const { animatedValue } = useAnimateOnChange(xs, { durationMs: 300 });
  return (
    <svg>
      {animatedValue.map((x, i) => (
        <circle key={i} cx={x} cy={i * 10} r={3} />
      ))}
    </svg>
  );
};
```

This is more efficient and synchronization-safe compared to calling the hook N times — a single `requestAnimationFrame` per visible frame drives all elements.

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
npm run lint
npm test
```

Outputs compiled JS and type declarations to `dist/`.

## Playground

To play with the hooks interactively:

```bash
npm run demo
```

This opens a local Vite dev server with one tab per hook. Each demo gives you sliders for value/`from`/duration, a dropdown for easing, and a code snippet that mirrors the current control values. The playground source lives under `playground/` and is excluded from the published package.
