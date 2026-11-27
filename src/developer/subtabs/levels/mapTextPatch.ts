import type {
  LocationJsonSchema,
  PortalPlacementSchema,
  TriggerPlacementSchema,
} from "@game/locations/schema/locationSchema";

export interface DraftTriggerEntry {
  readonly kind: "create" | "edit";
  readonly id: string;
  readonly originalIndex?: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly triggerId: string;
  readonly oneShot?: boolean;
  readonly plText: string;
  readonly enText: string;
}

export interface DraftPortalTextEntry {
  readonly id: string;
  readonly originalIndex: number;
  readonly portalKey?: string;
  readonly labelKey: string;
  readonly defaultLabel?: string;
  readonly plText: string;
  readonly enText: string;
}

export interface JsonPatchOperation {
  readonly op: "add" | "replace";
  readonly path: string;
  readonly value: unknown;
}

export interface LocationTextPatchPayload {
  readonly targetFile: string;
  readonly locationId: string;
  readonly jsonPatch: readonly JsonPatchOperation[];
  readonly layoutDiff: {
    readonly addedTriggers: readonly TriggerPlacementSchema[];
    readonly updatedTriggers: readonly {
      readonly index: number;
      readonly id: string;
      readonly before: TriggerPlacementSchema;
      readonly after: TriggerPlacementSchema;
    }[];
    readonly updatedPortals: readonly {
      readonly index: number;
      readonly id: string;
      readonly before: PortalPlacementSchema;
      readonly after: PortalPlacementSchema;
    }[];
  };
  readonly i18n: {
    readonly pl: Record<string, string>;
    readonly en: Record<string, string>;
  };
}

export function sanitizeKeySegment(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Generates an unused i18n key following `narr_<locationId>_<beat>_<n>`.
 */
export function suggestNarrationKey(
  locationId: string,
  beat: string,
  existingKeys: ReadonlySet<string>
): string {
  const locPart = sanitizeKeySegment(locationId, "location");
  const beatPart = sanitizeKeySegment(beat, "beat");
  const prefix = `narr_${locPart}_${beatPart}`;

  let index = 1;
  while (existingKeys.has(`${prefix}_${index}`)) {
    index += 1;
  }
  return `${prefix}_${index}`;
}

export function suggestTriggerId(
  beat: string,
  existingIds: ReadonlySet<string>
): string {
  const beatPart = sanitizeKeySegment(beat, "narr");
  const prefix = `trig_${beatPart}`;

  let index = 1;
  while (existingIds.has(`${prefix}_${index}`)) {
    index += 1;
  }
  return `${prefix}_${index}`;
}

function toTriggerPlacement(entry: DraftTriggerEntry): TriggerPlacementSchema {
  return {
    id: entry.id,
    x: Math.round(entry.x),
    y: Math.round(entry.y),
    width: Math.round(entry.width),
    height: Math.round(entry.height),
    triggerId: entry.triggerId.trim(),
    ...(entry.oneShot ? { oneShot: true } : {}),
  };
}

function triggersEqual(a: TriggerPlacementSchema, b: TriggerPlacementSchema): boolean {
  return (
    a.id === b.id &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.triggerId === b.triggerId &&
    Boolean(a.oneShot) === Boolean(b.oneShot)
  );
}

/**
 * Builds a deterministic RFC 6902 JSON patch for `src/data/locations/<id>.json`
 * alongside PL/EN i18n entries without mutating the source blueprint.
 */
export function buildLocationTextPatch(
  blueprint: LocationJsonSchema,
  drafts: {
    readonly triggers: readonly DraftTriggerEntry[];
    readonly portals: readonly DraftPortalTextEntry[];
  }
): LocationTextPatchPayload {
  const jsonPatch: JsonPatchOperation[] = [];
  const addedTriggers: TriggerPlacementSchema[] = [];
  const updatedTriggers: Array<{
    readonly index: number;
    readonly id: string;
    readonly before: TriggerPlacementSchema;
    readonly after: TriggerPlacementSchema;
  }> = [];
  const updatedPortals: Array<{
    readonly index: number;
    readonly id: string;
    readonly before: PortalPlacementSchema;
    readonly after: PortalPlacementSchema;
  }> = [];
  const plDict: Record<string, string> = {};
  const enDict: Record<string, string> = {};

  const recordI18n = (key: string, plText: string, enText: string) => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;
    if (plText.trim()) plDict[trimmedKey] = plText.trim();
    if (enText.trim()) enDict[trimmedKey] = enText.trim();
  };

  const createdPlacements: TriggerPlacementSchema[] = [];
  for (const draft of drafts.triggers) {
    recordI18n(draft.triggerId, draft.plText, draft.enText);

    if (draft.kind === "create") {
      const next = toTriggerPlacement(draft);
      addedTriggers.push(next);
      createdPlacements.push(next);
      continue;
    }

    const index = draft.originalIndex;
    const before = index !== undefined ? blueprint.layout.triggers?.[index] : undefined;
    if (index === undefined || !before) continue;

    const after = toTriggerPlacement(draft);
    if (!triggersEqual(before, after)) {
      updatedTriggers.push({ index, id: after.id, before, after });
      jsonPatch.push({ op: "replace", path: `/layout/triggers/${index}`, value: after });
    }
  }

  if (createdPlacements.length > 0) {
    const hasTriggersArray = Array.isArray(blueprint.layout.triggers);
    if (!hasTriggersArray) {
      jsonPatch.push({ op: "add", path: "/layout/triggers", value: createdPlacements });
    } else {
      for (const item of createdPlacements) {
        jsonPatch.push({ op: "add", path: "/layout/triggers/-", value: item });
      }
    }
  }

  for (const portalDraft of drafts.portals) {
    recordI18n(portalDraft.labelKey, portalDraft.plText, portalDraft.enText);

    const before = blueprint.layout.portals?.[portalDraft.originalIndex];
    if (!before) continue;

    const nextLabelKey = portalDraft.labelKey.trim();
    const nextDefaultLabel = portalDraft.enText.trim() || portalDraft.defaultLabel;
    const after: PortalPlacementSchema = {
      ...before,
      ...(nextLabelKey ? { labelKey: nextLabelKey } : {}),
      ...(nextDefaultLabel ? { defaultLabel: nextDefaultLabel } : {}),
    };

    const changed =
      before.labelKey !== after.labelKey || before.defaultLabel !== after.defaultLabel;
    if (changed) {
      updatedPortals.push({
        index: portalDraft.originalIndex,
        id: after.id,
        before,
        after,
      });
      jsonPatch.push({
        op: "replace",
        path: `/layout/portals/${portalDraft.originalIndex}`,
        value: after,
      });
    }
  }

  return {
    targetFile: `src/data/locations/${blueprint.id}.json`,
    locationId: blueprint.id,
    jsonPatch,
    layoutDiff: {
      addedTriggers,
      updatedTriggers,
      updatedPortals,
    },
    i18n: {
      pl: plDict,
      en: enDict,
    },
  };
}

export function formatPatchJson(payload: LocationTextPatchPayload): string {
  return JSON.stringify(payload, null, 2);
}
