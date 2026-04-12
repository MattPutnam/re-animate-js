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
