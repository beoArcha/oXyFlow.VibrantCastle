import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spriteError } from "../errors";
import { renderProp } from "../propRender";
import type { PropSpriteDefinition } from "../propTypes";
import { sheetToSvg } from "../svgWriter";
import { compileHi8bitSvg, type Hi8bitDefinition } from "./defineHi8bit";

const HI8BIT_DIR = dirname(fileURLToPath(import.meta.url));
const PROPS_DIR = resolve(HI8BIT_DIR, "..", "props");
const ASSETS_DIR = resolve(HI8BIT_DIR, "..", "..", "..", "src", "assets");

const PROP_SVG_IDS = new Set(["hanging_lantern"]);

function listIds(): string[] {
  const local = readdirSync(HI8BIT_DIR)
    .filter((f) => f.endsWith(".ts") && f !== "compile.ts" && f !== "defineHi8bit.ts")
    .map((f) => basename(f, ".ts"));
  return [...local, ...PROP_SVG_IDS].sort();
}

async function compileTarget(id: string): Promise<{ outPath: string; svg: string }> {
  if (PROP_SVG_IDS.has(id)) {
    const mod = (await import(pathToFileURL(join(PROPS_DIR, `${id}.ts`)).href)) as {
      default?: PropSpriteDefinition;
    };
    if (!mod.default) throw spriteError(`Prop definition missing default export: ${id}`, { id });
    const rendered = renderProp(mod.default, "hi8bit");
    return {
      outPath: join(ASSETS_DIR, "props", id, `${id}_hi8bit.svg`),
      svg: sheetToSvg(rendered.sheet),
    };
  }

  const file = join(HI8BIT_DIR, `${id}.ts`);
  if (!existsSync(file)) throw spriteError(`Hi8bit placeholder script not found: ${file}`, { id, file });
  const mod = (await import(pathToFileURL(file).href)) as { default?: Hi8bitDefinition };
  if (!mod.default) throw spriteError(`Hi8bit script missing default export: ${id}`, { id });
  const def = mod.default;
  return {
    outPath: join(ASSETS_DIR, def.category, def.id, `${def.id}_hi8bit.svg`),
    svg: compileHi8bitSvg(def),
  };
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const all = args.includes("--all");
  const ids = all ? listIds() : args.filter((a) => !a.startsWith("--"));

  if (ids.length === 0) {
    throw spriteError("Usage: bun scripts/sprites/hi8bit/compile.ts <id> [<id>...] | --all [--check]");
  }

  let stale = 0;
  for (const id of ids) {
    const { outPath, svg } = await compileTarget(id);
    if (check) {
      const ok = existsSync(outPath) && readFileSync(outPath, "utf8").replace(/\r\n/g, "\n") === svg;
      if (!ok) {
        console.log(`${id} out of date: ${outPath}`);
        stale++;
      }
      continue;
    }
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, svg, "utf8");
    console.log(`compiled ${id} -> ${outPath}`);
  }
  return stale > 0 ? 1 : 0;
}

if (import.meta.main) {
  process.exitCode = await main();
}
