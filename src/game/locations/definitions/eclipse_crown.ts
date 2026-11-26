import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import { resolveLocationParallaxLayers } from "../parallaxLayerRegistry";
import eclipseCrownData from "@data/locations/eclipse_crown.json";

export const eclipseCrownLocation: LocationDefinition = resolveLocationParallaxLayers(
  LocationParser.parse(eclipseCrownData as unknown as LocationJsonSchema)
);

export default eclipseCrownLocation;
