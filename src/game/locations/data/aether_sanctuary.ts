import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import aetherSanctuaryData from "./aether_sanctuary.json";

/**
 * Aether Sanctuary Location parsed directly from aether_sanctuary.json blueprint.
 * Features:
 * - Extensible JSON schema with i18n keys
 * - Floating masonry sky islands with celestial void hazard abyss below
 * - Moving crystal platforms and vertical celestial elevator
 * - Sanctuary Gateway lever unlocking the Celestial Barrier
 * - Castlevania portals: return to Clocktower & forward to Grand Bastion
 */
export const aetherSanctuaryLocation: LocationDefinition = LocationParser.parse(
  aetherSanctuaryData as unknown as LocationJsonSchema
);

export default aetherSanctuaryLocation;

