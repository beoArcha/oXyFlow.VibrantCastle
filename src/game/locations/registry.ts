import { LocationId, LocationDefinition } from "./types";
import { courtyardLocation } from "./definitions/courtyard";
import { thornChasmLocation } from "./definitions/thorn_chasm";
import { ashenCatacombsLocation } from "./definitions/ashen_catacombs";
import { clocktowerLocation } from "./definitions/clocktower";
import { alchemistLibraryLocation } from "./definitions/alchemist_library";
import { aetherSanctuaryLocation } from "./definitions/aether_sanctuary";
import { grandBastionLocation } from "./definitions/grand_bastion";
import { eclipseCrownLocation } from "./definitions/eclipse_crown";

export const LOCATION_REGISTRY: Record<LocationId, LocationDefinition> = {
  courtyard: courtyardLocation,
  thorn_chasm: thornChasmLocation,
  ashen_catacombs: ashenCatacombsLocation,
  clocktower: clocktowerLocation,
  alchemist_library: alchemistLibraryLocation,
  aether_sanctuary: aetherSanctuaryLocation,
  grand_bastion: grandBastionLocation,
  eclipse_crown: eclipseCrownLocation,
};

export const ALL_LOCATIONS: LocationDefinition[] = [
  courtyardLocation,
  thornChasmLocation,
  ashenCatacombsLocation,
  clocktowerLocation,
  alchemistLibraryLocation,
  aetherSanctuaryLocation,
  grandBastionLocation,
  eclipseCrownLocation,
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
