import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import { resolveLocationParallaxLayers } from "../parallaxLayerRegistry";
import aetherSanctuaryData from "@data/locations/aether_sanctuary.json";

export const aetherSanctuaryLocation: LocationDefinition = resolveLocationParallaxLayers(
  LocationParser.parse(aetherSanctuaryData as unknown as LocationJsonSchema)
);

export default aetherSanctuaryLocation;
