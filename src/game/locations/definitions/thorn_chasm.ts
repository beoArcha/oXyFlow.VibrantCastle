import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import thornChasmData from "@data/locations/thorn_chasm.json";

export const thornChasmLocation: LocationDefinition = LocationParser.parse(
  thornChasmData as unknown as LocationJsonSchema
);

export default thornChasmLocation;
