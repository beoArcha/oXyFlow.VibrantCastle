import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileHeroSprite } from "./compileHero";
import { compileEnemySprite, type CompiledSprite } from "./compileSprite";
import { compileProp, type CompiledProp } from "./compileProp";
import { compileTileset, type CompiledTileset } from "./compileTileset";
import type { HeroSpriteDefinition } from "./heroTypes";
import { spriteError } from "./errors";
import { renderPreviewPng } from "./previewPng";
import { renderPropStrip } from "./propPreview";
import type { PropSpriteDefinition } from "./propTypes";
import type { SheetImage } from "./render";
import { renderTilingDemo } from "./tilingDemo";
import type { TilesetSpriteDefinition } from "./tilesetTypes";
import type { EnemySpriteDefinition } from "./types";

const SPRITES_DIR = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = resolve(SPRITES_DIR, "..", "..", "src", "assets");
export const ENEMIES_DIR = join(SPRITES_DIR, "enemies");
export const HEROES_DIR = join(SPRITES_DIR, "heroes");
export const TILESETS_DIR = join(SPRITES_DIR, "tilesets");
export const PROPS_DIR = join(SPRITES_DIR, "props");
export const DEFAULT_OUT_DIR = join(ASSETS_DIR, "enemies");
export const DEFAULT_HERO_OUT_DIR = join(ASSETS_DIR, "characters");
export const DEFAULT_TILE_OUT_DIR = join(ASSETS_DIR, "tiles");
export const DEFAULT_PROP_OUT_DIR = join(ASSETS_DIR, "props");

/** Zoom of the `_x4` sheet previews for tilesets and props. */
const ZOOM_PREVIEW_SCALE = 4;

export type SpriteDefinition = EnemySpriteDefinition | HeroSpriteDefinition | TilesetSpriteDefinition | PropSpriteDefinition;

/** Where sprite scripts live and where their output goes; tests point these at temporary folders. */
export interface SpriteDirs {
  enemies: string;
  heroes: string;
  tilesets: string;
  props: string;
  enemyOut: string;
  /** Default hero output; also the folder whose `<id>/<id>_packed_meta.json` files supply the hero grids. */
  heroOut: string;
  /** Default tileset output; each tileset is written to `<tileOut>/<id>/`. */
  tileOut: string;
  /** Default prop output; each prop is written to `<propOut>/<id>/`. */
  propOut: string;
}

export const DEFAULT_DIRS: SpriteDirs = {
  enemies: ENEMIES_DIR,
  heroes: HEROES_DIR,
  tilesets: TILESETS_DIR,
  props: PROPS_DIR,
  enemyOut: DEFAULT_OUT_DIR,
  heroOut: DEFAULT_HERO_OUT_DIR,
  tileOut: DEFAULT_TILE_OUT_DIR,
  propOut: DEFAULT_PROP_OUT_DIR,
};

export interface CliOptions {
  ids: string[];
  all: boolean;
  check: boolean;
  /** Output root for every sprite kind; null selects the default folder of each kind. */
  outDir: string | null;
  previewDir: string | null;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ids: [], all: false, check: false, outDir: null, previewDir: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--all") options.all = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--out") options.outDir = resolve(argv[++i] ?? "");
    else if (arg === "--preview") options.previewDir = resolve(argv[++i] ?? "");
    else if (arg.startsWith("--")) throw spriteError(`Unknown option ${arg}.`, { arg });
    else options.ids.push(arg);
  }
  if (!options.all && options.ids.length === 0) {
    throw spriteError("Usage: bun scripts/sprites/compile.ts <id> [<id>...] | --all [--check] [--out <dir>] [--preview <dir>]");
  }
  return options;
}

function listScriptIds(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => basename(file, ".ts"))
    .sort();
}

export const listEnemyIds = (dir: string = ENEMIES_DIR): string[] => listScriptIds(dir);
export const listHeroIds = (dir: string = HEROES_DIR): string[] => listScriptIds(dir);
export const listTilesetIds = (dir: string = TILESETS_DIR): string[] => listScriptIds(dir);
export const listPropIds = (dir: string = PROPS_DIR): string[] => listScriptIds(dir);

const isScriptPath = (idOrPath: string): boolean =>
  idOrPath.endsWith(".ts") || idOrPath.includes("/") || idOrPath.includes("\\");

export function isEnemyDefinition(def: SpriteDefinition): def is EnemySpriteDefinition {
  return "animations" in def;
}

export function isTilesetDefinition(def: SpriteDefinition): def is TilesetSpriteDefinition {
  return "tiles" in def;
}

export function isPropDefinition(def: SpriteDefinition): def is PropSpriteDefinition {
  return "anchor" in def;
}

async function importDefault(file: string): Promise<SpriteDefinition> {
  if (!existsSync(file)) throw spriteError(`Sprite script not found: ${file}`, { file });
  const module = (await import(pathToFileURL(file).href)) as { default?: SpriteDefinition };
  if (!module.default) {
    throw spriteError(
      `${file} must export default defineEnemySprite({...}), defineHeroSprite({...}), defineTileset({...}) or defineProp({...}).`,
      { file },
    );
  }
  return module.default;
}

/** Accepts an enemy id or a path to a script (used for fixtures). */
export async function loadDefinition(idOrPath: string, dir: string = ENEMIES_DIR): Promise<EnemySpriteDefinition> {
  const file = isScriptPath(idOrPath) ? resolve(idOrPath) : join(dir, `${idOrPath}.ts`);
  return (await importDefault(file)) as EnemySpriteDefinition;
}

/** Resolves an id against the enemy, hero, tileset and prop folders; paths are imported as given. */
export async function loadSprite(idOrPath: string, dirs: SpriteDirs = DEFAULT_DIRS): Promise<SpriteDefinition> {
  if (isScriptPath(idOrPath)) return importDefault(resolve(idOrPath));
  const candidates = [dirs.enemies, dirs.heroes, dirs.tilesets, dirs.props].map((dir) => join(dir, `${idOrPath}.ts`));
  const found = candidates.filter((candidate) => existsSync(candidate));
  if (found.length === 0) {
    throw spriteError(`Sprite script not found for "${idOrPath}"; looked in ${candidates.join(" and ")}.`, { id: idOrPath });
  }
  if (found.length > 1) {
    throw spriteError(`Sprite id "${idOrPath}" is ambiguous; it exists in ${found.join(" and ")}.`, { id: idOrPath });
  }
  return importDefault(found[0]);
}

export type CompiledAny = CompiledSprite | CompiledTileset | CompiledProp;

export function compileSprite(def: SpriteDefinition, dirs: SpriteDirs = DEFAULT_DIRS): CompiledAny {
  if (isEnemyDefinition(def)) return compileEnemySprite(def);
  if (isTilesetDefinition(def)) return compileTileset(def);
  if (isPropDefinition(def)) return compileProp(def);
  return compileHeroSprite(def, dirs.heroOut);
}

export interface OutputFile {
  path: string;
  content: string | Uint8Array;
}

function metaFileName(def: SpriteDefinition): string {
  if (isEnemyDefinition(def)) return `${def.id}_meta.json`;
  if (isTilesetDefinition(def)) return `${def.id}_tiles_meta.json`;
  return isPropDefinition(def) ? `${def.id}_prop_meta.json` : `${def.id}_pixel_meta.json`;
}

export function outputFiles(def: SpriteDefinition, compiled: CompiledAny, outDir: string): OutputFile[] {
  const base = join(outDir, def.id);
  const sheets: OutputFile[] =
    "hi8bitPng" in compiled
      ? [
          { path: join(base, `${def.id}_hi8bit.png`), content: compiled.hi8bitPng },
          { path: join(base, `${def.id}_hi16bit.png`), content: compiled.hi16bitPng },
        ]
      : [
          { path: join(base, `${def.id}_hi8bit.svg`), content: compiled.hi8bitSvg },
          { path: join(base, `${def.id}_hi16bit.svg`), content: compiled.hi16bitSvg },
        ];
  return [...sheets, { path: join(base, metaFileName(def)), content: compiled.metaJson }];
}

const normalizeNewlines = (text: string): string => text.replace(/\r\n/g, "\n");

/** Returns a description of every output file that is missing or differs from the compiled content. */
export function findStaleFiles(files: OutputFile[]): string[] {
  return files.flatMap(({ path, content }) => {
    if (!existsSync(path)) return [`missing: ${path}`];
    const upToDate =
      typeof content === "string"
        ? normalizeNewlines(readFileSync(path, "utf8")) === content
        : Buffer.compare(readFileSync(path), content) === 0;
    return upToDate ? [] : [`out of date: ${path}`];
  });
}

export function writeFiles(files: OutputFile[]): void {
  for (const { path, content } of files) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

function writeSheetPreviews(def: SpriteDefinition, sheets: { hi8bit: SheetImage; hi16bit: SheetImage }, dir: string): void {
  if (isPropDefinition(def)) {
    writeFileSync(join(dir, `${def.id}_hi8bit_x4.png`), renderPreviewPng(sheets.hi8bit, ZOOM_PREVIEW_SCALE));
    writeFileSync(join(dir, `${def.id}_hi16bit_x4.png`), renderPreviewPng(sheets.hi16bit, ZOOM_PREVIEW_SCALE));
    writeFileSync(join(dir, `${def.id}_strip.png`), renderPropStrip(def, sheets));
    return;
  }
  if (!isTilesetDefinition(def)) {
    writeFileSync(join(dir, `${def.id}_hi8bit.png`), renderPreviewPng(sheets.hi8bit));
    writeFileSync(join(dir, `${def.id}_hi16bit.png`), renderPreviewPng(sheets.hi16bit));
    return;
  }
  writeFileSync(join(dir, `${def.id}_hi8bit_x4.png`), renderPreviewPng(sheets.hi8bit, ZOOM_PREVIEW_SCALE));
  writeFileSync(join(dir, `${def.id}_hi16bit_x4.png`), renderPreviewPng(sheets.hi16bit, ZOOM_PREVIEW_SCALE));
  writeFileSync(join(dir, `${def.id}_tiling_demo.png`), renderTilingDemo(def, sheets));
}

function writePreviews(def: SpriteDefinition, compiled: CompiledAny, dir: string): void {
  mkdirSync(dir, { recursive: true });
  writeSheetPreviews(def, compiled.sheets, dir);
}

function resolveOutDir(def: SpriteDefinition, options: CliOptions, dirs: SpriteDirs): string {
  if (options.outDir) return options.outDir;
  if (isTilesetDefinition(def)) return dirs.tileOut;
  if (isPropDefinition(def)) return dirs.propOut;
  return isEnemyDefinition(def) ? dirs.enemyOut : dirs.heroOut;
}

/** Compiles the requested sprites; returns the process exit code. */
export async function run(
  argv: string[],
  log: (line: string) => void = console.log,
  dirs: SpriteDirs = DEFAULT_DIRS,
): Promise<number> {
  const options = parseArgs(argv);
  const targets = options.all
    ? [
        ...listEnemyIds(dirs.enemies),
        ...listHeroIds(dirs.heroes),
        ...listTilesetIds(dirs.tilesets),
        ...listPropIds(dirs.props),
      ]
    : options.ids;
  let stale = 0;
  for (const target of targets) {
    const def = await loadSprite(target, dirs);
    const compiled = compileSprite(def, dirs);
    compiled.warnings.forEach((warning) => log(`warning: ${def.id}: ${warning}`));
    const outDir = resolveOutDir(def, options, dirs);
    const files = outputFiles(def, compiled, outDir);
    if (options.check) {
      const problems = findStaleFiles(files);
      problems.forEach((problem) => log(`${def.id} ${problem}`));
      stale += problems.length;
    } else {
      writeFiles(files);
      log(`compiled ${def.id} -> ${join(outDir, def.id)}`);
    }
    if (options.previewDir) writePreviews(def, compiled, options.previewDir);
  }
  if (options.check && stale > 0) log("Run `bun scripts/sprites/compile.ts --all` and commit the result.");
  return stale > 0 ? 1 : 0;
}
