import { LanguageCode, ReservedI18n } from "../types";

export type { ReservedI18n };

export const reservedTranslations: Record<LanguageCode, ReservedI18n> = {
  pl: {
    reservedComingSoon: "Wkrótce",
    reservedAttributesTitle: "Atrybuty",
    reservedAttributesDesc: "Sześć atrybutów postaci w stylu D&D, każdy z własnym priorytetem rozwoju.",
    reservedWorldsTitle: "Świat 2-8 / mapy 2-8",
    reservedWorldsDesc: "Kampania 8×8: osiem światów po osiem map każdy.",
  },
  en: {
    reservedComingSoon: "Coming soon",
    reservedAttributesTitle: "Attributes",
    reservedAttributesDesc: "Six D&D-style character attributes, each with its own growth priority.",
    reservedWorldsTitle: "World 2-8 / maps 2-8",
    reservedWorldsDesc: "An 8×8 campaign: eight worlds of eight maps each.",
  },
};
