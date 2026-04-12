import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnimateOnChange } from "../useAnimateOnChange";
import { advanceFrame, installRafHarness, pendingFrameCount, restoreRafHarness } from "./rafHarness";

beforeEach(() => installRafHarness());
afterEach(() => restoreRafHarness());

type Props = Parameters<typeof useAnimateOnChange>[0];

const Probe = (props: Props) => {
  const { animatedValue, isAnimating } = useAnimateOnChange(props);
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

describe("useAnimateOnChange — US1 (animate on prop change)", () => {
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

    const { rerender } = render(
      <Probe value={0} durationMs={50} before={before} after={after} />,
    );
    expect(before).not.toHaveBeenCalled();

    rerender(<Probe value={10} durationMs={50} before={before} after={after} />);
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();

    act(() => advanceFrame(0));
    act(() => advanceFrame(50));

    expect(after).toHaveBeenCalledTimes(1);
    expect(before).toHaveBeenCalledTimes(1);
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
    const { rerender, container } = render(
      <Probe value={50} durationMs={100} before={before} after={after} />,
    );

    // value changes to 50 again — new prop, same reference — no animation.
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

    // Re-render with same `value: 100`. Effect should not fire again.
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

describe("useAnimateOnChange — US2 (mid-flight continuation)", () => {
  it("C4: mid-flight retarget continues from current exposed value with fresh full duration", () => {
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

    // Retarget mid-flight.
    rerender(<Probe value={200} durationMs={500} before={before} after={after} />);
    expect(readValue(container)).toBe(midValue);
    expect(after).not.toHaveBeenCalled();
    expect(before).toHaveBeenCalledTimes(2);

    // Fresh full 500ms duration on the new run.
    act(() => advanceFrame(0));
    act(() => advanceFrame(500));
    expect(readValue(container)).toBe(200);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("C9: isAnimating stays true across a mid-flight retarget (no intermediate false)", () => {
    const animatingLog: boolean[] = [];

    const Logger = (props: Props) => {
      const { animatedValue, isAnimating } = useAnimateOnChange(props);
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

  it("C4 (rapid): three retargets between two advanceFrame calls → 3× before, 1× after, monotonic in final run", () => {
    const before = vi.fn();
    const after = vi.fn();

    const { rerender, container } = render(
      <Probe value={0} durationMs={100} before={before} after={after} />,
    );

    // Three retargets, no advanceFrame interleaved.
    rerender(<Probe value={100} durationMs={100} before={before} after={after} />);
    rerender(<Probe value={50} durationMs={100} before={before} after={after} />);
    rerender(<Probe value={80} durationMs={100} before={before} after={after} />);

    expect(before).toHaveBeenCalledTimes(3);
    expect(after).not.toHaveBeenCalled();

    // Advance the full duration for the final run.
    act(() => advanceFrame(0));
    const samples: number[] = [readValue(container)];
    for (const t of [25, 50, 75, 100]) {
      act(() => advanceFrame(t));
      samples.push(readValue(container));
    }

    expect(readValue(container)).toBe(80);
    expect(after).toHaveBeenCalledTimes(1);

    // Within the final run, animatedValue moves monotonically toward 80 from its starting point.
    const start = samples[0];
    const dir = 80 > start ? 1 : -1;
    for (let i = 1; i < samples.length; i++) {
      expect((samples[i] - samples[i - 1]) * dir).toBeGreaterThanOrEqual(0);
    }
  });
});
