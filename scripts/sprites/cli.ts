import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileEnemySprite, type CompiledSprite } from "./compileSprite";
import { spriteError } from "./errors";
import { renderPreviewPng } from "./previewPng";
import type { EnemySpriteDefinition } from "./types";

const SPRITES_DIR = dirname(fileURLToPath(import.meta.url));
export const ENEMIES_DIR = join(SPRITES_DIR, "enemies");
export const DEFAULT_OUT_DIR = resolve(SPRITES_DIR, "..", "..", "src", "assets", "enemies");

export interface CliOptions {
  ids: string[];
  all: boolean;
  check: boolean;
  outDir: string;
  previewDir: string | null;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ids: [], all: false, check: false, outDir: DEFAULT_OUT_DIR, previewDir: null };
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

export function listEnemyIds(dir: string = ENEMIES_DIR): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => basename(file, ".ts"))
    .sort();
}

/** Accepts an enemy id or a path to a script (used for fixtures). */
export async function loadDefinition(idOrPath: string, dir: string = ENEMIES_DIR): Promise<EnemySpriteDefinition> {
  const isPath = idOrPath.endsWith(".ts") || idOrPath.includes("/") || idOrPath.includes("\\");
  const file = isPath ? resolve(idOrPath) : join(dir, `${idOrPath}.ts`);
  if (!existsSync(file)) throw spriteError(`Sprite script not found: ${file}`, { file });
  const module = (await import(pathToFileURL(file).href)) as { default?: EnemySpriteDefinition };
  if (!module.default) throw spriteError(`${file} must export default defineEnemySprite({...}).`, { file });
  return module.default;
}

export interface OutputFile {
  path: string;
  content: string;
}

export function outputFiles(def: EnemySpriteDefinition, compiled: CompiledSprite, outDir: string): OutputFile[] {
  const base = join(outDir, def.id);
  return [
    { path: join(base, `${def.id}_hi8bit.svg`), content: compiled.hi8bitSvg },
    { path: join(base, `${def.id}_hi16bit.svg`), content: compiled.hi16bitSvg },
    { path: join(base, `${def.id}_meta.json`), content: compiled.metaJson },
  ];
}

const normalizeNewlines = (text: string): string => text.replace(/\r\n/g, "\n");

/** Returns a description of every output file that is missing or differs from the compiled content. */
export function findStaleFiles(files: OutputFile[]): string[] {
  return files.flatMap(({ path, content }) => {
    if (!existsSync(path)) return [`missing: ${path}`];
    return normalizeNewlines(readFileSync(path, "utf8")) === content ? [] : [`out of date: ${path}`];
  });
}

export function writeFiles(files: OutputFile[]): void {
  for (const { path, content } of files) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

function writePreviews(def: EnemySpriteDefinition, compiled: CompiledSprite, dir: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${def.id}_hi8bit.png`), renderPreviewPng(compiled.sheets.hi8bit));
  writeFileSync(join(dir, `${def.id}_hi16bit.png`), renderPreviewPng(compiled.sheets.hi16bit));
}

/** Compiles the requested sprites; returns the process exit code. */
export async function run(argv: string[], log: (line: string) => void = console.log): Promise<number> {
  const options = parseArgs(argv);
  const targets = options.all ? listEnemyIds() : options.ids;
  let stale = 0;
  for (const target of targets) {
    const def = await loadDefinition(target);
    const compiled = compileEnemySprite(def);
    compiled.warnings.forEach((warning) => log(`warning: ${def.id}: ${warning}`));
    const files = outputFiles(def, compiled, options.outDir);
    if (options.check) {
      const problems = findStaleFiles(files);
      problems.forEach((problem) => log(`${def.id} ${problem}`));
      stale += problems.length;
    } else {
      writeFiles(files);
      log(`compiled ${def.id} -> ${join(options.outDir, def.id)}`);
    }
    if (options.previewDir) writePreviews(def, compiled, options.previewDir);
  }
  if (options.check && stale > 0) log("Run `bun scripts/sprites/compile.ts --all` and commit the result.");
  return stale > 0 ? 1 : 0;
}
