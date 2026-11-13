import type { PixelCanvas } from "../../defineHeroSprite";

// ─────────────────────────────────────────────────────────────────────────────
// AURELIA — The Aetherblade Warden (Autumn Mage)
//
// Cell dimensions:
//   hi-8bit:  62 × 72 px (s = 1)
//   hi-16bit: 124 × 144 px (s = 2)
//
// Rules:
// - Feet sit squarely on the bottom row (y = 71 in hi-8bit, y = 143 in hi-16bit)
//   in EVERY frame (physics engine lifts the body; pose shows air time).
// - Body is centered at CX = 31 in the first cell; wide frames extend right.
// - Standing height is ~132-136 px of the 144 px cell (hi-16bit) / 66-68 px (hi-8bit).
// - 1 px transparent margin at top, left, and right after outline().
// - Clothing in rich autumn tones (wine, amber, deep green, bronze).
// - Vibrant cyan/teal ONLY for magic arcs, sigils, and Aether crystal flame.
// ─────────────────────────────────────────────────────────────────────────────

export const CX = 31;      // Body centre in hi-8bit coords (62 / 2)
export const FLOOR8 = 71;  // Bottom row in hi-8bit cell (72 - 1)

// ─── Palettes ─────────────────────────────────────────────────────────────────

export interface Palette {
  outline:      string;
  skin:         string;
  skinShade:    string;
  hair:         string;
  hairLight:    string;
  hairShade:    string;
  feather:      string;
  featherShade: string;
  robe:         string;
  robeLight:    string;
  robeShade:    string;
  sash:         string;
  sashShade:    string;
  trim:         string;
  trimShade:    string;
  boot:         string;
  bootShade:    string;
  staff:        string;
  staffLight:   string;
  gem:          string;
  magic:        string;
  magicDim:     string;
  magicCore:    string;
}

export const HI8: Palette = {
  outline:      "#160f14",
  skin:         "#f3ba9d",
  skinShade:    "#f3ba9d",
  hair:         "#4e2216",
  hairLight:    "#4e2216",
  hairShade:    "#4e2216",
  feather:      "#e59b24",
  featherShade: "#e59b24",
  robe:         "#6a1e36",
  robeLight:    "#6a1e36",
  robeShade:    "#6a1e36",
  sash:         "#2a5c28",
  sashShade:    "#2a5c28",
  trim:         "#c8842a",
  trimShade:    "#c8842a",
  boot:         "#3a2010",
  bootShade:    "#3a2010",
  staff:        "#4e2216",
  staffLight:   "#4e2216",
  gem:          "#4ee2d4",
  magic:        "#4ee2d4",
  magicDim:     "#29a89e",
  magicCore:    "#def",
};

export const HI16: Palette = {
  outline:      "#160f14",
  skin:         "#f4c0a0",
  skinShade:    "#b86d52",
  hair:         "#4e2216",
  hairLight:    "#6c3322",
  hairShade:    "#3a1912",
  feather:      "#e8a830",
  featherShade: "#8a4f15",
  robe:         "#51162c",
  robeLight:    "#822646",
  robeShade:    "#2a0918",
  sash:         "#2d5a3f",
  sashShade:    "#173322",
  trim:         "#e59b24",
  trimShade:    "#8a4f15",
  boot:         "#3a2010",
  bootShade:    "#1e0e08",
  staff:        "#5c2a1a",
  staffLight:   "#9b5a2b",
  gem:          "#4ee2d4",
  magic:        "#6efaf0",
  magicDim:     "#198a82",
  magicCore:    "#def",
};

// ─── Drawing Brush ───────────────────────────────────────────────────────────

export class Brush {
  constructor(
    readonly c: PixelCanvas,
    readonly s: number,
    readonly detailed: boolean,
    readonly pal: Palette,
  ) {}

  get cellW8(): number {
    return Math.round(this.c.width / this.s);
  }

  px(x: number, y: number, col: string): void {
    const sx = Math.round(x * this.s);
    const sy = Math.round(y * this.s);
    if (sx >= 2 && sy >= 2 && sx <= this.c.width - 3 && sy <= this.c.height - 1) {
      this.c.px(sx, sy, col);
    }
  }

  px16(sx: number, sy: number, col: string): void {
    if (sx >= 2 && sy >= 2 && sx <= this.c.width - 3 && sy <= this.c.height - 1) {
      this.c.px(sx, sy, col);
    }
  }

  rect(x: number, y: number, w: number, h: number, col: string): void {
    if (w <= 0 || h <= 0) return;
    const sx = Math.round(x * this.s);
    const sy = Math.round(y * this.s);
    const sw = Math.round(w * this.s);
    const sh = Math.round(h * this.s);
    if (sw <= 0 || sh <= 0) return;
    const cx0 = Math.max(2, sx);
    const cy0 = Math.max(2, sy);
    const cx1 = Math.min(this.c.width - 3, sx + sw - 1);
    const cy1 = Math.min(this.c.height - 1, sy + sh - 1);
    if (cx1 >= cx0 && cy1 >= cy0) {
      this.c.rect(cx0, cy0, cx1 - cx0 + 1, cy1 - cy0 + 1, col);
    }
  }

  rect16(sx: number, sy: number, sw: number, sh: number, col: string): void {
    if (sw <= 0 || sh <= 0) return;
    const cx0 = Math.max(2, sx);
    const cy0 = Math.max(2, sy);
    const cx1 = Math.min(this.c.width - 3, sx + sw - 1);
    const cy1 = Math.min(this.c.height - 1, sy + sh - 1);
    if (cx1 >= cx0 && cy1 >= cy0) {
      this.c.rect(cx0, cy0, cx1 - cx0 + 1, cy1 - cy0 + 1, col);
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, col: string): void {
    const { s } = this;
    const shallow = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
    for (let i = 0; i < s; i++) {
      const ox = shallow ? 0 : i;
      const oy = shallow ? i : 0;
      const lx0 = Math.max(2, Math.min(this.c.width - 3, Math.round(x0 * s) + ox));
      const ly0 = Math.max(2, Math.min(this.c.height - 1, Math.round(y0 * s) + oy));
      const lx1 = Math.max(2, Math.min(this.c.width - 3, Math.round(x1 * s) + ox));
      const ly1 = Math.max(2, Math.min(this.c.height - 1, Math.round(y1 * s) + oy));
      this.c.line(lx0, ly0, lx1, ly1, col);
    }
  }

  line16(sx0: number, sy0: number, sx1: number, sy1: number, col: string): void {
    const lx0 = Math.max(2, Math.min(this.c.width - 3, sx0));
    const ly0 = Math.max(2, Math.min(this.c.height - 1, sy0));
    const lx1 = Math.max(2, Math.min(this.c.width - 3, sx1));
    const ly1 = Math.max(2, Math.min(this.c.height - 1, sy1));
    this.c.line(lx0, ly0, lx1, ly1, col);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, col: string): void {
    const scx = Math.round(cx * this.s);
    const scy = Math.round(cy * this.s);
    const srx = Math.round(rx * this.s);
    const sry = Math.round(ry * this.s);
    if (srx <= 0 || sry <= 0) return;
    if (
      scx - srx >= 2 &&
      scy - sry >= 2 &&
      scx + srx <= this.c.width - 3 &&
      scy + sry <= this.c.height - 1
    ) {
      this.c.ellipse(scx, scy, srx, sry, col);
    }
  }

  polygon(pts: [number, number][], col: string): void {
    if (pts.length < 3) return;
    const scaled: [number, number][] = pts.map(([x, y]) => [
      Math.max(2, Math.min(this.c.width - 3, Math.round(x * this.s))),
      Math.max(2, Math.min(this.c.height - 1, Math.round(y * this.s))),
    ]);
    this.c.polygon(scaled, col);
  }
}

// ─── Poses and Animation State ───────────────────────────────────────────────

export interface LegState {
  x: number;       // Foot x offset from CX
  lift: number;    // 0 = planted on FLOOR8 (y = 71)
  kneeX: number;   // Knee x offset from CX
}

export interface StaffPose {
  grip: [number, number]; // [x, y] in hi-8bit coords
  tip:  [number, number]; // [x, y] in hi-8bit coords
}

export interface MagicEffect {
  kind: "vortex" | "blade" | "arc" | "blast" | "wave" | "sigil" | "shield" | "motes" | "dash_trail";
  minX?: number;
  maxX: number;
  y: number;
  h?: number;
}

export interface Pose {
  bob: number;         // Vertical bob (positive = drops lower)
  lean: number;        // Horizontal lean (positive = leans right/forward)
  legL: LegState;      // Left (front/exposed) leg
  legR: LegState;      // Right (back) leg
  robeFlare?: number;  // Extra robe billowing width on left
  hairWind?: number;   // Hair trailing shift
  staff: StaffPose;    // Position of focus staff
  dashAfterimages?: boolean; // Draw spectral ghost figures behind
  magic?: MagicEffect; // Magical VFX
}

export const REST_STAFF: StaffPose = {
  grip: [CX + 6, 32],
  tip:  [CX + 13, 14],
};

export const REST_POSE: Pose = {
  bob: 0,
  lean: 0,
  legL: { x: -4, lift: 0, kneeX: -3 },
  legR: { x: 3,  lift: 0, kneeX: 3 },
  robeFlare: 0,
  hairWind: 0,
  staff: REST_STAFF,
};

// ─── Drawing Functions for Parts ─────────────────────────────────────────────

export function torsoY(p: Pose): number {
  return 20 + p.bob;
}

export function headY(p: Pose): number {
  return 7 + p.bob;
}

// 1. Draw Boots (sitting on FLOOR8)
export function drawBoots(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const legs = [
    { state: p.legL, isExposed: true },
    { state: p.legR, isExposed: false },
  ];

  for (const { state, isExposed } of legs) {
    const footX = CX + state.x + p.lean;
    const footY = FLOOR8 - state.lift; // y = 71 when lift = 0

    // Traveling Boot (3 px high: y=69..71)
    b.rect(footX - 2, footY - 2, 5, 3, pal.boot);

    // Bronze buckle / cuff at top of boot
    b.rect(footX - 2, footY - 3, 5, 1, pal.trim);

    if (detailed) {
      b.rect(footX - 2, footY - 1, 2, 2, pal.bootShade);
      b.px(footX, footY - 3, pal.trimShade);
      if (isExposed) {
        b.px16(Math.round((footX + 1) * 2), Math.round((footY - 2) * 2), pal.trim);
      }
    }
  }
}

// 2. Draw Legs (Slender legs; left exposed through robe slit)
export function drawLegs(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const hipY = tY + 13;

  // Back (right) leg under shadows
  const rFootX = CX + p.legR.x + p.lean;
  const rFootY = FLOOR8 - p.legR.lift;
  const rKneeX = CX + p.legR.kneeX + p.lean;
  const rKneeY = Math.round((hipY + rFootY) / 2);
  b.line(CX + 2 + p.lean, hipY, rKneeX, rKneeY, pal.robeShade);
  b.line(rKneeX, rKneeY, rFootX, rFootY - 3, pal.robeShade);

  // Front (left) leg — exposed through robe slit (warm skin!)
  const lFootX = CX + p.legL.x + p.lean;
  const lFootY = FLOOR8 - p.legL.lift;
  const lKneeX = CX + p.legL.kneeX + p.lean;
  const lKneeY = Math.round((hipY + lFootY) / 2);

  // Thigh & Shin in skin color
  b.line(CX - 2 + p.lean, hipY, lKneeX, lKneeY, pal.skin);
  b.line(CX - 1 + p.lean, hipY, lKneeX + 1, lKneeY, pal.skin);
  b.line(lKneeX, lKneeY, lFootX, lFootY - 3, pal.skin);
  b.line(lKneeX + 1, lKneeY, lFootX + 1, lFootY - 3, pal.skin);

  if (detailed) {
    b.line(CX - 2 + p.lean, hipY, lKneeX, lKneeY, pal.skinShade);
    b.line(lKneeX, lKneeY, lFootX, lFootY - 3, pal.skinShade);
  }
}

// 3. Draw Robe (Asymmetrical flowing gothic skirt with side slit)
export function drawRobe(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const hipY = tY + 12;
  const flare = p.robeFlare ?? 0;

  // Rear billow / cascade on the left
  const skirtLeft = CX - 9 - flare + p.lean;
  const skirtWidth = 14 + flare;
  const skirtHeight = Math.max(8, FLOOR8 - hipY - 6);

  // Deep wine fabric
  b.rect(skirtLeft, hipY, skirtWidth, skirtHeight, pal.robe);

  // Billowing stepped folds
  if (flare > 4) {
    b.rect(skirtLeft, hipY + 4, 3, skirtHeight - 4, pal.robeShade);
    b.rect(skirtLeft + 3, hipY + 8, 3, skirtHeight - 8, pal.robe);
  }

  // Under-fabric dark pine lining peek on left edge
  b.rect(skirtLeft, hipY + 2, 2, skirtHeight - 2, pal.sashShade);

  // Bronze filigree trim on bottom hem
  b.rect(skirtLeft, hipY + skirtHeight - 1, skirtWidth, 1, pal.trim);

  if (detailed) {
    b.rect(skirtLeft + 2, hipY, 3, skirtHeight, pal.robeLight);
    b.rect(skirtLeft + skirtWidth - 3, hipY, 3, skirtHeight, pal.robeShade);
    b.rect(skirtLeft, hipY + skirtHeight, skirtWidth, 1, pal.trimShade);
    // 16-bit fold highlight
    b.line16(
      Math.round((skirtLeft + 4) * 2),
      Math.round((hipY + 1) * 2),
      Math.round((skirtLeft + 2) * 2),
      Math.round((hipY + skirtHeight - 2) * 2),
      pal.robeLight,
    );
  }
}

// 4. Draw Sash & Belt (Forest green sash tied at hip with bronze buckle)
export function drawSash(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const beltY = tY + 11;
  const beltX = CX - 7 + p.lean;
  const beltW = 14;

  // Forest green angled sash
  b.rect(beltX, beltY, beltW, 2, pal.sash);

  // Trailing ribbons on hip
  b.rect(CX - 6 + p.lean, beltY + 2, 2, 5, pal.sash);
  b.rect(CX - 5 + p.lean, beltY + 4, 2, 4, pal.sashShade);

  // Antique bronze filigree buckle
  b.rect(CX - 1 + p.lean, beltY, 3, 2, pal.trim);

  if (detailed) {
    b.rect(beltX, beltY, beltW, 1, pal.sash);
    b.rect(beltX, beltY + 1, beltW, 1, pal.sashShade);
    b.px(CX + p.lean, beltY + 1, pal.trimShade);
  }
}

// 5. Draw Torso (Autumn wine fitted bodice with bronze filigree)
export function drawTorso(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const tY = torsoY(p);
  const tX = CX - 6 + p.lean;
  const tW = 13;
  const tH = 12;

  // Bodice body
  b.rect(tX, tY, tW, tH, pal.robe);

  // Dark cowl neckline hugging collar
  b.rect(tX + 1, tY, tW - 2, 3, pal.robeShade);
  b.rect(CX - 1 + p.lean, tY - 2, 3, 2, pal.skin); // Throat

  // Antique bronze filigree fasteners down front
  b.px(CX + p.lean, tY + 4, pal.trim);
  b.px(CX + p.lean, tY + 7, pal.trim);
  b.px(CX + p.lean, tY + 9, pal.trim);

  // Slender arms
  // Left arm (trailing / balance)
  b.rect(tX - 2, tY + 1, 2, 8, pal.robe);
  b.rect(tX - 2, tY + 8, 2, 2, pal.skin); // Left hand

  // Right arm (holding staff at grip)
  const armX = CX + 3 + p.lean;
  b.rect(armX, tY + 2, 3, 6, pal.robe);
  b.rect(armX + 1, tY + 7, 3, 3, pal.skin); // Right hand

  if (detailed) {
    b.rect(tX, tY, 2, tH, pal.robeLight);
    b.rect(tX + tW - 2, tY, 2, tH, pal.robeShade);
    b.px16(Math.round((CX + p.lean) * 2), Math.round((tY + 4) * 2), pal.trim);
    b.px16(Math.round((CX + p.lean) * 2), Math.round((tY + 7) * 2), pal.trim);
  }
}

export const drawBodice = drawTorso;

// 6. Draw Head (Face, Voluminous Chestnut Hair Cascade, Amber Feather Plume)
export function drawHead(b: Brush, p: Pose): void {
  const { pal, detailed } = b;
  const hY = headY(p);
  const hX = CX - 4 + p.lean;
  const wind = p.hairWind ?? 0;

  // --- Voluminous Wild Chestnut Hair (Stepped Organic Locks) ---
  const hairLeft = CX - 12 - wind + p.lean;
  // Upper billowing crown mass
  b.rect(hairLeft + 1, hY + 1, 8, 5, pal.hair);
  // Mid cascade swelling outward
  b.rect(hairLeft, hY + 5, 10, 6, pal.hair);
  // Lower curling tresses tapering down back
  b.rect(hairLeft + 2, hY + 11, 7, 5, pal.hair);
  b.rect(hairLeft + 3, hY + 16, 5, 3, pal.hair);

  // Hair crown on top of head
  b.rect(hX - 2, hY, 11, 4, pal.hair);
  // Front face-framing curl
  b.rect(hX + 7, hY + 4, 2, 4, pal.hair);

  if (detailed) {
    b.rect(hairLeft, hY + 5, 3, 8, pal.hairShade);
    b.rect(hairLeft + 3, hY + 3, 4, 6, pal.hairLight);
    b.rect(hX - 1, hY, 7, 2, pal.hairLight);
    b.px16(Math.round((hX + 3) * 2), Math.round((hY + 1) * 2), pal.hairLight);
  }

  // --- Face ---
  // Sharp feline jawline & warm pale complexion
  b.rect(hX, hY + 3, 8, 7, pal.skin);
  b.rect(hX + 1, hY + 9, 6, 2, pal.skin);

  // Alert amber eye
  b.px(hX + 4, hY + 5, pal.trim);
  b.px(hX + 5, hY + 5, pal.outline);

  if (detailed) {
    b.rect(hX, hY + 8, 2, 3, pal.skinShade); // Jaw shadow
    b.px16(Math.round((hX + 4) * 2), Math.round((hY + 5) * 2), pal.feather);
  }

  // --- Amber Crest Feather Plume (Signature Silhouette Accent) ---
  const featherX = CX - 5 + p.lean;
  const featherY = Math.max(4, hY - 3);

  // Angled quill body
  b.line(featherX, featherY + 3, featherX - 2, featherY, pal.trimShade);
  b.rect(featherX - 3, featherY, 3, 2, pal.feather);
  b.rect(featherX - 2, featherY + 2, 3, 2, pal.feather);
  b.px(featherX - 3, featherY - 1, pal.feather); // Feather tip

  if (detailed) {
    b.line(featherX, featherY + 2, featherX - 2, featherY, pal.featherShade); // Rachis
    b.px16(Math.round((featherX - 1) * 2), Math.round(featherY * 2), pal.feather);
  }
}

// 7. Draw Arcane Focus Staff & Bronze Crescent Moon Cage
export function drawStaff(b: Brush, p: Pose, cellW8 = b.cellW8): void {
  const { pal, detailed } = b;
  const gx = p.staff.grip[0];
  const gy = p.staff.grip[1];
  const tx = Math.max(3, Math.min(cellW8 - 4, p.staff.tip[0]));
  const ty = Math.max(3, Math.min(FLOOR8 - 1, p.staff.tip[1]));

  // Buttend reaches opposite direction through grip
  const bx = Math.max(3, Math.min(cellW8 - 4, Math.round(gx - (tx - gx) * 0.35)));
  const by = Math.max(3, Math.min(FLOOR8 - 1, Math.round(gy - (ty - gy) * 0.35)));

  // Polished cedar staff shaft
  b.line(bx, by, tx, ty, pal.staff);

  // Bronze ferrule at butt
  b.px(bx, by, pal.trim);

  // Ornate Bronze Crescent Moon Cage cradling glowing cyan gem
  b.line(tx - 2, ty + 1, tx - 1, ty - 2, pal.trim);
  b.line(tx - 1, ty - 2, tx + 2, ty - 1, pal.trim);
  b.line(tx + 2, ty - 1, tx + 1, ty + 2, pal.trim);
  b.line(tx + 1, ty + 2, tx - 1, ty + 1, pal.trim);

  // Glowing Cyan Aether Crystal nestled in center
  b.rect(tx, ty, 2, 2, pal.gem);

  if (detailed) {
    b.line(gx, gy, tx, ty, pal.staffLight);
    b.px(tx - 1, ty - 1, pal.trimShade);
    b.px16(Math.round(tx * 2), Math.round(ty * 2), pal.magicCore);
    b.px(tx + 2, ty, pal.magic);
    b.px(tx, ty - 2, pal.magicDim);
  }
}

// 8. Draw Magic Effects (Curved Crescent Slashes, Arcane Sigils, Shockwaves)
export function drawMagic(b: Brush, p: Pose, cellW8 = b.cellW8): void {
  if (!p.magic) return;
  const { pal, detailed } = b;
  const { kind, minX = CX + 10, maxX, y, h = 6 } = p.magic;

  const x0 = Math.max(2, minX);
  const x1 = Math.min(cellW8 - 3, maxX);
  if (x1 <= x0) return;

  const w = x1 - x0 + 1;
  const cy = Math.max(3, Math.min(FLOOR8 - h, y));

  switch (kind) {
    case "vortex": {
      // Swirling gathered Aether sparks & energy rune motes
      const midY = cy + Math.round(h / 2);
      b.ellipse(x0 + Math.round(w / 2), midY, Math.round(w / 2), Math.round(h / 2), pal.magicDim);
      b.px(x1, midY, pal.gem);
      b.px(x0 + 2, midY - 2, pal.magic);
      b.px(x0 + Math.round(w / 2), midY, pal.magicCore);
      if (detailed) {
        b.px16(Math.round(x1 * 2), Math.round(midY * 2), pal.magicCore);
      }
      break;
    }

    case "blade":
    case "arc": {
      // Curved crescent slash wave tapering at both tips
      const midY = cy + Math.round(h / 2);
      b.polygon(
        [
          [x0, midY],
          [x0 + Math.round(w * 0.4), cy],
          [x1, midY],
          [x0 + Math.round(w * 0.5), cy + h - 1],
        ],
        pal.magicDim,
      );
      // Inner luminous blade core
      b.polygon(
        [
          [x0 + 2, midY],
          [x0 + Math.round(w * 0.4), cy + 2],
          [x1 - 2, midY],
          [x0 + Math.round(w * 0.5), cy + h - 3],
        ],
        pal.magic,
      );
      // Sharp glowing cutting line
      b.line(x0 + 4, midY, x1 - 1, midY, pal.magicCore);

      if (detailed) {
        b.px16(Math.round((x1 - 1) * 2), Math.round(midY * 2), pal.magicCore);
        b.px(x1, midY - 2, pal.magicDim);
        b.px(x1, midY + 2, pal.magicDim);
      }
      break;
    }

    case "wave":
    case "blast": {
      // Colossal crescent shockwave: wide curved arc with erupting shock rays
      const midY = cy + Math.round(h / 2);
      b.polygon(
        [
          [x0, cy + 2],
          [x0 + Math.round(w * 0.45), cy],
          [x1, midY],
          [x0 + Math.round(w * 0.45), cy + h - 1],
          [x0, cy + h - 3],
          [x0 + Math.round(w * 0.25), midY],
        ],
        pal.magicDim,
      );
      // Luminous cyan body
      b.polygon(
        [
          [x0 + 3, cy + 5],
          [x0 + Math.round(w * 0.5), cy + 3],
          [x1 - 3, midY],
          [x0 + Math.round(w * 0.5), cy + h - 4],
          [x0 + 3, cy + h - 6],
          [x0 + Math.round(w * 0.35), midY],
        ],
        pal.magic,
      );
      // Radiant white-cyan shock rays
      b.line(x0 + 6, midY - 3, x1 - 2, midY, pal.magicCore);
      b.line(x0 + 6, midY + 3, x1 - 2, midY, pal.magicCore);

      if (detailed) {
        b.line(x0 + 2, cy + 2, x1, midY, pal.magic);
        b.line(x0 + 2, cy + h - 3, x1, midY, pal.magic);
      }
      break;
    }

    case "sigil":
    case "shield": {
      // Radiant circular arcane glyph disc
      const midX = Math.round((x0 + x1) / 2);
      const midY = cy + Math.round(h / 2);
      const radius = Math.min(Math.round(w / 2), Math.round(h / 2));

      // Outer glowing ring
      b.ellipse(midX, midY, radius, radius, pal.magicDim);
      // Inner disc
      if (radius > 3) {
        b.ellipse(midX, midY, radius - 2, radius - 2, pal.magic);
      }
      // Glowing core
      if (radius > 5) {
        b.ellipse(midX, midY, radius - 4, radius - 4, pal.magicCore);
      }

      // Amber glyph accents along perimeter
      b.px(midX, midY - radius + 1, pal.trim);
      b.px(midX, midY + radius - 1, pal.trim);
      b.px(midX - radius + 1, midY, pal.trim);
      b.px(midX + radius - 1, midY, pal.trim);
      break;
    }

    case "motes": {
      // Dissipating sparkling motes
      for (let mx = x0; mx <= x1; mx += 3) {
        const my = cy + ((mx * 11) % Math.max(1, h));
        b.px(mx, my, pal.magic);
        if (detailed && mx % 6 === 0) {
          b.px(mx + 1, my, pal.magicCore);
        }
      }
      break;
    }

    case "dash_trail": {
      // Horizontal phase slipstream speed lines
      const midY = cy + Math.round(h / 2);
      b.line(x0 + 4, midY - 4, x1, midY - 4, pal.magicDim);
      b.line(x0 + 8, midY,     x1, midY,     pal.magicCore);
      b.line(x0 + 6, midY + 4, x1, midY + 4, pal.magic);

      if (detailed) {
        b.px16(Math.round(x1 * 2), Math.round(midY * 2), pal.magicCore);
      }
      break;
    }
  }
}

// ─── Drawing Helper for Full Standing Pose ──────────────────────────────────

export function drawPose(b: Brush, p: Pose): void {
  drawRobe(b, p);
  drawLegs(b, p);
  drawBoots(b, p);
  drawSash(b, p);
  drawTorso(b, p);
  drawHead(b, p);
  drawStaff(b, p);
  drawMagic(b, p);
}
