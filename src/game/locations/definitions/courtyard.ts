import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import courtyardData from "@data/locations/courtyard.json";

export const courtyardLocation: LocationDefinition = LocationParser.parse(
  courtyardData as unknown as LocationJsonSchema
);

export default courtyardLocation;
