import { describe, it, expect } from "bun:test";
import React, { act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { UiTestProviders, IntegrationTestProviders } from "@test-utils/testProviders";
import { SkillDetailVM } from "@components/adapters";
import { SkillDetailsCard } from "../SkillDetailsCard";
import { SkillTreeConstellation } from "../SkillTreeConstellation";

describe("SkillDetailsCard", () => {
  it("displays inspection hint when no node is selected", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <SkillDetailsCard detail={null} />
      </IntegrationTestProviders>
    );

    expect(container.textContent).toContain("Wybierz gwiazdę z konstelacji");
    await unmount();
  });

  it("displays details, properties matrix, and action controls when a skill is selected", async () => {
    await cleanupDom();

    const mockDetail: SkillDetailVM = {
      id: "skill_fireball",
      nameKey: "spellSolarFireballName",
      descriptionKey: "spellSolarFireballDesc",
      iconName: "Flame",
      pointCost: 2,
      tier: 2,
      isUnlocked: false,
      canUnlock: true,
      isPrimary: false,
      isSecondary: false,
      isAction: true,
      isPassive: false,
      isAuto: false,
      properties: [
        {
          id: "manaCost",
          labelKey: "manaCostLabel",
          value: "20 PM",
          colorClass: "text-cyan-300",
        },
        {
          id: "damage",
          labelKey: "damageLabel",
          value: "+35",
          colorClass: "text-amber-300",
        },
      ],
      restriction: {
        characterName: "Valen",
        disciplineKey: "restrictionCharacterValen",
        hasPrerequisite: true,
        hasPoints: true,
        pointCost: 2,
        availablePoints: 4,
        isUnavailable: false,
      },
    };

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="pl">
        <SkillDetailsCard detail={mockDetail} />
      </IntegrationTestProviders>
    );

    expect(container.textContent).toContain("Słoneczna Kula Ognia");
    expect(container.textContent).toContain("Tier 2");
    expect(container.textContent).toContain("20 PM");
    expect(container.textContent).toContain("+35");
    expect(container.querySelector("#unlock-skill-btn")).not.toBeNull();

    await unmount();
  });

  it("reflects custom dynamic keybindings for equipped action skills", async () => {
    await cleanupDom();

    const mockUnlockedDetail: SkillDetailVM = {
      id: "skill_fireball",
      nameKey: "spellSolarFireballName",
      descriptionKey: "spellSolarFireballDesc",
      iconName: "Flame",
      pointCost: 2,
      tier: 2,
      isUnlocked: true,
      canUnlock: false,
      isPrimary: true,
      isSecondary: false,
      isAction: true,
      isPassive: false,
      isAuto: false,
      properties: [],
      restriction: {
        characterName: "Valen",
        disciplineKey: "restrictionCharacterValen",
        hasPrerequisite: true,
        hasPoints: true,
        pointCost: 2,
        availablePoints: 4,
        isUnavailable: false,
      },
    };

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <SkillDetailsCard
          detail={mockUnlockedDetail}
          primaryKey="Q"
          secondaryKey="E"
        />
      </IntegrationTestProviders>
    );

    const equipPrimaryBtn = container.querySelector("#equip-primary-spell-btn") as HTMLElement;
    const equipSecondaryBtn = container.querySelector("#equip-secondary-spell-btn") as HTMLElement;

    expect(equipPrimaryBtn).not.toBeNull();
    expect(equipSecondaryBtn).not.toBeNull();
    expect(equipPrimaryBtn.textContent).toContain("Q");
    expect(equipSecondaryBtn.textContent).toContain("E");

    await unmount();
  });
});
