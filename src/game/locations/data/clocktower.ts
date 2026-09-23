import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import clocktowerData from "./clocktower.json";

/**
 * Clocktower Location parsed directly from clocktower.json blueprint.
 * Features:
 * - Extensible JSON schema with i18n keys
 * - Multi-tiered vertical tower layout with dual moving elevators
 * - Angled target testing platforms (45° and 90° magic aiming)
 * - Clockwork Gear interactive lever and Spire Gate
 * - Castlevania portals: return to Thorn Chasm & forward to Aether Sanctuary
 */
export const clocktowerLocation: LocationDefinition = LocationParser.parse(
  clocktowerData as unknown as LocationJsonSchema
);

export default clocktowerLocation;

