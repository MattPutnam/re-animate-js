import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnimateOnChange } from "../useAnimateOnChange";
import { advanceFrame, installRafHarness, pendingFrameCount, restoreRafHarness } from "./rafHarness";

beforeEach(() => installRafHarness());
afterEach(() => restoreRafHarness());

type ScalarProbeProps = {
  value: number;
  durationMs?: number;
  before?: () => void;
  after?: () => void;
};

const Probe = ({ value, ...opts }: ScalarProbeProps) => {
  const { animatedValue, isAnimating } = useAnimateOnChange(value, opts);
  return (
    <>
      <span data-testid="value">{animatedValue}</span>
      <span data-testid="animating">{String(isAnimating)}</span>
    </>
  );
};

const readValue = (c: HTMLElement) => Number(c.querySelector("[data-testid=value]")!.textContent);
const readAnimating = (c: HTMLElement) =>
  c.querySelector("[data-testid=animating]")!.textContent === "true";

describe("useAnimateOnChange (scalar) — US1", () => {
  it("C1: before any change, animatedValue equals initial value and isAnimating is false", () => {
    const { container } = render(<Probe value={42} durationMs={100} />);
    expect(readValue(container)).toBe(42);
    expect(readAnimating(container)).toBe(false);
  });

  it("C2: mount with no change schedules zero rAF frames", () => {
    render(<Probe value={42} durationMs={100} />);
    expect(pendingFrameCount()).toBe(0);
  });

  it("C3/C7: changing value animates from current to target and settles exactly at target", () => {
    const { container, rerender } = render(<Probe value={0} durationMs={100} />);
    rerender(<Probe value={100} durationMs={100} />);

    act(() => advanceFrame(0));
    expect(readValue(container)).toBe(0);

    act(() => advanceFrame(50));
    const mid = readValue(container);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);

    act(() => advanceFrame(100));
    expect(readValue(container)).toBe(100);
  });

  it("C5/C6: before fires once before first frame, after fires once on completion", () => {
    const before = vi.fn();
    const after = vi.fn();

    const { rerender } = render(<Probe value={0} durationMs={50} before={before} after={after} />);
    expect(before).not.toHaveBeenCalled();

    rerender(<Probe value={10} durationMs={50} before={before} after={after} />);
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();

    act(() => advanceFrame(0));
    act(() => advanceFrame(50));

    expect(after).toHaveBeenCalledTimes(1);
  });

  it("C8: unmount mid-animation leaves zero pending frames and logs no errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender, unmount } = render(<Probe value={0} durationMs={200} />);
    rerender(<Probe value={100} durationMs={200} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));

    unmount();

    expect(pendingFrameCount()).toBe(0);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("C10: changing value to equal current exposed value starts no animation, fires no callbacks", () => {
    const before = vi.fn();
    const after = vi.fn();
    const { rerender, container } = render(<Probe value={50} durationMs={100} before={before} after={after} />);

    rerender(<Probe value={50} durationMs={100} before={before} after={after} />);
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(pendingFrameCount()).toBe(0);
    expect(readValue(container)).toBe(50);
    expect(readAnimating(container)).toBe(false);
  });

  it("C11: same-ref re-render does not disturb an in-flight animation or start a new one", () => {
    const before = vi.fn();
    const { rerender, container } = render(<Probe value={0} durationMs={100} before={before} />);
    rerender(<Probe value={100} durationMs={100} before={before} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));
    const beforeCount = before.mock.calls.length;
    const midValue = readValue(container);

    rerender(<Probe value={100} durationMs={100} before={before} />);
    expect(before.mock.calls.length).toBe(beforeCount);
    expect(readValue(container)).toBe(midValue);

    act(() => advanceFrame(100));
    expect(readValue(container)).toBe(100);
  });

  it("C12: durationMs=0 snaps to new value on next frame with before/after in order", () => {
    const order: string[] = [];
    const before = vi.fn(() => order.push("before"));
    const after = vi.fn(() => order.push("after"));

    const { rerender, container } = render(
      <Probe value={0} durationMs={0} before={before} after={after} />,
    );
    rerender(<Probe value={42} durationMs={0} before={before} after={after} />);

    expect(before).toHaveBeenCalledTimes(1);
    act(() => advanceFrame(0));
    expect(readValue(container)).toBe(42);
    expect(after).toHaveBeenCalledTimes(1);
    expect(readAnimating(container)).toBe(false);
    expect(order).toEqual(["before", "after"]);
  });
});

describe("useAnimateOnChange (scalar) — US2 (mid-flight continuation)", () => {
  it("C4: mid-flight retarget continues from current with fresh full duration", () => {
    const before = vi.fn();
    const after = vi.fn();

    const { rerender, container } = render(
      <Probe value={0} durationMs={500} before={before} after={after} />,
    );
    rerender(<Probe value={100} durationMs={500} before={before} after={after} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(250));
    const midValue = readValue(container);
    expect(midValue).toBeGreaterThan(0);
    expect(midValue).toBeLessThan(100);

    rerender(<Probe value={200} durationMs={500} before={before} after={after} />);
    expect(readValue(container)).toBe(midValue);
    expect(after).not.toHaveBeenCalled();
    expect(before).toHaveBeenCalledTimes(2);

    act(() => advanceFrame(0));
    act(() => advanceFrame(500));
    expect(readValue(container)).toBe(200);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("C9: isAnimating stays true across a mid-flight retarget", () => {
    const animatingLog: boolean[] = [];

    const Logger = (props: ScalarProbeProps) => {
      const { animatedValue, isAnimating } = useAnimateOnChange(props.value, props);
      animatingLog.push(isAnimating);
      return <span data-testid="value">{animatedValue}</span>;
    };

    const { rerender } = render(<Logger value={0} durationMs={200} />);
    rerender(<Logger value={100} durationMs={200} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(100));
    rerender(<Logger value={200} durationMs={200} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(200));

    const firstTrueIdx = animatingLog.indexOf(true);
    const lastFalseIdx = animatingLog.lastIndexOf(false);
    const middle = animatingLog.slice(firstTrueIdx, lastFalseIdx);
    expect(middle.every((v) => v === true)).toBe(true);
  });
});

// ===== Array-mode tests (T013) =====

type ArrayProbeProps = {
  value: number[];
  durationMs?: number;
  before?: () => void;
  after?: () => void;
};

const ArrayProbe = ({ value, ...opts }: ArrayProbeProps) => {
  const { animatedValue, isAnimating } = useAnimateOnChange(value, opts);
  return (
    <>
      <span data-testid="value">{JSON.stringify(animatedValue)}</span>
      <span data-testid="animating">{String(isAnimating)}</span>
    </>
  );
};

const readArray = (c: HTMLElement): number[] =>
  JSON.parse(c.querySelector("[data-testid=value]")!.textContent ?? "[]");

describe("useAnimateOnChange (array)", () => {
  it("H2: parent updates array — all elements settle at the new array", () => {
    const { container, rerender } = render(<ArrayProbe value={[10, 20, 30]} durationMs={100} />);
    rerender(<ArrayProbe value={[50, 60, 70]} durationMs={100} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(100));
    expect(readArray(container)).toEqual([50, 60, 70]);
  });

  it("H3: same-element-wise array (different reference) does NOT trigger an animation", () => {
    const before = vi.fn();
    const after = vi.fn();
    const { rerender, container } = render(
      <ArrayProbe value={[1, 2, 3]} durationMs={100} before={before} after={after} />,
    );
    rerender(<ArrayProbe value={[1, 2, 3]} durationMs={100} before={before} after={after} />);
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(pendingFrameCount()).toBe(0);
    expect(readArray(container)).toEqual([1, 2, 3]);
  });

  it("H4: mid-flight retarget — value at the moment of retarget matches the just-rendered frame", () => {
    const before = vi.fn();
    const after = vi.fn();
    const { rerender, container } = render(
      <ArrayProbe value={[0, 0]} durationMs={200} before={before} after={after} />,
    );
    rerender(<ArrayProbe value={[100, 100]} durationMs={200} before={before} after={after} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(100));
    const mid = readArray(container);
    expect(mid[0]).toBeGreaterThan(0);
    expect(mid[0]).toBeLessThan(100);

    rerender(<ArrayProbe value={[200, 200]} durationMs={200} before={before} after={after} />);
    expect(readArray(container)).toEqual(mid);
    expect(after).not.toHaveBeenCalled();
    expect(before).toHaveBeenCalledTimes(2);

    act(() => advanceFrame(0));
    act(() => advanceFrame(200));
    expect(readArray(container)).toEqual([200, 200]);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("H5: before/after fire once per run, never per element", () => {
    const before = vi.fn();
    const after = vi.fn();
    const { rerender } = render(
      <ArrayProbe value={[1, 2, 3, 4, 5]} durationMs={50} before={before} after={after} />,
    );
    rerender(<ArrayProbe value={[10, 20, 30, 40, 50]} durationMs={50} before={before} after={after} />);
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("H8: empty array — no rAF, no callbacks, even across re-renders", () => {
    const before = vi.fn();
    const after = vi.fn();
    const { rerender, container } = render(
      <ArrayProbe value={[]} durationMs={100} before={before} after={after} />,
    );
    rerender(<ArrayProbe value={[]} durationMs={100} before={before} after={after} />);
    expect(pendingFrameCount()).toBe(0);
    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(readArray(container)).toEqual([]);
  });
});
