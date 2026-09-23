import React, { useState, useMemo } from "react";
import { Wrench, Activity, Grid } from "lucide-react";
import { DeveloperTabLayout } from "./DeveloperTabLayout";
import { TesterSubTab } from "./subtabs/TesterSubTab";
import { useI18n } from "../../hooks/useI18n";
import { TabItem } from "../ui/Tabs";

export type DeveloperSubTabId = "testing" | "debug" | "atlas_slicer";

/**
 * DeveloperTab Orchestrator Component.
 *
 * Responsibilities:
 * - Pure orchestrator of developer workspace state and active subtab view.
 * - Zero direct HTML elements and zero CSS classes (delegated to DeveloperTabLayout and subcomponents).
 */
export const DeveloperTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<DeveloperSubTabId>("testing");
  const { t } = useI18n();

  const subTabItems: TabItem[] = useMemo(
    () => [
      {
        id: "testing",
        label: t("subtabTesting"),
        icon: <Wrench size={13} />,
      },
      {
        id: "debug",
        label: t("subtabDebug"),
        icon: <Activity size={13} />,
        badge: "v2",
      },
      {
        id: "atlas_slicer",
        label: t("subtabAtlasSlicer"),
        icon: <Grid size={13} />,
        badge: "v2",
      },
    ],
    [t]
  );

  return (
    <DeveloperTabLayout
      tabItems={subTabItems}
      activeTab={activeSubTab}
      onTabChange={(id: string) => setActiveSubTab(id as DeveloperSubTabId)}
      badgeLabel="DEV SUITE"
    >
      {activeSubTab === "testing" && <TesterSubTab />}
    </DeveloperTabLayout>
  );
};

export default DeveloperTab;
