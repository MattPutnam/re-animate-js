type FrameCallback = (timestamp: number) => void;

type Installed = {
  queue: Map<number, FrameCallback>;
  nextId: number;
  originalRaf: typeof globalThis.requestAnimationFrame | undefined;
  originalCaf: typeof globalThis.cancelAnimationFrame | undefined;
};

let installed: Installed | undefined;

export const installRafHarness = () => {
  if (installed) {
    throw new Error("rAF harness already installed");
  }
  const state: Installed = {
    queue: new Map(),
    nextId: 1,
    originalRaf: globalThis.requestAnimationFrame,
    originalCaf: globalThis.cancelAnimationFrame,
  };
  globalThis.requestAnimationFrame = ((cb: FrameCallback) => {
    const id = state.nextId++;
    state.queue.set(id, cb);
    return id;
  }) as typeof globalThis.requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => {
    state.queue.delete(id);
  }) as typeof globalThis.cancelAnimationFrame;
  installed = state;
};

export const restoreRafHarness = () => {
  if (!installed) return;
  if (installed.originalRaf) {
    globalThis.requestAnimationFrame = installed.originalRaf;
  }
  if (installed.originalCaf) {
    globalThis.cancelAnimationFrame = installed.originalCaf;
  }
  installed = undefined;
};

export const advanceFrame = (timestamp: number) => {
  if (!installed) throw new Error("rAF harness not installed");
  const entries = Array.from(installed.queue.entries());
  installed.queue.clear();
  for (const [, cb] of entries) {
    cb(timestamp);
  }
};

export const pendingFrameCount = (): number => {
  if (!installed) throw new Error("rAF harness not installed");
  return installed.queue.size;
};
