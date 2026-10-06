import { describe, it, expect, beforeEach } from "bun:test";
import { defaultAtlasSlicingEngine } from "@/game/engine/meta/slicing/AtlasSlicingEngine";
import { AutoIslandSlicingStrategy } from "@/game/engine/meta/slicing/AutoIslandSlicingStrategy";
import { LoggerManager, LogLevel } from "@/lib/logger";
import { AssetError, ParserError, ErrorCode, GameBaseError } from "@/lib/errors";

describe("Atlas Studio - Logging & Domain Error Architecture", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
    LoggerManager.getInstance().ringBuffer.clear();
  });

  it("verifies AtlasSlicingEngine logs execution telemetry to RingBuffer", () => {
    const ringBuffer = LoggerManager.getInstance().ringBuffer;
    const initialCount = ringBuffer.getLogs().length;

    const mockMeta = {
      atlas: {
        columns: 4,
        rows: 2,
        cellWidth: 64,
        cellHeight: 64,
      },
      slicing: {
        method: "by_count" as const,
        grid: { columns: 4, rows: 2 },
      },
    };

    const frames = defaultAtlasSlicingEngine.resolveFrames(mockMeta, 256, 128);
    expect(frames.length).toBe(8);

    const logs = ringBuffer.getLogs();
    expect(logs.length).toBeGreaterThan(initialCount);

    const slicingLog = logs.find((l) => l.category === "AtlasSlicing");
    expect(slicingLog).toBeDefined();
    expect(slicingLog?.message).toContain("Resolved 8 frames via strategy 'by_count'");
    expect(slicingLog?.context?.framesCount).toBe(8);
    expect(slicingLog?.context?.method).toBe("by_count");
  });

  it("verifies AutoIslandSlicingStrategy logs warning when pixel buffer is absent", () => {
    const ringBuffer = LoggerManager.getInstance().ringBuffer;
    const strategy = new AutoIslandSlicingStrategy();

    const result = strategy.slice({
      textureWidth: 100,
      textureHeight: 100,
      pixelBuffer: undefined,
    });

    expect(result.length).toBe(0);

    const warnLog = ringBuffer.getLogs().find((l) => l.level === LogLevel.WARN && l.category === "AtlasSlicing");
    expect(warnLog).toBeDefined();
    expect(warnLog?.message).toContain("requires a valid pixel buffer");
  });

  it("verifies ParserError conforms to DomainError & GameBaseError contracts", () => {
    const error = new ParserError("Invalid meta JSON document", ErrorCode.PARSER_INVALID_FORMAT, {
      details: { fileName: "bad_meta.json", line: 42 },
    });

    expect(error).toBeInstanceOf(GameBaseError);
    expect(error.domain).toBe("PARSER");
    expect(error.code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
    expect(error.severity).toBe("ERROR");
    expect(error.details?.fileName).toBe("bad_meta.json");
    expect(error.toLogContext().code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
  });

  it("verifies AssetError conforms to DomainError & GameBaseError contracts", () => {
    const error = new AssetError("Failed to load atlas texture", ErrorCode.ASSET_LOAD_FAILED, {
      details: { imageSrc: "assets/missing.png" },
    });

    expect(error).toBeInstanceOf(GameBaseError);
    expect(error.domain).toBe("ASSET");
    expect(error.code).toBe(ErrorCode.ASSET_LOAD_FAILED);
    expect(error.severity).toBe("ERROR");
    expect(error.details?.imageSrc).toBe("assets/missing.png");
  });

  it("verifies AtlasStudio logger records events with correct category", () => {
    const studioLogger = LoggerManager.getInstance().getLogger("AtlasStudio");
    studioLogger.info("Preset loaded: valen", { presetId: "valen", category: "characters" });

    const logs = LoggerManager.getInstance().ringBuffer.getLogs();
    const studioLog = logs.find((l) => l.category === "AtlasStudio");
    expect(studioLog).toBeDefined();
    expect(studioLog?.message).toBe("Preset loaded: valen");
    expect(studioLog?.context?.presetId).toBe("valen");
  });
});
