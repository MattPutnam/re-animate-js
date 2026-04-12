import { act, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnimateOnAction } from "../useAnimateOnAction";
import { advanceFrame, installRafHarness, pendingFrameCount, restoreRafHarness } from "./rafHarness";

beforeEach(() => installRafHarness());
afterEach(() => restoreRafHarness());

type Props = Parameters<typeof useAnimateOnAction>[0];

const Probe = (props: Props & { onTrigger?: (t: () => void) => void }) => {
  const { animatedValue, isAnimating, trigger } = useAnimateOnAction(props);
  props.onTrigger?.(trigger);
  return (
    <>
      <span data-testid="value">{animatedValue}</span>
      <span data-testid="animating">{String(isAnimating)}</span>
    </>
  );
};

const readValue = (c: HTMLElement) => Number(c.querySelector("[data-testid=value]")!.textContent);
const readAnimating = (c: HTMLElement) => c.querySelector("[data-testid=animating]")!.textContent === "true";

describe("useAnimateOnAction — US1 (trigger-driven animation)", () => {
  it("C1: before any trigger, animatedValue === from and isAnimating === false", () => {
    const { container } = render(<Probe value={100} from={5} durationMs={100} />);
    expect(readValue(container)).toBe(5);
    expect(readAnimating(container)).toBe(false);
  });

  it("C10: no animation is scheduled on mount", () => {
    render(<Probe value={100} from={0} durationMs={100} />);
    expect(pendingFrameCount()).toBe(0);
  });

  it("C4/C5/C6: trigger fires before once, animates to exact value, fires after once", () => {
    let trigger: (() => void) | undefined;
    const before = vi.fn();
    const after = vi.fn();

    const { container } = render(
      <Probe
        value={100}
        from={0}
        durationMs={100}
        before={before}
        after={after}
        onTrigger={(t) => (trigger = t)}
      />,
    );

    expect(before).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();

    act(() => trigger!());
    expect(before).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();

    act(() => advanceFrame(0));
    act(() => advanceFrame(100));

    expect(after).toHaveBeenCalledTimes(1);
    expect(readValue(container)).toBe(100);
  });

  it("C9: isAnimating flips true on trigger and false on completion, at most once each", () => {
    let trigger: (() => void) | undefined;
    const { container } = render(
      <Probe value={10} from={0} durationMs={50} onTrigger={(t) => (trigger = t)} />,
    );

    expect(readAnimating(container)).toBe(false);
    act(() => trigger!());
    expect(readAnimating(container)).toBe(true);
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));
    expect(readAnimating(container)).toBe(false);
  });

  it("C8: unmount mid-animation leaves no pending frames and logs no errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let trigger: (() => void) | undefined;

    const { unmount } = render(
      <Probe value={100} from={0} durationMs={200} onTrigger={(t) => (trigger = t)} />,
    );

    act(() => trigger!());
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));

    unmount();
    expect(pendingFrameCount()).toBe(0);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

describe("useAnimateOnAction — US2 (re-trigger semantics)", () => {
  it("C2: trigger identity is stable across re-renders", () => {
    let t1: (() => void) | undefined;
    let t2: (() => void) | undefined;
    let forceRerender: (() => void) | undefined;

    const Captor = () => {
      const [, setN] = useState(0);
      forceRerender = () => setN((n) => n + 1);
      const { trigger } = useAnimateOnAction({ value: 10, from: 0, durationMs: 50 });
      if (t1 === undefined) t1 = trigger;
      else t2 = trigger;
      return null;
    };

    render(<Captor />);
    act(() => forceRerender!());
    expect(t1).toBeDefined();
    expect(t2).toBeDefined();
    expect(t1).toBe(t2);
  });

  it("C3: trigger captures latest-render props, not initial mount props", () => {
    let trigger: (() => void) | undefined;
    let setTarget: ((n: number) => void) | undefined;

    const Parent = () => {
      const [target, setT] = useState(10);
      setTarget = setT;
      const { animatedValue, trigger: tr } = useAnimateOnAction({
        value: target,
        from: 0,
        durationMs: 50,
      });
      trigger = tr;
      return <span data-testid="value">{animatedValue}</span>;
    };

    const { container } = render(<Parent />);
    act(() => setTarget!(99));
    act(() => trigger!());
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));
    expect(readValue(container)).toBe(99);
  });

  it("C7: mid-flight re-trigger cancels old run (no after), restarts from `from`, isAnimating stays true", () => {
    let trigger: (() => void) | undefined;
    const before = vi.fn();
    const after = vi.fn();
    const animatingChanges: boolean[] = [];

    const Probe2 = () => {
      const { animatedValue, isAnimating, trigger: tr } = useAnimateOnAction({
        value: 100,
        from: 0,
        durationMs: 100,
        before,
        after,
      });
      trigger = tr;
      animatingChanges.push(isAnimating);
      return <span data-testid="value">{animatedValue}</span>;
    };

    const { container } = render(<Probe2 />);
    act(() => trigger!());
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));

    const midValue = readValue(container);
    expect(midValue).toBeGreaterThan(0);
    expect(midValue).toBeLessThan(100);

    // Re-trigger mid-flight.
    act(() => trigger!());
    // Value snaps back to `from`.
    expect(readValue(container)).toBe(0);
    // Cancelled run's `after` must not fire.
    expect(after).not.toHaveBeenCalled();
    // `before` fired twice (once per trigger invocation).
    expect(before).toHaveBeenCalledTimes(2);

    // Finish the new run.
    act(() => advanceFrame(100));
    act(() => advanceFrame(200));
    expect(readValue(container)).toBe(100);
    expect(after).toHaveBeenCalledTimes(1);

    // isAnimating stayed true across handoff: no intermediate false before completion.
    const firstTrueIdx = animatingChanges.indexOf(true);
    const finalFalseIdx = animatingChanges.lastIndexOf(false);
    const middle = animatingChanges.slice(firstTrueIdx, finalFalseIdx);
    // Middle slice should be solid `true` (no intermediate false during handoff).
    expect(middle.every((v) => v === true)).toBe(true);
  });
});

describe("useAnimateOnAction — edge cases (T014a)", () => {
  it("FR-013: durationMs=0 snaps to value on next frame with callbacks in order", () => {
    let trigger: (() => void) | undefined;
    const order: string[] = [];
    const before = vi.fn(() => order.push("before"));
    const after = vi.fn(() => order.push("after"));

    const { container } = render(
      <Probe
        value={42}
        from={0}
        durationMs={0}
        before={before}
        after={after}
        onTrigger={(t) => (trigger = t)}
      />,
    );

    act(() => trigger!());
    expect(before).toHaveBeenCalledTimes(1);
    act(() => advanceFrame(0));
    expect(readValue(container)).toBe(42);
    expect(after).toHaveBeenCalledTimes(1);
    expect(readAnimating(container)).toBe(false);
    expect(order).toEqual(["before", "after"]);
  });

  it("FR-014: from===value still fires before and after, value unchanged", () => {
    let trigger: (() => void) | undefined;
    const before = vi.fn();
    const after = vi.fn();

    const { container } = render(
      <Probe
        value={50}
        from={50}
        durationMs={100}
        before={before}
        after={after}
        onTrigger={(t) => (trigger = t)}
      />,
    );

    expect(readValue(container)).toBe(50);
    act(() => trigger!());
    expect(before).toHaveBeenCalledTimes(1);
    act(() => advanceFrame(0));
    act(() => advanceFrame(50));
    expect(readValue(container)).toBe(50);
    act(() => advanceFrame(100));
    expect(readValue(container)).toBe(50);
    expect(after).toHaveBeenCalledTimes(1);
  });
});
