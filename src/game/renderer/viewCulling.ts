/**
 * Render-only view culling. Holds the camera's world-space view rectangle (expanded by a
 * margin so sprites overhanging their hitbox are never clipped early) plus per-frame
 * draw counters. All state is preallocated; `intersects` performs no allocations.
 * Never touches simulation state.
 */
export const VIEW_CULL_MARGIN = 200;

export class ViewCuller {
  public left: number = 0;
  public top: number = 0;
  public right: number = 0;
  public bottom: number = 0;

  public entitiesDrawn: number = 0;
  public entitiesTotal: number = 0;
  public enemiesDrawn: number = 0;
  public enemiesTotal: number = 0;

  /**
   * Computes the visible world rectangle once per frame.
   * @param cameraX camera world X (left edge)
   * @param cameraY camera world Y (top edge)
   * @param viewportWidth viewport width in world units (canvas px / scale)
   * @param viewportHeight viewport height in world units
   * @param shakeX screen-shake offset applied before the camera translate
   * @param shakeY screen-shake offset applied before the camera translate
   */
  public setView(
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    shakeX: number = 0,
    shakeY: number = 0
  ): void {
    this.left = cameraX - shakeX - VIEW_CULL_MARGIN;
    this.top = cameraY - shakeY - VIEW_CULL_MARGIN;
    this.right = cameraX - shakeX + viewportWidth + VIEW_CULL_MARGIN;
    this.bottom = cameraY - shakeY + viewportHeight + VIEW_CULL_MARGIN;
    this.entitiesDrawn = 0;
    this.entitiesTotal = 0;
    this.enemiesDrawn = 0;
    this.enemiesTotal = 0;
  }

  /** True when the AABB overlaps the (margin-expanded) view rectangle. */
  public intersects(x: number, y: number, width: number, height: number): boolean {
    return x + width >= this.left && x <= this.right && y + height >= this.top && y <= this.bottom;
  }
}

export const defaultViewCuller = new ViewCuller();
