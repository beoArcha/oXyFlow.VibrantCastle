import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import clocktowerData from "@data/locations/clocktower.json";

export const clocktowerLocation: LocationDefinition = LocationParser.parse(
  clocktowerData as unknown as LocationJsonSchema
);

export default clocktowerLocation;
