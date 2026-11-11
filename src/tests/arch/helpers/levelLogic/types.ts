import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";

export type Severity = "error" | "warn" | "info";

export interface Violation {
  severity: Severity;
  code: string;
  subject: string;
  message: string;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EnemyTemplateLike {
  isAerial: boolean;
  dimensions: { width: number; height: number };
  stats: { speed: number };
}

export type EnemyRegistry = Readonly<Record<string, EnemyTemplateLike>>;
export type LocationCatalog = Readonly<Record<string, LocationJsonSchema>>;

export interface Surface {
  id: string;
  kind: "solid" | "oneway";
  rects: Rect[];
  moving: boolean;
  isGate: boolean;
}

export interface Hazard extends Rect {
  id: string;
}

export interface Touchable {
  id: string;
  kind: "trigger" | "portal" | "lever";
  rect: Rect;
}

export interface StandNode {
  key: string;
  surface: Surface;
  rectIndex: number;
  x0: number;
  x1: number;
  top: number;
  samples: number[];
}

export interface StartPoint {
  surfaceId: string;
  rectIndex: number;
  x: number;
}

export const violation = (
  severity: Severity,
  code: string,
  subject: string,
  message: string
): Violation => ({ severity, code, subject, message });
