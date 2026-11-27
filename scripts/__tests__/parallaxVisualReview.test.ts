import { describe, expect, it } from "bun:test";
import {
  REVIEW_POSITIONS,
  REVIEW_VIEWPORTS,
  buildGalleryGrid,
  escapeHtml,
  renderGalleryHtml,
  reviewClipPath,
  reviewShotPath,
} from "../review/reviewGallery";
import { resolveChromiumExecutable } from "../review/reviewBrowser";

const MAPS = ["courtyard", "thorn_chasm"] as const;
const META = { commitSha: "abc1234", generatedAt: "2026-11-27T10:00:00.000Z" };

describe("parallax visual review gallery grid", () => {
  it("lays out one row per map and viewport x position columns", () => {
    // Arrange
    const expectedColumns = REVIEW_VIEWPORTS.length * REVIEW_POSITIONS.length;

    // Act
    const grid = buildGalleryGrid(MAPS);

    // Assert
    expect(grid.rows).toHaveLength(MAPS.length);
    expect(grid.columns).toHaveLength(expectedColumns);
    expect(grid.rows.every((row) => row.cells.length === expectedColumns)).toBe(true);
    expect(grid.columns[0].key).toBe("desktop-start");
    expect(grid.columns[expectedColumns - 1].key).toBe("tablet-goal");
  });

  it("points each cell at its screenshot and each row at its clip", () => {
    // Act
    const grid = buildGalleryGrid(["courtyard"]);
    const row = grid.rows[0];

    // Assert
    expect(row.clip).toBe(reviewClipPath("courtyard"));
    expect(row.cells[1].src).toBe(reviewShotPath("courtyard", "desktop", "middle"));
    expect(row.cells[1].column.viewport.id).toBe("desktop");
    expect(row.cells[1].column.position.id).toBe("middle");
  });

  it("keeps the map order given and yields an empty row set for no maps", () => {
    expect(buildGalleryGrid(["thorn_chasm", "courtyard"]).rows.map((r) => r.mapId)).toEqual([
      "thorn_chasm",
      "courtyard",
    ]);
    expect(buildGalleryGrid([]).rows).toEqual([]);
  });
});

describe("parallax visual review gallery HTML", () => {
  it("shows the commit SHA and generation date in the header", () => {
    // Act
    const html = renderGalleryHtml(buildGalleryGrid(MAPS), META);

    // Assert
    expect(html).toContain("<code>abc1234</code>");
    expect(html).toContain("2026-11-27T10:00:00.000Z");
  });

  it("links every map clip and every grid image", () => {
    // Act
    const html = renderGalleryHtml(buildGalleryGrid(MAPS), META);

    // Assert
    expect(html).toContain(`href="${reviewClipPath("courtyard")}"`);
    expect(html).toContain(`src="${reviewShotPath("thorn_chasm", "tablet", "goal")}"`);
    const imageCount = (html.match(/<img /g) ?? []).length;
    expect(imageCount).toBe(MAPS.length * REVIEW_VIEWPORTS.length * REVIEW_POSITIONS.length);
  });

  it("groups viewport headers over their three position columns", () => {
    // Act
    const html = renderGalleryHtml(buildGalleryGrid(MAPS), META);

    // Assert
    expect(html).toContain('<th colspan="3" scope="colgroup">Desktop 1920x1080</th>');
    expect(html).toContain('<th colspan="3" scope="colgroup">Tablet 1024x768 @2x</th>');
  });

  it("escapes markup in the meta values", () => {
    // Act
    const html = renderGalleryHtml(buildGalleryGrid([]), {
      commitSha: "<script>",
      generatedAt: `"x" & 'y'`,
    });

    // Assert
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;x&quot; &amp; &#39;y&#39;");
  });

  it("escapeHtml leaves plain text unchanged", () => {
    expect(escapeHtml("courtyard_01")).toBe("courtyard_01");
  });
});

describe("resolveChromiumExecutable", () => {
  const homeDir = "C:\\Users\\tester";

  it("prefers PLAYWRIGHT_CHROMIUM_PATH on any platform", () => {
    expect(
      resolveChromiumExecutable({
        env: { PLAYWRIGHT_CHROMIUM_PATH: "D:\\chrome.exe", LOCALAPPDATA: "X" },
        platform: "win32",
        homeDir,
      }),
    ).toBe("D:\\chrome.exe");
    expect(
      resolveChromiumExecutable({ env: { PLAYWRIGHT_CHROMIUM_PATH: "/opt/chrome" }, platform: "linux", homeDir }),
    ).toBe("/opt/chrome");
  });

  it("falls back to the ms-playwright cache under LOCALAPPDATA on Windows", () => {
    expect(
      resolveChromiumExecutable({ env: { LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local" }, platform: "win32", homeDir }),
    ).toBe("C:\\Users\\tester\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe");
  });

  it("derives the LOCALAPPDATA default from the home directory when unset", () => {
    expect(resolveChromiumExecutable({ env: {}, platform: "win32", homeDir })).toBe(
      "C:\\Users\\tester\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe",
    );
  });

  it("leaves the choice to Playwright outside Windows when no env path is set", () => {
    expect(resolveChromiumExecutable({ env: {}, platform: "linux", homeDir })).toBeUndefined();
  });
});
