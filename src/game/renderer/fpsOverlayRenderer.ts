/**
 * Renders an on-screen FPS and GPU telemetry badge at the top-right corner of the canvas.
 */
export function renderFpsBadge(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  targetFps: number,
  measuredFps: number,
  isHardwareAccelerated: boolean
): void {
  ctx.save();
  const pad = 12;
  const badgeW = isHardwareAccelerated ? 138 : 100;
  const badgeH = 24;
  const x = canvasWidth - badgeW - pad;
  const y = pad;

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, badgeW, badgeH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const gpuTag = isHardwareAccelerated ? " • GPU" : "";
  ctx.fillText(`${measuredFps} / ${targetFps} FPS${gpuTag}`, x + badgeW / 2, y + badgeH / 2);
  ctx.restore();
}
