import { LocationDefinition } from "../types";
import { LocationParser } from "../parser/locationParser";
import { LocationJsonSchema } from "../schema/locationSchema";
import eclipseCrownData from "@data/locations/eclipse_crown.json";

export const eclipseCrownLocation: LocationDefinition = LocationParser.parse(
  eclipseCrownData as unknown as LocationJsonSchema
);

export default eclipseCrownLocation;
