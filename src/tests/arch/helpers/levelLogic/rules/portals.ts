import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";
import type { LevelContext, Rule } from "../context";
import { dropSpawn } from "../spawnDrop";
import { buildTerrain } from "../terrain";
import { violation, type Violation } from "../types";
import { buildWorld } from "../world";

type Portal = NonNullable<LocationJsonSchema["layout"]["portals"]>[number];
type Point = { x: number; y: number };

interface ResolvedPortal {
  id: string;
  target: string | undefined;
  entryKey: string | undefined;
  spawn: Point | undefined;
  keyMissing: boolean;
}

function resolvePortal(bp: LocationJsonSchema, p: Portal): ResolvedPortal {
  const def = p.portalKey ? bp.dictionaries.portals?.[p.portalKey] : undefined;
  return {
    id: p.id,
    target: p.targetLocationId ?? def?.targetLocationId,
    entryKey: p.targetEntryKey ?? def?.targetEntryKey,
    spawn: p.targetSpawnPoint ?? def?.targetSpawnPoint,
    keyMissing: !!p.portalKey && !def,
  };
}

const resolveAll = (bp: LocationJsonSchema): ResolvedPortal[] => (bp.layout.portals ?? []).map((p) => resolvePortal(bp, p));

const samePoint = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

function targetSpawnOf(r: ResolvedPortal, target: LocationJsonSchema): Point | undefined {
  if (r.spawn) return r.spawn;
  return r.entryKey ? target.spawnPoints.entries?.[r.entryKey] : undefined;
}

function danglingReason(r: ResolvedPortal, target: LocationJsonSchema | undefined): string | undefined {
  if (r.keyMissing) return "its portalKey is missing from dictionaries.portals";
  if (!r.target) return "it names no target location";
  if (!target) return `target location '${r.target}' does not exist`;
  if (r.entryKey && !target.spawnPoints.entries?.[r.entryKey]) return `target entry '${r.entryKey}' is missing in '${r.target}'`;
  return undefined;
}

function portalChecks(ctx: LevelContext, catalog: NonNullable<LevelContext["catalog"]>): Violation[] {
  const out: Violation[] = [];
  const terrains = new Map<string, ReturnType<typeof buildTerrain>>();
  for (const r of resolveAll(ctx.blueprint)) {
    const target = r.target ? catalog[r.target] : undefined;
    const reason = danglingReason(r, target);
    if (reason || !target) {
      out.push(violation("error", "PORTAL_DANGLING", r.id, `portal '${r.id}': ${reason}`));
      continue;
    }
    const spawn = targetSpawnOf(r, target);
    if (spawn) {
      if (!terrains.has(target.id)) terrains.set(target.id, buildTerrain(buildWorld(target), new Set()));
      const { fail } = dropSpawn(terrains.get(target.id)!, spawn);
      if (fail) out.push(violation("error", "SPAWN_INVALID", r.id, `portal '${r.id}' -> ${target.id} spawn (${spawn.x},${spawn.y}): ${fail}`));
    }
    if (!resolveAll(target).some((back) => back.target === ctx.blueprint.id)) {
      out.push(violation("warn", "PORTAL_ONE_WAY", r.id, `portal '${r.id}' leads to '${target.id}', which has no portal back to '${ctx.blueprint.id}'`));
    }
  }
  return out;
}

function entryChecks(ctx: LevelContext, catalog: NonNullable<LevelContext["catalog"]>): Violation[] {
  const incoming = Object.values(catalog)
    .flatMap((bp) => resolveAll(bp))
    .filter((r) => r.target === ctx.blueprint.id);
  const out: Violation[] = [];
  for (const [key, p] of Object.entries(ctx.blueprint.spawnPoints.entries ?? {})) {
    const used = incoming.some((r) => r.entryKey === key || (r.spawn !== undefined && samePoint(r.spawn, p)));
    if (!used) out.push(violation("warn", "ENTRY_UNUSED", `spawn:${key}`, `spawn entry '${key}' (${p.x},${p.y}) is not targeted by any portal`));
  }
  return out;
}

export const portalLinks: Rule = (ctx) => {
  if (!ctx.catalog) return [];
  const catalog = { ...ctx.catalog, [ctx.blueprint.id]: ctx.blueprint };
  return [...portalChecks({ ...ctx, catalog }, catalog), ...entryChecks({ ...ctx, catalog }, catalog)];
};
