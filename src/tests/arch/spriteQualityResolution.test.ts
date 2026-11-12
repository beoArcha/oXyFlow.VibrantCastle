import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { LayerBoundaryViolationError } from "@lib/errors";
import { getAllSourceFiles, stripComments, ImportViolation } from "./helpers/archScanner";

const rootDir = process.cwd();
const srcDir = path.join(rootDir, "src");

const TIER_RESOLVER_FILES = new Set([
  "src/game/engine/sprites/spriteSourceFactory.ts",
  "src/game/engine/atlas/atlasVariantResolver.ts",
]);

const QUALITY_SETTER_FILES = new Set([
  "src/game/engine/sprites/spriteSourceFactory.ts",
  "src/game/engine/assetLoader.ts",
  "src/game/engine/atlas/atlasTextureManager.ts",
  "src/game/loop/engineSettingsController.ts",
]);

function relative(file: string): string {
  return path.relative(rootDir, file).replace(/\\/g, "/");
}

function productionFiles(dir: string): string[] {
  return getAllSourceFiles(dir).filter((file) => !file.includes("__tests__") && !file.includes(`${path.sep}tests${path.sep}`));
}

function scan(files: string[], pattern: RegExp, allowed: ReadonlySet<string> = new Set()): ImportViolation[] {
  const violations: ImportViolation[] = [];
  for (const file of files) {
    const rel = relative(file);
    if (allowed.has(rel)) continue;
    const lines = stripComments(fs.readFileSync(file, "utf-8")).split("\n");
    lines.forEach((line, index) => {
      if (pattern.test(line)) violations.push({ file: rel, lineNo: index + 1, line: line.trim() });
    });
  }
  return violations;
}

function assertNoViolations(violations: ImportViolation[], rule: string): void {
  if (violations.length === 0) {
    expect(violations).toEqual([]);
    return;
  }
  const details = violations.map((v) => `  ${v.file}:${v.lineNo} -> ${v.line}`).join("\n");
  throw new LayerBoundaryViolationError(`Architectural rule "${rule}" violated (${violations.length}):\n${details}`, violations);
}

describe("Sprite quality resolution is owned by SpriteSourceFactory", () => {
  const files = productionFiles(srcDir);

  it("forbids resolving the quality tier chain outside the factory and its resolver", () => {
    const violations = scan(files, /\bresolveVariantTier\b/, TIER_RESOLVER_FILES);

    assertNoViolations(violations, "only SpriteSourceFactory may walk the quality fallback chain");
  });

  it("forbids indexing character sprite maps by quality outside the factory", () => {
    const violations = scan(files, /\bspriteMaps\s*(\[|\.(low|mid|high)\b)/);

    assertNoViolations(violations, "character sprite maps are resolved through ISpriteSourceFactory.resolveCharacterSpriteMap");
  });

  it("forbids UI layers from changing the quality directly", () => {
    const uiFiles = ["game-menu", "hud", "developer", "ui", "components"].flatMap((dir) =>
      productionFiles(path.join(srcDir, dir))
    );

    const violations = scan(uiFiles, /\.setQuality\s*\(/);

    assertNoViolations(violations, "quality changes enter through engine settings, never from React");
  });

  it("forbids engine code from changing the quality outside the settings path", () => {
    const engineFiles = productionFiles(path.join(srcDir, "game"));

    const violations = scan(engineFiles, /\.setQuality\s*\(/, QUALITY_SETTER_FILES);

    assertNoViolations(violations, "only the settings controller and the sprite source subscribers touch quality");
  });

  it("forbids the renderer from carrying its own asset quality", () => {
    const rendererFiles = productionFiles(path.join(srcDir, "game", "renderer"));

    const violations = scan(rendererFiles, /\bassetQuality\b/);

    assertNoViolations(violations, "renderers read the quality from the injected factory, not a per-frame argument");
  });
});
