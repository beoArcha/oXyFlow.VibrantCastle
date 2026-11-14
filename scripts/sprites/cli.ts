import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileHeroSprite } from "./compileHero";
import { compileEnemySprite, type CompiledSprite } from "./compileSprite";
import type { HeroSpriteDefinition } from "./heroTypes";
import { spriteError } from "./errors";
import { renderPreviewPng } from "./previewPng";
import type { EnemySpriteDefinition } from "./types";

const SPRITES_DIR = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = resolve(SPRITES_DIR, "..", "..", "src", "assets");
export const ENEMIES_DIR = join(SPRITES_DIR, "enemies");
export const HEROES_DIR = join(SPRITES_DIR, "heroes");
export const DEFAULT_OUT_DIR = join(ASSETS_DIR, "enemies");
export const DEFAULT_HERO_OUT_DIR = join(ASSETS_DIR, "characters");

export type SpriteDefinition = EnemySpriteDefinition | HeroSpriteDefinition;

/** Where sprite scripts live and where their output goes; tests point these at temporary folders. */
export interface SpriteDirs {
  enemies: string;
  heroes: string;
  enemyOut: string;
  /** Default hero output; also the folder whose `<id>/<id>_packed_meta.json` files supply the hero grids. */
  heroOut: string;
}

export const DEFAULT_DIRS: SpriteDirs = {
  enemies: ENEMIES_DIR,
  heroes: HEROES_DIR,
  enemyOut: DEFAULT_OUT_DIR,
  heroOut: DEFAULT_HERO_OUT_DIR,
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

const isScriptPath = (idOrPath: string): boolean =>
  idOrPath.endsWith(".ts") || idOrPath.includes("/") || idOrPath.includes("\\");

export function isEnemyDefinition(def: SpriteDefinition): def is EnemySpriteDefinition {
  return "animations" in def;
}

async function importDefault(file: string): Promise<SpriteDefinition> {
  if (!existsSync(file)) throw spriteError(`Sprite script not found: ${file}`, { file });
  const module = (await import(pathToFileURL(file).href)) as { default?: SpriteDefinition };
  if (!module.default) {
    throw spriteError(`${file} must export default defineEnemySprite({...}) or defineHeroSprite({...}).`, { file });
  }
  return module.default;
}

/** Accepts an enemy id or a path to a script (used for fixtures). */
export async function loadDefinition(idOrPath: string, dir: string = ENEMIES_DIR): Promise<EnemySpriteDefinition> {
  const file = isScriptPath(idOrPath) ? resolve(idOrPath) : join(dir, `${idOrPath}.ts`);
  return (await importDefault(file)) as EnemySpriteDefinition;
}

/** Resolves an id against the enemy folder first, then the hero folder; paths are imported as given. */
export async function loadSprite(idOrPath: string, dirs: SpriteDirs = DEFAULT_DIRS): Promise<SpriteDefinition> {
  if (isScriptPath(idOrPath)) return importDefault(resolve(idOrPath));
  const candidates = [join(dirs.enemies, `${idOrPath}.ts`), join(dirs.heroes, `${idOrPath}.ts`)];
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) throw spriteError(`Sprite script not found for "${idOrPath}"; looked in ${candidates.join(" and ")}.`, { id: idOrPath });
  return importDefault(file);
}

export function compileSprite(def: SpriteDefinition, dirs: SpriteDirs = DEFAULT_DIRS): CompiledSprite {
  return isEnemyDefinition(def) ? compileEnemySprite(def) : compileHeroSprite(def, dirs.heroOut);
}

export interface OutputFile {
  path: string;
  content: string | Uint8Array;
}

export function outputFiles(def: SpriteDefinition, compiled: CompiledSprite, outDir: string): OutputFile[] {
  const base = join(outDir, def.id);
  const metaName = isEnemyDefinition(def) ? `${def.id}_meta.json` : `${def.id}_pixel_meta.json`;
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
  return [...sheets, { path: join(base, metaName), content: compiled.metaJson }];
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

function writePreviews(def: SpriteDefinition, compiled: CompiledSprite, dir: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${def.id}_hi8bit.png`), renderPreviewPng(compiled.sheets.hi8bit));
  writeFileSync(join(dir, `${def.id}_hi16bit.png`), renderPreviewPng(compiled.sheets.hi16bit));
}

function resolveOutDir(def: SpriteDefinition, options: CliOptions, dirs: SpriteDirs): string {
  if (options.outDir) return options.outDir;
  return isEnemyDefinition(def) ? dirs.enemyOut : dirs.heroOut;
}

/** Compiles the requested sprites; returns the process exit code. */
export async function run(
  argv: string[],
  log: (line: string) => void = console.log,
  dirs: SpriteDirs = DEFAULT_DIRS,
): Promise<number> {
  const options = parseArgs(argv);
  const targets = options.all ? [...listEnemyIds(dirs.enemies), ...listHeroIds(dirs.heroes)] : options.ids;
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
