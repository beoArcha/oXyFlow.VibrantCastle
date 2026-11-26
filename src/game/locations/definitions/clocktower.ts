import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import { resolveLocationParallaxLayers } from "../parallaxLayerRegistry";
import clocktowerData from "@data/locations/clocktower.json";

export const clocktowerLocation: LocationDefinition = resolveLocationParallaxLayers(
  LocationParser.parse(clocktowerData as unknown as LocationJsonSchema)
);

export default clocktowerLocation;
