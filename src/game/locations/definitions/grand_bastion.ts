import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import { resolveLocationParallaxLayers } from "../parallaxLayerRegistry";
import grandBastionData from "@data/locations/grand_bastion.json";

export const grandBastionLocation: LocationDefinition = resolveLocationParallaxLayers(
  LocationParser.parse(grandBastionData as unknown as LocationJsonSchema)
);

export default grandBastionLocation;
