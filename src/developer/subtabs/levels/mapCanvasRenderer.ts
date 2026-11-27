import { LocationDefinition } from "@game/locations/types";
import type { LeverGateLink, MapEntityCategory, MapEntityItem } from "./mapEntities";
import type { Rect2D, ViewportTransform } from "./mapViewport";
import { worldToScreen } from "./mapViewport";

export interface MapCaptionOverlay {
  readonly uid: string;
  readonly key: string;
  readonly text: string;
  readonly worldX: number;
  readonly worldY: number;
  readonly isActive: boolean;
}

export interface MapRenderParams {
  readonly location: LocationDefinition;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly viewport: ViewportTransform;
  readonly entities: readonly MapEntityItem[];
  readonly leverGateLinks: readonly LeverGateLink[];
  readonly visibleCategories: ReadonlySet<MapEntityCategory>;
  readonly selectedUid: string | null;
  readonly hoveredUid: string | null;
  readonly dragRect: Rect2D | null;
  readonly captions: readonly MapCaptionOverlay[];
  readonly showCaptions: boolean;
}

const CATEGORY_COLORS: Record<
  MapEntityCategory,
  { readonly fill: string; readonly stroke: string; readonly text: string }
> = {
  solid: { fill: "rgba(30, 41, 59, 0.72)", stroke: "#94a3b8", text: "#cbd5e1" },
  gate: { fill: "rgba(180, 83, 9, 0.55)", stroke: "#f59e0b", text: "#fde68a" },
  lever: { fill: "rgba(245, 158, 11, 0.65)", stroke: "#fbbf24", text: "#fef3c7" },
  portal: { fill: "rgba(14, 165, 233, 0.38)", stroke: "#38bdf8", text: "#e0f2fe" },
  trigger: { fill: "rgba(168, 85, 247, 0.25)", stroke: "#c084fc", text: "#f3e8ff" },
  spawn: { fill: "rgba(34, 197, 94, 0.5)", stroke: "#4ade80", text: "#dcfce7" },
  enemy: { fill: "rgba(244, 63, 94, 0.68)", stroke: "#fda4af", text: "#ffe4e6" },
  hazard: { fill: "rgba(220, 38, 38, 0.55)", stroke: "#f87171", text: "#fee2e2" },
};

const DRAW_ORDER: readonly MapEntityCategory[] = [
  "solid",
  "gate",
  "hazard",
  "trigger",
  "portal",
  "lever",
  "spawn",
  "enemy",
];

function drawWorldGrid(ctx: CanvasRenderingContext2D, width: number, height: number, zoom: number): void {
  const step = zoom < 0.25 ? 400 : 200;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  for (let x = 0; x <= width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
  for (let y = 0; y <= height; y += step) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();
}

function drawCaptionBubble(
  ctx: CanvasRenderingContext2D,
  caption: MapCaptionOverlay,
  viewport: ViewportTransform,
  canvasWidth: number,
  canvasHeight: number
): void {
  const anchor = worldToScreen(caption.worldX, caption.worldY, viewport);
  if (anchor.x < -20 || anchor.x > canvasWidth + 20 || anchor.y < 0 || anchor.y > canvasHeight + 40) {
    return;
  }
  const maxWidth = caption.isActive ? 260 : 190;
  const padX = 10;
  const padY = 7;
  const lineH = 14;

  ctx.save();
  ctx.font = caption.isActive ? "11px sans-serif" : "10px sans-serif";
  const words = caption.text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth - padX * 2 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  const visibleLines = lines.slice(0, caption.isActive ? 4 : 2);
  if (lines.length > visibleLines.length) {
    const lastIdx = visibleLines.length - 1;
    visibleLines[lastIdx] = `${visibleLines[lastIdx]}...`;
  }

  let widest = ctx.measureText(caption.key).width;
  for (const line of visibleLines) {
    widest = Math.max(widest, ctx.measureText(line).width);
  }
  const boxW = Math.min(maxWidth, Math.max(96, widest + padX * 2));
  const boxH = padY * 2 + 13 + visibleLines.length * lineH;
  const bx = Math.max(8, Math.min(canvasWidth - boxW - 8, anchor.x - boxW / 2));
  const by = Math.max(8, anchor.y - boxH - 22);

  ctx.fillStyle = caption.isActive ? "rgba(18, 14, 12, 0.94)" : "rgba(18, 14, 12, 0.84)";
  ctx.strokeStyle = caption.isActive ? "#f59e0b" : "#a855f7";
  ctx.lineWidth = caption.isActive ? 2 : 1.25;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  const tailX = Math.max(bx + 10, Math.min(bx + boxW - 10, anchor.x));
  ctx.beginPath();
  ctx.moveTo(tailX - 5, by + boxH);
  ctx.lineTo(tailX, by + boxH + 7);
  ctx.lineTo(tailX + 5, by + boxH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 9px monospace";
  ctx.fillStyle = caption.isActive ? "#fbbf24" : "#d8b4fe";
  ctx.fillText(caption.key, bx + padX, by + padY + 8);

  ctx.font = caption.isActive ? "11px sans-serif" : "10px sans-serif";
  ctx.fillStyle = "#f5f5f4";
  visibleLines.forEach((line, idx) => {
    ctx.fillText(line, bx + padX, by + padY + 23 + idx * lineH);
  });
  ctx.restore();
}

export function renderMapBrowserCanvas(
  ctx: CanvasRenderingContext2D,
  params: MapRenderParams
): void {
  const { location, canvasWidth, canvasHeight, viewport, entities, leverGateLinks } = params;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(viewport.panX, viewport.panY);
  ctx.scale(viewport.zoom, viewport.zoom);

  const grad = ctx.createLinearGradient(0, 0, 0, location.height);
  grad.addColorStop(0, location.theme.bgGradientTop);
  grad.addColorStop(1, location.theme.bgGradientBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, location.width, location.height);

  drawWorldGrid(ctx, location.width, location.height, viewport.zoom);
  ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
  ctx.lineWidth = 2 / viewport.zoom;
  ctx.strokeRect(0, 0, location.width, location.height);

  for (const zone of location.bossZones ?? []) {
    ctx.save();
    ctx.fillStyle = zone.scope === "world" ? "rgba(225, 29, 72, 0.14)" : "rgba(245, 158, 11, 0.12)";
    ctx.strokeStyle = zone.scope === "world" ? "rgba(251, 113, 133, 0.65)" : "rgba(251, 191, 36, 0.6)";
    ctx.lineWidth = 1.5 / viewport.zoom;
    ctx.setLineDash([8 / viewport.zoom, 5 / viewport.zoom]);
    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    ctx.restore();
  }

  for (const cat of DRAW_ORDER) {
    if (!params.visibleCategories.has(cat)) continue;
    const style = CATEGORY_COLORS[cat];
    for (const entity of entities) {
      if (entity.category !== cat) continue;
      drawEntityShape(ctx, entity, style, viewport.zoom, entity.uid === params.selectedUid, entity.uid === params.hoveredUid);
    }
  }

  if (params.visibleCategories.has("lever")) {
    for (const link of leverGateLinks) {
      ctx.save();
      ctx.setLineDash([7 / viewport.zoom, 4 / viewport.zoom]);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2 / viewport.zoom;
      ctx.beginPath();
      ctx.moveTo(link.fromX, link.fromY);
      ctx.lineTo(link.toX, link.toY);
      ctx.stroke();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(link.toX, link.toY, 4 / viewport.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (params.dragRect) {
    ctx.save();
    ctx.fillStyle = "rgba(192, 132, 252, 0.25)";
    ctx.strokeStyle = "#e879f9";
    ctx.lineWidth = 2 / viewport.zoom;
    ctx.setLineDash([6 / viewport.zoom, 3 / viewport.zoom]);
    ctx.fillRect(params.dragRect.x, params.dragRect.y, params.dragRect.width, params.dragRect.height);
    ctx.strokeRect(params.dragRect.x, params.dragRect.y, params.dragRect.width, params.dragRect.height);
    ctx.restore();
  }
  ctx.restore();

  drawEntityLabels(ctx, params);

  if (params.showCaptions) {
    for (const caption of params.captions) {
      if (caption.text.trim()) drawCaptionBubble(ctx, caption, viewport, canvasWidth, canvasHeight);
    }
  }
}

function drawEntityShape(
  ctx: CanvasRenderingContext2D,
  entity: MapEntityItem,
  style: { readonly fill: string; readonly stroke: string },
  zoom: number,
  isSelected: boolean,
  isHovered: boolean
): void {
  if (entity.patrolTrack) {
    ctx.save();
    ctx.setLineDash([5 / zoom, 4 / zoom]);
    ctx.strokeStyle = entity.category === "enemy" ? "rgba(251, 113, 133, 0.65)" : "rgba(251, 191, 36, 0.7)";
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath();
    if (entity.patrolTrack.axis === "x") {
      const py = entity.y + entity.height * 0.5;
      ctx.moveTo(entity.patrolTrack.min, py);
      ctx.lineTo(entity.patrolTrack.max, py);
    } else {
      const px = entity.x + entity.width * 0.5;
      ctx.moveTo(px, entity.patrolTrack.min);
      ctx.lineTo(px, entity.patrolTrack.max);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = style.fill;
  ctx.strokeStyle = isSelected ? "#fde047" : isHovered ? "#ffffff" : style.stroke;
  ctx.lineWidth = (isSelected ? 3 : isHovered ? 2.2 : 1.5) / zoom;
  if (entity.category === "trigger") ctx.setLineDash([6 / zoom, 4 / zoom]);

  if (entity.category === "spawn") {
    const r = Math.max(8, Math.min(entity.width, entity.height) * 0.45);
    ctx.beginPath();
    ctx.arc(entity.x + entity.width / 2, entity.y + entity.height / 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
    ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);
    if (entity.isOneWay) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(entity.x, entity.y, entity.width, Math.max(2, 3 / zoom));
    }
  }
  ctx.restore();
}

function drawEntityLabels(ctx: CanvasRenderingContext2D, params: MapRenderParams): void {
  const { entities, visibleCategories, viewport, canvasWidth, canvasHeight, selectedUid, hoveredUid } = params;
  ctx.save();
  ctx.font = "bold 10px monospace";
  for (const entity of entities) {
    if (!visibleCategories.has(entity.category)) continue;
    const isImportant = entity.category !== "solid" || entity.uid === selectedUid || entity.uid === hoveredUid;
    if (!isImportant && viewport.zoom < 0.22) continue;

    const pt = worldToScreen(entity.x, entity.y, viewport);
    if (pt.x > canvasWidth || pt.y > canvasHeight || pt.x + entity.width * viewport.zoom < 0) continue;

    const labelText = entity.isDraft ? `* ${entity.label}` : entity.label;
    const metrics = ctx.measureText(labelText);
    const lx = Math.max(4, Math.min(canvasWidth - metrics.width - 8, pt.x));
    const ly = Math.max(14, pt.y - 4);
    ctx.fillStyle = "rgba(9, 9, 11, 0.78)";
    ctx.fillRect(lx - 2, ly - 10, metrics.width + 4, 12);
    ctx.fillStyle = entity.uid === selectedUid ? "#fde047" : CATEGORY_COLORS[entity.category].text;
    ctx.fillText(labelText, lx, ly - 1);
  }
  ctx.restore();
}
