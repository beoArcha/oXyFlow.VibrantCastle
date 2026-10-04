import { LocationId, LocationDefinition } from "./types";
import { courtyardLocation } from "./definitions/courtyard";
import { thornChasmLocation } from "./definitions/thorn_chasm";
import { clocktowerLocation } from "./definitions/clocktower";
import { aetherSanctuaryLocation } from "./definitions/aether_sanctuary";
import { grandBastionLocation } from "./definitions/grand_bastion";

export const LOCATION_REGISTRY: Record<LocationId, LocationDefinition> = {
  courtyard: courtyardLocation,
  thorn_chasm: thornChasmLocation,
  clocktower: clocktowerLocation,
  aether_sanctuary: aetherSanctuaryLocation,
  grand_bastion: grandBastionLocation,
};

export const ALL_LOCATIONS: LocationDefinition[] = [
  courtyardLocation,
  thornChasmLocation,
  clocktowerLocation,
  aetherSanctuaryLocation,
  grandBastionLocation,
];

export function getAllLocations(): LocationDefinition[] {
  return ALL_LOCATIONS;
}

export function getLocation(id: LocationId): LocationDefinition {
  return LOCATION_REGISTRY[id] || courtyardLocation;
}

export function getNextLocation(currentId: LocationId): LocationDefinition {
  const current = getLocation(currentId);
  if (current.nextLocationId && LOCATION_REGISTRY[current.nextLocationId]) {
    return LOCATION_REGISTRY[current.nextLocationId];
  }
  return courtyardLocation;
}
