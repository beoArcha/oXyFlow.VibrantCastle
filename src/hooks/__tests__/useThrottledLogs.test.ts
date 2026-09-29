import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { useThrottledLogs, useThrottledLogCount, UseThrottledLogsOptions } from "../useThrottledLogs";
import { LoggerManager, LogLevel, LogRecord } from "@lib/logger";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

describe("useThrottledLogs & useThrottledLogCount Hooks", () => {
  const manager = LoggerManager.getInstance();
  const ringBuffer = manager.ringBuffer;

  const createDummyRecord = (message: string, category: string = "general"): LogRecord => ({
    id: `log-${Math.random()}`,
    timestamp: Date.now(),
    timeFormatted: "12:00:00.000",
    level: LogLevel.INFO,
    levelName: "INFO",
    message,
    category,
  });

  beforeEach(() => {
    ringBuffer.clear();
  });

  afterEach(async () => {
    ringBuffer.clear();
    await cleanupDom();
  });

  it("loads existing logs on mount", async () => {
    ringBuffer.write(createDummyRecord("Existing log 1", "engine"));
    ringBuffer.write(createDummyRecord("Existing log 2", "render"));

    const { result, unmount } = await renderCustomHook(() => useThrottledLogs({ throttleMs: 50 }));

    expect(result.current.logs.length).toBe(2);
    expect(result.current.logs[0].message).toBe("Existing log 1");
    expect(result.current.logs[1].message).toBe("Existing log 2");

    await unmount();
  });

  it("filters logs by categories", async () => {
    ringBuffer.write(createDummyRecord("Engine log", "engine"));
    ringBuffer.write(createDummyRecord("Combat log", "combat"));
    ringBuffer.write(createDummyRecord("Audio log", "audio"));

    const { result, unmount } = await renderCustomHook(() =>
      useThrottledLogs({ throttleMs: 50, categories: ["combat", "audio"] })
    );

    expect(result.current.logs.length).toBe(2);
    expect(result.current.logs.map((l) => l.message)).toEqual(["Combat log", "Audio log"]);

    await unmount();
  });

  it("immediately updates filtered logs when categories prop changes", async () => {
    ringBuffer.write(createDummyRecord("Engine log", "engine"));
    ringBuffer.write(createDummyRecord("Combat log", "combat"));

    const { result, rerender, unmount } = await renderCustomHook(
      (options: UseThrottledLogsOptions) => useThrottledLogs(options),
      { throttleMs: 50, categories: ["engine"] }
    );

    expect(result.current.logs.length).toBe(1);
    expect(result.current.logs[0].message).toBe("Engine log");

    // Change categories to combat
    await rerender({ throttleMs: 50, categories: ["combat"] });

    expect(result.current.logs.length).toBe(1);
    expect(result.current.logs[0].message).toBe("Combat log");

    await unmount();
  });

  it("throttles rapid log additions and flushes after throttleMs", async () => {
    const { result, unmount } = await renderCustomHook(() => useThrottledLogs({ throttleMs: 40 }));

    expect(result.current.logs.length).toBe(0);

    // Rapid burst of 5 logs
    for (let i = 0; i < 5; i++) {
      ringBuffer.write(createDummyRecord(`Burst ${i}`));
    }

    // Immediately after burst, state has not flushed yet
    expect(result.current.logs.length).toBe(0);

    // Wait for throttle duration inside act
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

    expect(result.current.logs.length).toBe(5);

    await unmount();
  });

  it("clears logs from ring buffer and state when clearLogs is called", async () => {
    ringBuffer.write(createDummyRecord("Log before clear"));

    const { result, unmount } = await renderCustomHook(() => useThrottledLogs({ throttleMs: 50 }));

    expect(result.current.logs.length).toBe(1);

    await act(async () => {
      result.current.clearLogs();
    });

    expect(result.current.logs.length).toBe(0);
    expect(ringBuffer.size).toBe(0);

    await unmount();
  });

  it("tracks log count with throttling via useThrottledLogCount", async () => {
    const { result, unmount } = await renderCustomHook(() => useThrottledLogCount(40));

    expect(result.current).toBe(0);

    ringBuffer.write(createDummyRecord("Msg 1"));
    ringBuffer.write(createDummyRecord("Msg 2"));
    ringBuffer.write(createDummyRecord("Msg 3"));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

    expect(result.current).toBe(3);

    await unmount();
  });
});
