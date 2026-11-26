import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import { resolveLocationParallaxLayers } from "../parallaxLayerRegistry";
import alchemistLibraryData from "@data/locations/alchemist_library.json";

export const alchemistLibraryLocation: LocationDefinition = resolveLocationParallaxLayers(
  LocationParser.parse(alchemistLibraryData as unknown as LocationJsonSchema)
);

export default alchemistLibraryLocation;
