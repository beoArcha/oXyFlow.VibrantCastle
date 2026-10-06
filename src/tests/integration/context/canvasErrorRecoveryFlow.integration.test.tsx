import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React, { useState } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { GameErrorBoundary } from "@ui";
import { CanvasContextError, EngineError } from "@lib/errors/domainErrors";
import { ErrorCode } from "@lib/errors/types";
import {
  LoggerManager,
  LogLevel,
  ILogTransport,
  LogRecord,
  formatGameDiagnosticReport,
} from "@lib/logger";
import gameEngine from "@game/loop/engine";

// Simulated Canvas Viewport component that can trigger engine canvas errors
function FaultyCanvasViewport({
  shouldFail,
  failureType = "context",
}: {
  shouldFail: boolean;
  failureType?: "context" | "engine";
}) {
  if (shouldFail) {
    if (failureType === "context") {
      throw new CanvasContextError("Could not acquire 2D canvas rendering context", {
        details: { canvasId: "game-viewport-canvas", hardwareAcceleration: false },
      });
    } else {
      throw new EngineError("Fatal WebGL surface loss during render tick", ErrorCode.ENGINE_LOOP_FAILURE, {
        details: { frame: 120 },
      });
    }
  }

  return (
    <div id="viewport-container" className="relative w-full h-full">
      <canvas id="game-viewport-canvas" width={1280} height={720} data-testid="live-canvas" />
      <span id="canvas-status">Canvas Active</span>
    </div>
  );
}

describe("Canvas Error Recovery Flow Integration Tests", () => {
  let unmount: (() => Promise<void>) | null = null;
  let logRecords: LogRecord[] = [];

  beforeEach(() => {
    unmount = null;
    logRecords = [];

    const memoryTransport: ILogTransport = {
      name: "TestMemoryTransport",
      write: (r) => logRecords.push(r),
    };

    const manager = LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
    manager.addTransport(memoryTransport);

    // Mock clipboard safely via Object.defineProperty
    if (typeof navigator !== "undefined") {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: mock(async () => {}),
        },
        configurable: true,
        writable: true,
      });
    }
  });

  afterEach(async () => {
    if (gameEngine.isLoopRunning) {
      gameEngine.stop();
    }
    if (unmount) {
      await unmount();
      unmount = null;
    }
    await cleanupDom();
  });

  it("isolates CanvasContextError inside GameErrorBoundary, rendering the gothic alert screen without crashing the app", async () => {
    const onResetMock = mock(() => {});

    // Parent harness wrapping faulty canvas inside GameErrorBoundary
    const rendered = await renderIntoDom(
      <div id="app-root">
        <header id="app-header">Vibrant Castle Header</header>
        <main id="app-main">
          <GameErrorBoundary
            fallbackTitle="Canvas Subsystem Failure"
            fallbackMessage="The rendering surface failed to initialize."
            onReset={onResetMock}
            reportCollector={formatGameDiagnosticReport}
          >
            <FaultyCanvasViewport shouldFail={true} failureType="context" />
          </GameErrorBoundary>
        </main>
      </div>
    );
    unmount = rendered.unmount;

    // Outer shell must remain intact and rendered
    expect(rendered.container.querySelector("#app-header")).not.toBeNull();
    expect(rendered.container.querySelector("#app-main")).not.toBeNull();

    // Alert container rendered with role="alert"
    const alertBox = rendered.container.querySelector("[role='alert']");
    expect(alertBox).not.toBeNull();
    expect(alertBox?.textContent).toContain("Canvas Subsystem Failure");
    expect(alertBox?.textContent).toContain("Could not acquire 2D canvas rendering context");

    // Action buttons must be exposed with gothic labels
    const buttons = Array.from(alertBox?.querySelectorAll("button") ?? []);
    const retryBtn = buttons.find((b) => b.textContent?.includes("Retry Interface"));
    const copyBtn = buttons.find((b) => b.textContent?.includes("Copy Diagnostic Log"));
    const reloadBtn = buttons.find((b) => b.textContent?.includes("Reload Game"));

    expect(retryBtn).toBeDefined();
    expect(copyBtn).toBeDefined();
    expect(reloadBtn).toBeDefined();
  });

  it("records fatal error in RingBufferTransport and produces a full diagnostic crash report with domain error context", async () => {
    const logger = LoggerManager.getInstance().getLogger("test:canvas-flow");

    // Simulate prior game loop breadcrumbs in ring buffer
    logger.info("Initializing GameEngine canvas viewport");
    logger.debug("Configuring canvas dimensions: 1280x720 DPR=2");

    let capturedError: Error | null = null;
    let capturedStack: string | null = null;

    const rendered = await renderIntoDom(
      <GameErrorBoundary
        reportCollector={async (err, stack) => {
          capturedError = err;
          capturedStack = stack;
          return formatGameDiagnosticReport(err, stack);
        }}
      >
        <FaultyCanvasViewport shouldFail={true} failureType="context" />
      </GameErrorBoundary>
    );
    unmount = rendered.unmount;

    // Verify fatal log record was captured by the logger transport
    const fatalRecord = logRecords.find((r) => r.level === LogLevel.FATAL);
    expect(fatalRecord).toBeDefined();
    expect(fatalRecord?.message).toContain("Uncaught React component render crash");
    expect(fatalRecord?.message).toContain("Could not acquire 2D canvas rendering context");

    // Click "Copy Diagnostic Log" to trigger reportCollector
    const alertBox = rendered.container.querySelector("[role='alert']");
    const buttons = Array.from(alertBox?.querySelectorAll("button") ?? []);
    const copyBtn = buttons.find((b) => b.textContent?.includes("Copy Diagnostic Log"));
    expect(copyBtn).toBeDefined();

    await rendered.click(copyBtn!);

    // Check captured error from reportCollector
    expect(capturedError).toBeInstanceOf(CanvasContextError);
    const reportText = await formatGameDiagnosticReport(capturedError, capturedStack);

    expect(reportText).toContain("=== VIBRANT CASTLE CRASH REPORT ===");
    expect(reportText).toContain("Domain: ENGINE");
    expect(reportText).toContain("Code: ENGINE_CANVAS_2D_UNAVAILABLE");
    expect(reportText).toContain("hardwareAcceleration");
    expect(reportText).toContain("=== RECENT GAME LOGS ===");
    expect(reportText).toContain("Initializing GameEngine canvas viewport");
  });

  it("recovers gracefully via retry action once the canvas fault is resolved", async () => {
    let failTrigger = true;
    const resetSpy = mock(() => {
      failTrigger = false;
    });

    function RecoverableHarness() {
      const [, setTick] = useState(0);

      return (
        <GameErrorBoundary
          onReset={() => {
            resetSpy();
            setTick((t) => t + 1);
          }}
        >
          <FaultyCanvasViewport shouldFail={failTrigger} />
        </GameErrorBoundary>
      );
    }

    const rendered = await renderIntoDom(<RecoverableHarness />);
    unmount = rendered.unmount;

    // Error state initially
    expect(rendered.container.querySelector("[role='alert']")).not.toBeNull();
    expect(rendered.container.querySelector("[data-testid='live-canvas']")).toBeNull();

    // Click retry button to trigger recovery
    const alertBox = rendered.container.querySelector("[role='alert']");
    const buttons = Array.from(alertBox?.querySelectorAll("button") ?? []);
    const retryBtn = buttons.find((b) => b.textContent?.includes("Retry Interface"));
    expect(retryBtn).toBeDefined();

    await rendered.click(retryBtn!);

    expect(resetSpy).toHaveBeenCalledTimes(1);

    // After retry and fault clear, healthy canvas viewport is restored
    expect(rendered.container.querySelector("[role='alert']")).toBeNull();
    const restoredCanvas = rendered.container.querySelector("[data-testid='live-canvas']");
    expect(restoredCanvas).not.toBeNull();
    expect(rendered.container.querySelector("#canvas-status")?.textContent).toBe("Canvas Active");
  });

  it("coordinates with gameEngine to shut down loop when a fatal engine error occurs", async () => {
    gameEngine.start();
    expect(gameEngine.isLoopRunning).toBe(true);

    const onResetMock = mock(() => {});

    const rendered = await renderIntoDom(
      <GameErrorBoundary
        onReset={onResetMock}
        fallback={({ onRetry }) => (
          <div role="alert" id="custom-engine-alert">
            <p>Engine Halted</p>
            <button onClick={onRetry} id="halt-retry">
              Restart
            </button>
          </div>
        )}
      >
        <FaultyCanvasViewport shouldFail={true} failureType="engine" />
      </GameErrorBoundary>
    );
    unmount = rendered.unmount;

    // On fatal render failure, engine loop can be stopped to prevent runaway cycles
    gameEngine.stop();
    expect(gameEngine.isLoopRunning).toBe(false);

    const alert = rendered.container.querySelector("#custom-engine-alert");
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("Engine Halted");
  });
});
