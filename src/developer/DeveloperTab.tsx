import React, { useState, useMemo } from "react";
import { Wrench, Activity, Grid, ScrollText, Database } from "lucide-react";
import { DeveloperTabLayout } from "./DeveloperTabLayout";
import { TesterSubTab } from "./subtabs/TesterSubTab";
import { DebugSubTab } from "./subtabs/DebugSubTab";
import { LogsSubTab } from "./subtabs/LogsSubTab";
import { AtlasMetaSubTab } from "./subtabs/AtlasMetaSubTab";
import { DataStudioSubTab } from "./subtabs/DataStudioSubTab";
import { useI18n } from "@context/I18nContext";
import { useThrottledLogCount } from "./hooks/useThrottledLogs";
import { TabItem } from "@ui";

export type DeveloperSubTabId = "testing" | "debug" | "logs" | "atlas_slicer" | "data_studio";

export const DeveloperTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<DeveloperSubTabId>("testing");
  const { t } = useI18n();

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
      {
        id: "data_studio",
        label: t("subtabDataStudio"),
        icon: <Database size={13} />,
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
      {activeSubTab === "data_studio" && <DataStudioSubTab />}
    </DeveloperTabLayout>
  );
};

export default DeveloperTab;
