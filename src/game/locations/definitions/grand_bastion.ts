import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import grandBastionData from "@data/locations/grand_bastion.json";

export const grandBastionLocation: LocationDefinition = LocationParser.parse(
  grandBastionData as unknown as LocationJsonSchema
);

export default grandBastionLocation;
