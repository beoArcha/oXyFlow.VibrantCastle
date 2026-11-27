/**
 * Vibrant Castle — E2E Distribution Package Smoke Tests
 * Validates the physical structure, asset integrity, and GitHub Pages configuration of dist/.
 */

import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "../../..");
const DIST_DIR = join(ROOT_DIR, "dist");

describe("E2E Distribution Package Smoke Tests", () => {
  it("verifies distribution root directory exists", () => {
    expect(existsSync(DIST_DIR)).toBe(true);
    expect(statSync(DIST_DIR).isDirectory()).toBe(true);
  });

  it("verifies .nojekyll marker exists for GitHub Pages", () => {
    const noJekyllPath = join(DIST_DIR, ".nojekyll");
    expect(existsSync(noJekyllPath)).toBe(true);
  });

  it("verifies wiki landing page (dist/index.html) is well-formed", () => {
    const indexPath = join(DIST_DIR, "index.html");
    expect(existsSync(indexPath)).toBe(true);

    const htmlContent = readFileSync(indexPath, "utf8");
    expect(htmlContent.toLowerCase()).toContain("<!doctype html>");
    expect(htmlContent).toContain("Vibrant Castle");
    expect(htmlContent).toContain("styles/wiki.css");
    expect(htmlContent).toContain("scripts/wiki-app.js");
    expect(htmlContent).toContain('id="game-viewport"');
    expect(htmlContent).toContain('id="viewport-splash"');
    expect(htmlContent).toContain('<link rel="icon"');
    expect(htmlContent).toContain('allow="fullscreen"');
    expect(htmlContent).not.toContain('allow="fullscreen; autoplay"');
    expect(htmlContent).toContain('href="./game/"');
    expect(htmlContent).toContain("docs/README.md");
  });

  it("verifies wiki styles and scripts are properly assembled", () => {
    const cssPath = join(DIST_DIR, "styles", "wiki.css");
    const jsPath = join(DIST_DIR, "scripts", "wiki-app.js");

    expect(existsSync(cssPath)).toBe(true);
    expect(existsSync(jsPath)).toBe(true);
    expect(statSync(cssPath).size).toBeGreaterThan(50);
    expect(statSync(jsPath).size).toBeGreaterThan(500);
  });

  it("verifies i18n dictionaries are deployed", () => {
    const plJsonPath = join(DIST_DIR, "i18n", "pl.json");
    const enJsonPath = join(DIST_DIR, "i18n", "en.json");

    expect(existsSync(plJsonPath)).toBe(true);
    expect(existsSync(enJsonPath)).toBe(true);

    const plData = JSON.parse(readFileSync(plJsonPath, "utf8"));
    const enData = JSON.parse(readFileSync(enJsonPath, "utf8"));
    expect(plData.wikiNavGame).toBeDefined();
    expect(enData.wikiNavGame).toBeDefined();
  });

  it.each(["pl", "en"] as const)("verifies all 8 %s wiki articles are deployed", (lang) => {
    const articles = [
      "intro",
      "characters",
      "world",
      "bestiary",
      "controls",
      "graphics",
      "architecture",
      "news",
    ];
    expect(articles).toHaveLength(8);

    for (const name of articles) {
      const articlePath = join(DIST_DIR, lang, `${name}.md`);
      expect(existsSync(articlePath)).toBe(true);
      expect(statSync(articlePath).size).toBeGreaterThan(100);
      expect(readFileSync(articlePath, "utf8").startsWith("# ")).toBe(true);
    }
  });

  it("verifies game client is compiled in dist/game/ with production assets", () => {
    const gameIndexPath = join(DIST_DIR, "game", "index.html");
    const gameAssetsDir = join(DIST_DIR, "game", "assets");

    expect(existsSync(gameIndexPath)).toBe(true);
    expect(existsSync(gameAssetsDir)).toBe(true);
    expect(statSync(gameAssetsDir).isDirectory()).toBe(true);

    const gameHtml = readFileSync(gameIndexPath, "utf8");
    expect(gameHtml).toContain("<div id=\"root\">");
    expect(gameHtml).toContain('<link rel="icon"');
    expect(gameHtml).toMatch(/src="\.\/assets\/index-[a-zA-Z0-9_\-]+\.js"/);
    expect(gameHtml).toMatch(/href="\.\/assets\/index-[a-zA-Z0-9_\-]+\.css"/);
    expect(gameHtml).not.toContain("/vibrant_castle/");
  });
});
