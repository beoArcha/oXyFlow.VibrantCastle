import { LanguageCode, DialoguesI18n } from "../types";

export const dialoguesTranslations: Record<LanguageCode, DialoguesI18n> = {
  pl: {
    ravenCorvusGreeting: "Corvus (Kruk): Kraa! Zegar na szczycie wieży zaczął bić w odwrotną stronę. Uważaj na zegarowe automaty!",
    catAmberGreeting: "Bursztynek (Kot): Miau... Pod posadzką wyczuwam pulsujący Aether. Użyj tarczy pryzmatycznej, by przejść przez ciernie.",
    sageBastionGreeting: "Mędrzec Bastionu: Witajcie, Strażnicy. Słoneczny Bastion potrzebuje Waszego oręża i czystego umysłu.",
  },
  en: {
    ravenCorvusGreeting: "Corvus (Raven): Kraa! The summit clock is ticking in reverse. Beware the rogue clockwork automatons!",
    catAmberGreeting: "Amber (Cat): Meow... The subterranean aether is surging. Use your prismatic shield to traverse the thorn bed safely.",
    sageBastionGreeting: "Bastion Sage: Greetings, Guardians. The Sunlit Bastion requires both your blades and serene minds.",
  },
};
