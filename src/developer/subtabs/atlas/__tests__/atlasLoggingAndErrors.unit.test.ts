import { beforeEach, describe, expect, it } from "bun:test";
import { defaultAtlasSlicingEngine } from "@/game/engine/meta/slicing/AtlasSlicingEngine";
import { AutoIslandSlicingStrategy } from "@/game/engine/meta/slicing/AutoIslandSlicingStrategy";
import { AssetError, ErrorCode, GameBaseError, ParserError } from "@/lib/errors";
import { LoggerManager, LogLevel } from "@/lib/logger";

describe("Atlas slicing telemetry and domain errors", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({ mode: "development", defaultLevel: LogLevel.DEBUG });
    LoggerManager.getInstance().ringBuffer.clear();
  });

  it("should record frame resolution telemetry when the slicing engine resolves frames", () => {
    // Arrange
    const ringBuffer = LoggerManager.getInstance().ringBuffer;
    const meta = {
      atlas: { columns: 4, rows: 2, cellWidth: 64, cellHeight: 64 },
      slicing: { method: "by_count" as const, grid: { columns: 4, rows: 2 } },
    };

    // Act
    const frames = defaultAtlasSlicingEngine.resolveFrames(meta, 256, 128);

    // Assert
    expect(frames).toHaveLength(8);
    const slicingLog = ringBuffer.getLogs().find((log) => log.category === "AtlasSlicing");
    expect(slicingLog?.message).toContain("Resolved 8 frames via strategy 'by_count'");
    expect(slicingLog?.context?.framesCount).toBe(8);
    expect(slicingLog?.context?.method).toBe("by_count");
  });

  it("should log a warning when island slicing receives no pixel buffer", () => {
    // Arrange
    const ringBuffer = LoggerManager.getInstance().ringBuffer;
    const strategy = new AutoIslandSlicingStrategy();

    // Act
    const frames = strategy.slice({ textureWidth: 100, textureHeight: 100, pixelBuffer: undefined });

    // Assert
    expect(frames).toHaveLength(0);
    const warning = ringBuffer.getLogs().find((log) => log.level === LogLevel.WARN && log.category === "AtlasSlicing");
    expect(warning?.message).toContain("requires a valid pixel buffer");
  });

  it("should preserve parser details when constructing a parser domain error", () => {
    // Arrange
    const details = { details: { fileName: "bad_meta.json", line: 42 } };

    // Act
    const error = new ParserError("Invalid meta JSON document", ErrorCode.PARSER_INVALID_FORMAT, details);

    // Assert
    expect(error).toBeInstanceOf(GameBaseError);
    expect(error.domain).toBe("PARSER");
    expect(error.code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
    expect(error.severity).toBe("ERROR");
    expect(error.details?.fileName).toBe("bad_meta.json");
    expect(error.toLogContext().code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
  });

  it("should preserve asset details when constructing an asset domain error", () => {
    // Arrange
    const details = { details: { imageSrc: "assets/missing.png" } };

    // Act
    const error = new AssetError("Failed to load atlas texture", ErrorCode.ASSET_LOAD_FAILED, details);

    // Assert
    expect(error).toBeInstanceOf(GameBaseError);
    expect(error.domain).toBe("ASSET");
    expect(error.code).toBe(ErrorCode.ASSET_LOAD_FAILED);
    expect(error.severity).toBe("ERROR");
    expect(error.details?.imageSrc).toBe("assets/missing.png");
  });

  it("should categorize preset events when the atlas studio logger records them", () => {
    // Arrange
    const logger = LoggerManager.getInstance().getLogger("AtlasStudio");

    // Act
    logger.info("Preset loaded: valen", { presetId: "valen", category: "characters" });

    // Assert
    const studioLog = LoggerManager.getInstance().ringBuffer.getLogs().find((log) => log.category === "AtlasStudio");
    expect(studioLog?.message).toBe("Preset loaded: valen");
    expect(studioLog?.context?.presetId).toBe("valen");
  });
});
