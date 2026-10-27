/**
 * Geometric, spatial, and universal primitives for the 2D Game Engine.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ParticleBurstType = "dust" | "spark" | "magic";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: "leaf" | "spark" | "dust" | "magic" | "shield";
}

export type SupportedLanguage = "pl" | "en";
