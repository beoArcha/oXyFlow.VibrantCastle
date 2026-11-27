import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, sep } from "node:path";
import { decodePngFile } from "./lib/png";
import { measureHorizontalSeam, seamVerdict, type SeamVerdict } from "./parallax/seamMetrics";

const BG_ROOT = fileURLToPath(new URL("../src/assets/bg", import.meta.url));

function collectPngs(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...collectPngs(full));
    else if (entry.endsWith(".png")) files.push(full);
  }
  return files;
}

function main(): void {
  const rows: string[] = [];
  let warnings = 0;
  for (const file of collectPngs(BG_ROOT)) {
    const image = decodePngFile(file);
    const measurement = measureHorizontalSeam(image);
    const verdict: SeamVerdict = seamVerdict(measurement);
    if (verdict === "warn") warnings++;
    rows.push(
      [
        relative(BG_ROOT, file).split(sep).join("/").padEnd(52),
        `${image.width}x${image.height}`.padEnd(10),
        measurement.seamDiff.toFixed(1).padStart(7),
        measurement.neighbourDiff.toFixed(1).padStart(7),
        verdict.toUpperCase(),
      ].join(" "),
    );
  }
  console.log(["file".padEnd(52), "size".padEnd(10), "seam".padStart(7), "floor".padStart(7), "verdict"].join(" "));
  console.log(rows.join("\n"));
  console.log(`\n${warnings} layer(s) warn (seam > mean RGBA diff threshold); warn layers need "mirrorTile": true.`);
}

if (import.meta.main) main();
