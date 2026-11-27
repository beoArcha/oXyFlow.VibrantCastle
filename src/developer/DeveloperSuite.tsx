import React, { useState, useMemo } from "react";
import { Tabs, TabItem } from "@ui";
import { useI18n } from "@context/I18nContext";
import {
  DEV_TOOL_REGISTRY,
  DevToolId,
  getDevToolDefinition,
} from "./registry/devToolRegistry";

export interface DeveloperSuiteProps {
  readonly initialTool?: DevToolId;
}

/**
 * Unified 5-subtab Creation & Developer Suite rendered both inside the standalone
 * Creation modal and inside the Menu -> Developer tab.
 */
export const DeveloperSuite: React.FC<DeveloperSuiteProps> = ({
  initialTool = DevToolId.AtlasSlicer,
}) => {
  const { t } = useI18n();
  const [activeToolId, setActiveToolId] = useState<DevToolId>(initialTool);

  const tabItems = useMemo<TabItem<DevToolId>[]>(
    () =>
      DEV_TOOL_REGISTRY.map((entry) => ({
        id: entry.id,
        label: t(entry.labelKey),
        icon: entry.icon,
      })),
    [t]
  );

  const activeTool = useMemo(
    () => getDevToolDefinition(activeToolId),
    [activeToolId]
  );

  return (
    <div id="tab-content-developer" className="flex flex-col gap-4">
      <Tabs<DevToolId>
        id="developer-suite-tabs"
        items={tabItems}
        activeId={activeToolId}
        onChange={setActiveToolId}
      />
      <div>
        {activeTool.render({ navigateToTool: setActiveToolId })}
      </div>
    </div>
  );
};

DeveloperSuite.displayName = "DeveloperSuite";
export default DeveloperSuite;
