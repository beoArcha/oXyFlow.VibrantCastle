import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { AutoIslandSlicingStrategy } from "@game/engine/meta/slicing";
import { ResolvedFrameRect } from "../types";
import { useAtlasAnimationTracks } from "../hooks/useAtlasAnimationTracks";
import { AtlasAnimationFilmstrip } from "../filmstrip/AtlasAnimationFilmstrip";
import {
  renderCustomHook,
  renderIntoDom,
  cleanupDom,
  setupDomEnvironment,
} from "@test-utils";

describe("AutoIslandSlicingStrategy - clusterIslandsIntoRows", () => {
  it("returns empty array when no islands are provided", () => {
    const clusters = AutoIslandSlicingStrategy.clusterIslandsIntoRows([]);
    expect(clusters).toEqual([]);
  });

  it("clusters detected islands into ordered rows and sorts by X within each row", () => {
    const mockIslands: ResolvedFrameRect[] = [
      // Row 1 (y around 100)
      { id: "isl_1", x: 200, y: 102, width: 32, height: 32 },
      { id: "isl_0", x: 10, y: 98, width: 32, height: 32 },
      // Row 0 (y around 10)
      { id: "isl_2", x: 150, y: 12, width: 32, height: 32 },
      { id: "isl_3", x: 20, y: 8, width: 32, height: 32 },
    ];

    const clusters = AutoIslandSlicingStrategy.clusterIslandsIntoRows(mockIslands, 0.5);

    expect(clusters.length).toBe(2);

    // Row 0 should be the top row (y ~ 10)
    expect(clusters[0].row).toBe(0);
    expect(clusters[0].trackName).toBe("row_0_anim");
    expect(clusters[0].frames.length).toBe(2);
    // Within row 0, sorted by X: x=20 first, x=150 second
    expect(clusters[0].frames[0].id).toBe("isl_3");
    expect(clusters[0].frames[0].frameIndex).toBe(0);
    expect(clusters[0].frames[1].id).toBe("isl_2");
    expect(clusters[0].frames[1].frameIndex).toBe(1);

    // Row 1 should be the bottom row (y ~ 100)
    expect(clusters[1].row).toBe(1);
    expect(clusters[1].trackName).toBe("row_1_anim");
    expect(clusters[1].frames.length).toBe(2);
    // Within row 1, sorted by X: x=10 first, x=200 second
    expect(clusters[1].frames[0].id).toBe("isl_0");
    expect(clusters[1].frames[0].frameIndex).toBe(0);
    expect(clusters[1].frames[1].id).toBe("isl_1");
    expect(clusters[1].frames[1].frameIndex).toBe(1);
  });
});

describe("useAtlasAnimationTracks - Sequence & Filmstrip Operations", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("toggles sequence frames by appending and removing on re-click", async () => {
    const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

    // Setup an initial track
    await React.act(async () => {
      result.current.setTracks([
        {
          name: "idle",
          type: "grid",
          row: 0,
          frames: 4,
          fps: 8,
          loop: true,
        },
      ]);
      result.current.setSelectedTrackName("idle");
    });

    // Append frame column 5 to sequence
    await React.act(async () => {
      result.current.handleToggleSequenceFrame({ col: 5, row: 0 });
    });

    let currentTrack = result.current.tracks.find((tr) => tr.name === "idle");
    expect(currentTrack?.type).toBe("indexed");
    // Initially had [0, 1, 2, 3], now [0, 1, 2, 3, 5]
    expect(currentTrack?.frameIndices).toEqual([0, 1, 2, 3, 5]);
    expect(currentTrack?.frames).toBe(5);

    // Click column 5 again -> should remove it
    await React.act(async () => {
      result.current.handleToggleSequenceFrame({ col: 5, row: 0 });
    });

    currentTrack = result.current.tracks.find((tr) => tr.name === "idle");
    expect(currentTrack?.frameIndices).toEqual([0, 1, 2, 3]);
  });

  it("reorders frames inside active track sequence", async () => {
    const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

    await React.act(async () => {
      result.current.setTracks([
        {
          name: "walk",
          type: "indexed",
          row: 1,
          frames: 4,
          fps: 8,
          loop: true,
          frameIndices: [10, 20, 30, 40],
        },
      ]);
      result.current.setSelectedTrackName("walk");
    });

    // Move index 0 (val: 10) to index 2
    await React.act(async () => {
      result.current.handleReorderTrackFrames(0, 2);
    });

    const track = result.current.tracks.find((tr) => tr.name === "walk");
    expect(track?.frameIndices).toEqual([20, 30, 10, 40]);
  });

  it("removes a frame from the sequence", async () => {
    const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

    await React.act(async () => {
      result.current.setTracks([
        {
          name: "attack",
          type: "indexed",
          row: 2,
          frames: 3,
          fps: 10,
          loop: false,
          frameIndices: [1, 2, 3],
        },
      ]);
      result.current.setSelectedTrackName("attack");
    });

    await React.act(async () => {
      result.current.handleRemoveTrackFrame(1);
    });

    const track = result.current.tracks.find((tr) => tr.name === "attack");
    expect(track?.frameIndices).toEqual([1, 3]);
    expect(track?.frames).toBe(2);
  });

  it("duplicates a frame in the sequence", async () => {
    const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

    await React.act(async () => {
      result.current.setTracks([
        {
          name: "jump",
          type: "indexed",
          row: 0,
          frames: 2,
          fps: 8,
          loop: true,
          frameIndices: [5, 6],
        },
      ]);
      result.current.setSelectedTrackName("jump");
    });

    await React.act(async () => {
      result.current.handleDuplicateTrackFrame(0);
    });

    const track = result.current.tracks.find((tr) => tr.name === "jump");
    expect(track?.frameIndices).toEqual([5, 5, 6]);
    expect(track?.frames).toBe(3);
  });

  it("reverses and ping-pongs active track frames", async () => {
    const { result } = await renderCustomHook(() => useAtlasAnimationTracks());

    await React.act(async () => {
      result.current.setTracks([
        {
          name: "run",
          type: "indexed",
          row: 0,
          frames: 4,
          fps: 8,
          loop: true,
          frameIndices: [0, 1, 2, 3],
        },
      ]);
      result.current.setSelectedTrackName("run");
    });

    // Reverse
    await React.act(async () => {
      result.current.handleReverseTrack();
    });

    let track = result.current.tracks.find((tr) => tr.name === "run");
    expect(track?.frameIndices).toEqual([3, 2, 1, 0]);

    // Reverse back to normal
    await React.act(async () => {
      result.current.handleReverseTrack();
    });

    // Ping-Pong: [0, 1, 2, 3] -> [0, 1, 2, 3, 2, 1]
    await React.act(async () => {
      result.current.handlePingPongTrack();
    });

    track = result.current.tracks.find((tr) => tr.name === "run");
    expect(track?.pingPong).toBe(true);
    expect(track?.frameIndices).toEqual([0, 1, 2, 3, 2, 1]);
    expect(track?.frames).toBe(6);
  });
});

describe("AtlasAnimationFilmstrip Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const dummyGrid = {
    columns: 8,
    rows: 4,
    cellWidth: 32,
    cellHeight: 32,
    spacing: 0,
    safeMargin: 0,
  };

  const dummyTracks = [
    {
      name: "walk",
      row: 0,
      frames: 3,
      fps: 8,
      loop: true,
      frameIndices: [0, 1, 2],
    },
  ];

  it("renders track information and action buttons", async () => {
    let reversed = false;
    let pingPonged = false;

    const { container } = await renderIntoDom(
      <AtlasAnimationFilmstrip
        imageSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        tracks={dummyTracks}
        selectedTrackName="walk"
        selectedFrameIndex={0}
        gridConfig={dummyGrid}
        onSelectFrame={() => {}}
        onReorderFrames={() => {}}
        onRemoveFrame={() => {}}
        onDuplicateFrame={() => {}}
        onReverseTrack={() => {
          reversed = true;
        }}
        onPingPongTrack={() => {
          pingPonged = true;
        }}
        onClearTrackFrames={() => {}}
      />
    );

    // Track name badge
    expect(container.textContent).toContain("walk");
    expect(container.textContent).toContain("3");

    // Frame sequence badges #1, #2, #3
    expect(container.textContent).toContain("#1");
    expect(container.textContent).toContain("#2");
    expect(container.textContent).toContain("#3");

    // Trigger buttons
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);

    // Find and click reverse button
    const reverseBtn = Array.from(buttons).find(
      (b) => b.getAttribute("title")?.toLowerCase().includes("odwróć") || b.textContent?.includes("Odwróć")
    );
    if (reverseBtn) {
      await React.act(async () => {
        reverseBtn.click();
      });
      expect(reversed).toBe(true);
    }
  });
});
