import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnimateOnMount } from "../useAnimateOnMount";
import { advanceFrame, installRafHarness, pendingFrameCount, restoreRafHarness } from "./rafHarness";

beforeEach(() => installRafHarness());
afterEach(() => restoreRafHarness());

const Probe = (props: Parameters<typeof useAnimateOnMount>[0]) => {
  const { animatedValue } = useAnimateOnMount(props);
  return <span data-testid="value">{animatedValue}</span>;
};

const readValue = (container: HTMLElement) => Number(container.querySelector("[data-testid=value]")!.textContent);

describe("useAnimateOnMount", () => {
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
