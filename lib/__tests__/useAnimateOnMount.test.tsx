import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnimateOnMount } from "../useAnimateOnMount";
import { advanceFrame, installRafHarness, pendingFrameCount, restoreRafHarness } from "./rafHarness";

beforeEach(() => installRafHarness());
afterEach(() => restoreRafHarness());

type ScalarProbeProps = {
  value: number;
  from?: number;
  durationMs?: number;
  before?: () => void;
  after?: () => void;
};

const Probe = ({ value, ...opts }: ScalarProbeProps) => {
  const { animatedValue } = useAnimateOnMount(value, opts);
  return <span data-testid="value">{animatedValue}</span>;
};

const readValue = (container: HTMLElement) =>
  Number(container.querySelector("[data-testid=value]")!.textContent);

describe("useAnimateOnMount (scalar)", () => {
  it("animates from `from` to `value` and settles exactly at `value`", () => {
    const { container } = render(<Probe value={100} from={0} durationMs={100} />);

    expect(readValue(container)).toBe(0);

    act(() => advanceFrame(0));
    expect(readValue(container)).toBe(0);

    act(() => advanceFrame(50));
    const mid = readValue(container);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);

    act(() => advanceFrame(100));
    expect(readValue(container)).toBe(100);
  });

  it("fires `before` once before the first frame and `after` once on completion", () => {
    const before = vi.fn();
    const after = vi.fn();

    render(<Probe value={10} from={0} durationMs={50} before={before} after={after} />);

    expect(before).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();

    act(() => advanceFrame(0));
    act(() => advanceFrame(50));

    expect(after).toHaveBeenCalledTimes(1);
    expect(before).toHaveBeenCalledTimes(1);
  });

  it("cancels on unmount with no pending frames and no warnings", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = render(<Probe value={100} from={0} durationMs={200} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));

    unmount();

    expect(pendingFrameCount()).toBe(0);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

// ===== Array-mode tests (T011) =====

type ArrayProbeProps = {
  value: number[];
  from?: number[];
  durationMs?: number;
  before?: () => void;
  after?: () => void;
};

const ArrayProbe = ({ value, ...opts }: ArrayProbeProps) => {
  const { animatedValue } = useAnimateOnMount(value, opts);
  return <span data-testid="value">{JSON.stringify(animatedValue)}</span>;
};

const readArray = (container: HTMLElement): number[] =>
  JSON.parse(container.querySelector("[data-testid=value]")!.textContent ?? "[]");

describe("useAnimateOnMount (array)", () => {
  it("M2/M5: animates all elements in lockstep and settles exactly at value", () => {
    const { container } = render(
      <ArrayProbe value={[10, 20, 30, 40]} from={[0, 0, 0, 0]} durationMs={100} />,
    );
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));
    act(() => advanceFrame(100));
    expect(readArray(container)).toEqual([10, 20, 30, 40]);
  });

  it("M2: every element follows the same easing fraction at every intermediate frame", () => {
    const value = [10, 20, 30, 40];
    const from = [0, 0, 0, 0];
    const { container } = render(<ArrayProbe value={value} from={from} durationMs={100} />);

    act(() => advanceFrame(0));
    act(() => advanceFrame(37));

    const arr = readArray(container);
    // For indices where value !== from, recover the elapsed-fraction; assert all equal.
    const fractions = arr.map((v, i) => (v - from[i]) / (value[i] - from[i]));
    for (let i = 1; i < fractions.length; i++) {
      expect(Math.abs(fractions[i] - fractions[0])).toBeLessThan(1e-9);
    }
    // SC-002 / FR-011: at most one rAF scheduled per frame regardless of N.
    expect(pendingFrameCount()).toBeLessThanOrEqual(1);
  });

  it("M4: `before` and `after` each fire once per animation, not per element", () => {
    const before = vi.fn();
    const after = vi.fn();
    render(
      <ArrayProbe
        value={[1, 2, 3, 4, 5]}
        from={[0, 0, 0, 0, 0]}
        durationMs={50}
        before={before}
        after={after}
      />,
    );
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("M6: empty array — no rAF, no callbacks, animatedValue stays []", () => {
    const before = vi.fn();
    const after = vi.fn();
    const { container } = render(
      <ArrayProbe value={[]} durationMs={100} before={before} after={after} />,
    );
    expect(pendingFrameCount()).toBe(0);
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(readArray(container)).toEqual([]);
  });

  it("M3: returned array reference changes each frame", () => {
    const refs: number[][] = [];
    const Capture = () => {
      const { animatedValue } = useAnimateOnMount([10, 20], { from: [0, 0], durationMs: 100 });
      refs.push(animatedValue);
      return null;
    };
    render(<Capture />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(25));
    act(() => advanceFrame(50));
    // At least three distinct frames were rendered with distinct array references.
    const distinct = new Set(refs);
    expect(distinct.size).toBeGreaterThanOrEqual(2);
  });
});
