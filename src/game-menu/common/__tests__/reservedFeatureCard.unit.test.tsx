import { describe, it, expect } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { UiTestProviders } from "@test-utils/testProviders";
import { ReservedFeatureCard } from "../ReservedFeatureCard";
import type { LanguageCode } from "@i18n/types";

const RESERVED_CARDS = [
  {
    name: "attributes",
    titleKey: "reservedAttributesTitle",
    descriptionKey: "reservedAttributesDesc",
    titles: { pl: "Atrybuty", en: "Attributes" },
  },
  {
    name: "worlds",
    titleKey: "reservedWorldsTitle",
    descriptionKey: "reservedWorldsDesc",
    titles: { pl: "Świat 2-8 / mapy 2-8", en: "World 2-8 / maps 2-8" },
  },
] as const;

describe("ReservedFeatureCard", () => {
  for (const card of RESERVED_CARDS) {
    for (const lang of ["pl", "en"] as const satisfies readonly LanguageCode[]) {
      it(`renders the ${card.name} title and is not interactive in ${lang}`, async () => {
        await cleanupDom();

        const { container, unmount } = await renderIntoDom(
          <UiTestProviders defaultLanguage={lang}>
            <ReservedFeatureCard
              titleKey={card.titleKey}
              descriptionKey={card.descriptionKey}
            />
          </UiTestProviders>
        );

        const root = container.querySelector('[role="group"]');
        expect(root).not.toBeNull();
        expect(root?.getAttribute("aria-disabled")).toBe("true");
        expect(root?.textContent).toContain(card.titles[lang]);
        expect(root?.textContent).toContain(lang === "pl" ? "Wkrótce" : "Coming soon");

        // No focusable or clickable descendants.
        expect(container.querySelectorAll("button, a, input, [tabindex]").length).toBe(0);

        await unmount();
      });
    }
  }
});
