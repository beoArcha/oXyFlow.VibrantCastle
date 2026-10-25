import type React from "react";
import type { Root } from "react-dom/client";
import type { MockContext2D } from "../mockCanvas";

export interface CanvasMockCarrier {
  _mockCtx?: MockContext2D;
}

export interface ImageMockCarrier {
  _src?: string;
}

export interface ReactSyntheticEventPayload {
  target: unknown;
  currentTarget: unknown;
  bubbles: boolean;
}

export interface ReactPropsCarrier {
  [key: `__reactProps${string}`]: {
    onChange?: (e: ReactSyntheticEventPayload) => void;
  } | undefined;
}

export type TestProviderMode = "ui" | "integration" | "none";

export interface RenderIntoDomOptions {
  wrapper?: React.ComponentType<{ children: React.ReactNode }> | null;
  mode?: TestProviderMode;
}

export interface RenderHookResult<T, P> {
  result: { current: T };
  rerender: (newProps?: P) => Promise<void>;
  unmount: () => Promise<void>;
}

export interface RenderHookOptions<P> {
  initialProps?: P;
  wrapper?: React.ComponentType<{ children: React.ReactNode }> | null;
  mode?: TestProviderMode;
}

export interface MountedRootHandle {
  root: Root;
  container: HTMLElement;
}
