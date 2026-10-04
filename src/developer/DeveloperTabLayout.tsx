import React from "react";
import { Tabs, TabItem, Badge } from "@ui";

export interface DeveloperTabLayoutProps {
  tabItems: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  badgeLabel?: string;
  children: React.ReactNode;
}

/**
 * Pure layout presentation component for DeveloperTab.
 * Encapsulates container styling, navigation bar placement, and content area.
 */
export const DeveloperTabLayout: React.FC<DeveloperTabLayoutProps> = ({
  tabItems,
  activeTab,
  onTabChange,
  badgeLabel = "DEV SUITE",
  children,
}) => {
  return (
    <div id="tab-content-developer" className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* Subtab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/40 pb-3">
        <Tabs items={tabItems} activeId={activeTab} onChange={onTabChange} />
        <div className="flex items-center gap-2">
          <Badge variant="amber">{badgeLabel}</Badge>
        </div>
      </div>

      {/* Subtab View Panel */}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default DeveloperTabLayout;
