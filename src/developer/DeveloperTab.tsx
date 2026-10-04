import React, { useState, useMemo } from "react";
import { Wrench, Activity, Grid, ScrollText } from "lucide-react";
import { DeveloperTabLayout } from "./DeveloperTabLayout";
import { TesterSubTab } from "./subtabs/TesterSubTab";
import { DebugSubTab } from "./subtabs/DebugSubTab";
import { LogsSubTab } from "./subtabs/LogsSubTab";
import { AtlasMetaSubTab } from "./subtabs/AtlasMetaSubTab";
import { useI18n } from "@context/I18nContext";
import { useThrottledLogCount } from "./hooks/useThrottledLogs";
import { TabItem } from "@ui";

export type DeveloperSubTabId = "testing" | "debug" | "logs" | "atlas_slicer";

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

  // Dynamic log count badge with throttled updates
  const logCount = useThrottledLogCount(250);

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
      },
      {
        id: "logs",
        label: t("subtabLogs"),
        icon: <ScrollText size={13} />,
        badge: logCount > 0 ? String(logCount) : undefined,
      },
      {
        id: "atlas_slicer",
        label: t("subtabAtlasSlicer"),
        icon: <Grid size={13} />,
        badge: "v2",
      },
    ],
    [t, logCount]
  );

  return (
    <DeveloperTabLayout
      tabItems={subTabItems}
      activeTab={activeSubTab}
      onTabChange={(id: string) => setActiveSubTab(id as DeveloperSubTabId)}
      badgeLabel="DEV SUITE"
    >
      {activeSubTab === "testing" && <TesterSubTab />}
      {activeSubTab === "debug" && <DebugSubTab />}
      {activeSubTab === "logs" && <LogsSubTab />}
      {activeSubTab === "atlas_slicer" && (
        <AtlasMetaSubTab onNavigateToLogs={() => setActiveSubTab("logs")} />
      )}
    </DeveloperTabLayout>
  );
};

export default DeveloperTab;
