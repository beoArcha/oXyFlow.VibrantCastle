import { ISectionParser } from "./ISectionParser";
import { IMetaInfo, EntityType } from "../types";

export class MetaInfoParser implements ISectionParser<IMetaInfo> {
  public readonly sectionName = "info";

  public canParse(raw: unknown): boolean {
    return typeof raw === "object" && raw !== null;
  }

  public parse(raw: unknown): IMetaInfo {
    if (!this.canParse(raw)) {
      return {
        id: "unknown",
        entityType: "humanoid",
        version: "1.0",
        description: "",
      };
    }

    const doc = raw as Record<string, any>;
    const id = doc.id || doc.characterId || doc.entityId || "unnamed_entity";
    const entityType: EntityType = doc.entityType || "humanoid";
    const version = String(doc.version || "1.0");
    const description = String(doc.description || "");

    return {
      id,
      entityType,
      version,
      description,
      characterId: doc.characterId,
      entityId: doc.entityId,
    };
  }
}

export const defaultMetaInfoParser = new MetaInfoParser();
