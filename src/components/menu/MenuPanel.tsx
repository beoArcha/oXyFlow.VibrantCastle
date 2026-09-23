import React, { useState } from "react";
import {
  Play,
  Monitor,
  Keyboard,
  Gamepad as GamepadIcon,
  Volume2,
  MapPin,
  BarChart3,
  Wrench,
} from "lucide-react";
import { PlayerId, InputMap } from "../../game/types";
import { Tabs } from "../ui";
import KeyboardMapper from "../controls/KeyboardMapper";
import GamepadMapper from "../controls/GamepadMapper";
import StatsPanel from "./StatsPanel";
import { GameplayTab, LocationsTab, DisplayTab, AudioTab, TesterTab } from "./tabs";
import { useI18n } from "../../hooks/useI18n";

export interface MenuPanelProps {
  onStartRebind?: (action: keyof InputMap, player: PlayerId, label: string) => void;
}

export const MenuPanel: React.FC<MenuPanelProps> = ({ onStartRebind }) => {
  const [activeTab, setActiveTab] = useState<string>("gameplay");
  const { t } = useI18n();

  const tabItems = [
    { id: "gameplay", label: t("tabGameplay"), icon: <Play size={14} /> },
    { id: "stats", label: t("tabStats"), icon: <BarChart3 size={14} /> },
    { id: "locations", label: t("tabLocations"), icon: <MapPin size={14} /> },
    { id: "keyboard", label: t("tabKeyboard"), icon: <Keyboard size={14} /> },
    { id: "gamepad", label: t("tabGamepad"), icon: <GamepadIcon size={14} /> },
    { id: "display", label: t("tabDisplay"), icon: <Monitor size={14} /> },
    { id: "audio", label: t("tabAudio"), icon: <Volume2 size={14} /> },
    { id: "tester", label: t("tabTester"), icon: <Wrench size={14} /> },
  ];

  return (
    <div id="settings-menu-panel" className="flex flex-col gap-4">
      {/* Navigation Tabs */}
      <Tabs items={tabItems} activeId={activeTab} onChange={setActiveTab} />

      {/* Tab Panels with smooth fade transition */}
      <div className="flex-1">
        {activeTab === "gameplay" && <GameplayTab />}
        {activeTab === "stats" && <StatsPanel />}
        {activeTab === "locations" && <LocationsTab />}
        {activeTab === "keyboard" && onStartRebind && (
          <div className="animate-in fade-in duration-150">
            <KeyboardMapper onStartRebind={onStartRebind} />
          </div>
        )}
        {activeTab === "gamepad" && (
          <div className="animate-in fade-in duration-150">
            <GamepadMapper />
          </div>
        )}
        {activeTab === "display" && <DisplayTab />}
        {activeTab === "audio" && <AudioTab />}
        {activeTab === "tester" && <TesterTab />}
      </div>
    </div>
  );
};

export default MenuPanel;
