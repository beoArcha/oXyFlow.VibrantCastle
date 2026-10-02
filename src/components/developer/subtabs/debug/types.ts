import React from "react";
import { Player, Enemy } from "@game/types";
import { LocationId } from "@game/locations";

/**
 * Strongly typed game engine snapshot for telemetry and diagnostics.
 */
export interface DebugGameSnapshot {
  currentLocationId: LocationId | string;
  timeScale: number;
  godMode: boolean;
  infiniteMana: boolean;
  infiniteStamina: boolean;
  noClip: boolean;
  freezeAI: boolean;
  showHitboxes: boolean;
  p1: {
    x: number;
    y: number;
    health: number;
    mana: number;
    stamina: number;
    isGrounded: boolean;
    facingLeft: boolean;
    activeAnimation?: string;
  } | null;
  enemiesCount: number;
  particlesCount: number;
  projectilesCount: number;
}

/**
 * MetricTile color variant for telemetry indicators.
 */
export type TelemetryMetricVariant =
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "purple"
  | "blue"
  | "stone";

/**
 * Declarative configuration item for real-time engine telemetry displays.
 */
export interface TelemetryMetricItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  variant?: TelemetryMetricVariant;
}

/**
 * Sensor and diagnostic cheat toggle configuration item.
 */
export interface DebugSensorToggle {
  id: string;
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onToggle?: () => void;
}

/**
 * Props for the decomposed individual player inspection section.
 */
export interface DebugPlayerStatsSectionProps {
  player: Player;
  playerNumber: 1 | 2;
  label: string;
}

/**
 * Props for an individual enemy row in the active entities table.
 */
export interface DebugEntityTableRowProps {
  enemy: Enemy;
  onTeleport?: (enemy: Enemy) => void;
  onDamage?: (enemyId: string, amount: number) => void;
  onRemove?: (enemyId: string) => void;
}
