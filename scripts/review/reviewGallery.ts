/**
 * Pure grid and HTML builders for the parallax visual review gallery.
 * No I/O here: the capture script decides where files land, this module only
 * describes the layout and the relative links that point at them.
 */

export interface ReviewViewport {
  readonly id: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly deviceScaleFactor: number;
}

export interface ReviewPosition {
  readonly id: string;
  readonly label: string;
}

export const REVIEW_VIEWPORTS: readonly ReviewViewport[] = [
  { id: "desktop", label: "Desktop 1920x1080", width: 1920, height: 1080, deviceScaleFactor: 1 },
  { id: "laptop", label: "Laptop 1440x900", width: 1440, height: 900, deviceScaleFactor: 1 },
  { id: "tablet", label: "Tablet 1024x768 @2x", width: 1024, height: 768, deviceScaleFactor: 2 },
];

export const REVIEW_POSITIONS: readonly ReviewPosition[] = [
  { id: "start", label: "start" },
  { id: "middle", label: "after holding right" },
  { id: "goal", label: "near goal" },
];

export const REVIEW_OUT_DIR = "dist-review";
export const REVIEW_GALLERY_FILE = "index.html";

/** Relative path (from the gallery) of one screenshot. */
export function reviewShotPath(mapId: string, viewportId: string, positionId: string): string {
  return `shots/${mapId}/${viewportId}-${positionId}.png`;
}

/** Relative path (from the gallery) of the 3 s desktop clip for one map. */
export function reviewClipPath(mapId: string): string {
  return `clips/${mapId}.webm`;
}

export interface GalleryColumn {
  readonly key: string;
  readonly viewport: ReviewViewport;
  readonly position: ReviewPosition;
}

export interface GalleryCell {
  readonly column: GalleryColumn;
  readonly src: string;
}

export interface GalleryRow {
  readonly mapId: string;
  readonly clip: string;
  readonly cells: readonly GalleryCell[];
}

export interface GalleryGrid {
  readonly columns: readonly GalleryColumn[];
  readonly rows: readonly GalleryRow[];
}

/** Builds rows = maps, columns = viewport x camera position, in the order given. */
export function buildGalleryGrid(
  mapIds: readonly string[],
  viewports: readonly ReviewViewport[] = REVIEW_VIEWPORTS,
  positions: readonly ReviewPosition[] = REVIEW_POSITIONS,
): GalleryGrid {
  const columns: GalleryColumn[] = [];
  for (const viewport of viewports) {
    for (const position of positions) {
      columns.push({ key: `${viewport.id}-${position.id}`, viewport, position });
    }
  }
  const rows: GalleryRow[] = mapIds.map((mapId) => ({
    mapId,
    clip: reviewClipPath(mapId),
    cells: columns.map((column) => ({
      column,
      src: reviewShotPath(mapId, column.viewport.id, column.position.id),
    })),
  }));
  return { columns, rows };
}

export interface GalleryMeta {
  readonly commitSha: string;
  readonly generatedAt: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Renders the gallery page: a header with commit and date, then the map x view grid. */
export function renderGalleryHtml(grid: GalleryGrid, meta: GalleryMeta): string {
  const viewportGroups: { viewport: ReviewViewport; span: number }[] = [];
  for (const column of grid.columns) {
    const last = viewportGroups[viewportGroups.length - 1];
    if (last && last.viewport.id === column.viewport.id) last.span += 1;
    else viewportGroups.push({ viewport: column.viewport, span: 1 });
  }

  const groupHeader = viewportGroups
    .map(({ viewport, span }) => `<th colspan="${span}" scope="colgroup">${escapeHtml(viewport.label)}</th>`)
    .join("");
  const positionHeader = grid.columns
    .map((column) => `<th scope="col">${escapeHtml(column.position.label)}</th>`)
    .join("");
  const bodyRows = grid.rows
    .map((row) => {
      const cells = row.cells
        .map(
          (cell) =>
            `<td><a href="${escapeHtml(cell.src)}"><img loading="lazy" src="${escapeHtml(cell.src)}" alt="${escapeHtml(`${row.mapId} ${cell.column.key}`)}"></a></td>`,
        )
        .join("");
      return `<tr><th scope="row">${escapeHtml(row.mapId)}<a class="clip" href="${escapeHtml(row.clip)}">clip (3 s, desktop)</a></th>${cells}</tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Parallax visual review</title>
<style>
  body { margin: 0; padding: 16px; background: #1c0c07; color: #f5e6d3; font: 13px/1.4 system-ui, sans-serif; }
  header { margin-bottom: 12px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { color: #d6b48a; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #4a200e; padding: 4px; vertical-align: top; }
  th[scope="colgroup"] { background: #2d140a; }
  th[scope="col"] { background: #26120b; font-weight: 500; }
  th[scope="row"] { background: #26120b; text-align: left; white-space: nowrap; }
  td img { display: block; width: 320px; height: auto; }
  .clip { display: block; margin-top: 4px; color: #f59e0b; font-weight: 400; }
</style>
</head>
<body>
<header>
  <h1>Parallax visual review</h1>
  <div class="meta">Commit <code>${escapeHtml(meta.commitSha)}</code> &middot; generated ${escapeHtml(meta.generatedAt)}</div>
</header>
<div class="scroll">
<table>
<thead>
<tr><th rowspan="2" scope="col">Map</th>${groupHeader}</tr>
<tr>${positionHeader}</tr>
</thead>
<tbody>
${bodyRows}
</tbody>
</table>
</div>
</body>
</html>
`;
}
