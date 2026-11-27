import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import ashenCatacombsData from "@data/locations/ashen_catacombs.json";

export const ashenCatacombsLocation: LocationDefinition = LocationParser.parse(
  ashenCatacombsData as unknown as LocationJsonSchema
);

export default ashenCatacombsLocation;
