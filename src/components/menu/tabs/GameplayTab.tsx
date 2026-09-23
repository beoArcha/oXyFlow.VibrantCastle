import React, { useId } from "react";
import {
  Users,
  User,
  Save,
  RotateCcw,
  Sparkles,
  FolderOpen,
  Layout,
  HardDrive,
  FileJson,
  Check,
  Subtitles,
  HelpCircle,
  Backpack,
  Compass,
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "../../ui";
import { useGame } from "../../../hooks/useGame";
import { useI18n } from "../../../hooks/useI18n";
import { cn } from "../../../lib/utils";

export const GameplayTab: React.FC = () => {
  const fileInputId = useId();
  const settingsFileInputId = useId();

  const {
    isTwoPlayer,
    setTwoPlayer,
    restart,
    saveGame,
    loadGame,
    saveToLocalStorage,
    loadFromLocalStorage,
    hudSettings,
    setHudSettings,
    exportSettingsToFile,
    importSettingsFromFile,
    resetSettingsToDefaults,
  } = useGame();

  const { t, language } = useI18n();
  const isPl = language === "pl";

  return (
    <div id="tab-content-gameplay" className="flex flex-col gap-5 animate-in fade-in duration-150">
      {/* 1. Mode Selector: 1P vs 2P Co-Op */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Users className="w-4 h-4 text-amber-400" />}>
              {t("gameMode")}
            </CardTitle>
            <Badge variant="amber">
              {isTwoPlayer ? (isPl ? "Lokalny Co-Op" : "Local Co-Op") : (isPl ? "Pojedynczy Gracz" : "Single Player")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1P Option Card */}
            <div
              onClick={() => setTwoPlayer(false)}
              className={cn(
                "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3",
                !isTwoPlayer
                  ? "bg-[#2d140a] border-amber-500 shadow-md shadow-amber-950/60 ring-1 ring-amber-400/40"
                  : "bg-[#140602] border-[#4a200e] hover:border-amber-700/60 hover:bg-[#1f0a04]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border",
                  !isTwoPlayer
                    ? "bg-amber-600/30 border-amber-400 text-amber-300"
                    : "bg-black/40 border-stone-800 text-stone-500"
                )}>
                  <User size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-200">{t("play1P")}</div>
                  <div className="text-xs text-stone-400">
                    {isPl ? "Valen (Wojownik Krwi) - Sterowanie solo" : "Valen (Blood Knight) - Solo Control"}
                  </div>
                </div>
              </div>
              {!isTwoPlayer && <Check size={18} className="text-amber-400 shrink-0" />}
            </div>

            {/* 2P Option Card */}
            <div
              onClick={() => setTwoPlayer(true)}
              className={cn(
                "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3",
                isTwoPlayer
                  ? "bg-[#2d140a] border-amber-500 shadow-md shadow-amber-950/60 ring-1 ring-amber-400/40"
                  : "bg-[#140602] border-[#4a200e] hover:border-amber-700/60 hover:bg-[#1f0a04]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border",
                  isTwoPlayer
                    ? "bg-cyan-600/30 border-cyan-400 text-cyan-300"
                    : "bg-black/40 border-stone-800 text-stone-500"
                )}>
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-200">{t("play2P")}</div>
                  <div className="text-xs text-stone-400">
                    {isPl ? "Valen & Lyra - Wspólna gra na 1 ekranie" : "Valen & Lyra - Local Split Controls"}
                  </div>
                </div>
              </div>
              {isTwoPlayer && <Check size={18} className="text-amber-400 shrink-0" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Save & Load Game Progress */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Save className="w-4 h-4 text-amber-400" />}>
            {t("saveLoadTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Browser Storage Column */}
            <div className="p-3.5 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-col justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <HardDrive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    {isPl ? "Pamięć Przeglądarki (LocalStorage)" : "Browser Storage (LocalStorage)"}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {isPl ? "Błyskawiczny zapis postaci, przedmiotów i lokacji w pamięci." : "Quick save state directly in your local browser cache."}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  id="save-local-btn"
                  variant="primary"
                  size="sm"
                  icon={<Save size={13} />}
                  onClick={saveToLocalStorage}
                >
                  {isPl ? "Zapisz Stan" : "Quick Save"}
                </Button>
                <Button
                  id="load-local-btn"
                  variant="secondary"
                  size="sm"
                  icon={<FolderOpen size={13} />}
                  onClick={() => loadFromLocalStorage()}
                >
                  {isPl ? "Wczytaj Stan" : "Quick Load"}
                </Button>
              </div>
            </div>

            {/* External JSON File Column */}
            <div className="p-3.5 rounded-xl bg-[#140602] border border-[#5c2d18] flex flex-col justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <FileJson className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    {isPl ? "Kopia Zewnętrzna (.JSON)" : "External JSON File Backup"}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {isPl ? "Pobierz lub wgraj plik zapisu pomiędzy różnymi urządzeniami." : "Export or import your save file across different devices."}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  id="save-game-btn"
                  variant="secondary"
                  size="sm"
                  icon={<Save size={13} />}
                  onClick={saveGame}
                >
                  {isPl ? "Pobierz .JSON" : "Export Save"}
                </Button>

                <label
                  htmlFor={fileInputId}
                  className="inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none bg-[#1c0c07] hover:bg-[#321509] text-[#fed7aa] border border-[#5c2d18] hover:border-[#8d4325] px-2.5 py-1.5 text-xs font-semibold gap-1.5 rounded-lg shadow-md active:translate-y-px text-center"
                >
                  <FolderOpen size={13} className="text-amber-400 shrink-0" />
                  <span>{isPl ? "Wgraj .JSON" : "Import Save"}</span>
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={loadGame}
                  />
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. HUD & Interface Switches */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Layout className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Elementy Interfejsu (HUD)" : "Interface & HUD Display"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {/* Row 1: RPG Quick Buttons */}
          <div className="p-3 rounded-xl bg-[#140602] border border-[#4a200e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Backpack size={16} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-200">
                  {isPl ? "Przyciski Ekwipunku i Umiejętności [I] / [K]" : "Inventory & Skill Tree HUD Buttons [I] / [K]"}
                </div>
                <div className="text-[11px] text-stone-400">
                  {isPl ? "Wyświetla dotykowe/klikane skróty na ekranie HUD." : "Shows clickable HUD shortcuts on screen."}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHudSettings({ showRpgButtons: !hudSettings.showRpgButtons })}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none border",
                hudSettings.showRpgButtons
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/50 text-stone-400 border-stone-800"
              )}
            >
              {hudSettings.showRpgButtons ? (isPl ? "WŁĄCZONE" : "ON") : (isPl ? "WYŁĄCZONE" : "OFF")}
            </button>
          </div>

          {/* Row 2: Controls hints on HUD */}
          <div className="p-3 rounded-xl bg-[#140602] border border-[#4a200e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={16} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-200">
                  {isPl ? "Pasek Skrótów Klawiszowych (HUD Bar)" : "Hotkey Hints Overlay Bar"}
                </div>
                <div className="text-[11px] text-stone-400">
                  {isPl ? "Przypomnienie o klawiszach [P] Pauza, [H] Pomoc, [M] Menu." : "Shows status bar with [P] Pause, [H] Hints, [M] Menu."}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHudSettings({ showControlsHint: !hudSettings.showControlsHint })}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none border",
                hudSettings.showControlsHint
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/50 text-stone-400 border-stone-800"
              )}
            >
              {hudSettings.showControlsHint ? (isPl ? "WŁĄCZONE" : "ON") : (isPl ? "WYŁĄCZONE" : "OFF")}
            </button>
          </div>

          {/* Row 3: Narrator subtitles */}
          <div className="p-3 rounded-xl bg-[#140602] border border-[#4a200e] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Subtitles size={16} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-200">
                  {isPl ? "Napisy i Wskazówki Narratora" : "Narrator Subtitles & Dialogue"}
                </div>
                <div className="text-[11px] text-stone-400">
                  {isPl ? "Klimatyczne wstępy fabularne i ostrzeżenia w trakcie gry." : "Atmospheric story narration and gameplay commentary."}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHudSettings({ showNarratorSubtitles: !hudSettings.showNarratorSubtitles })}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none border",
                hudSettings.showNarratorSubtitles
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/50 text-stone-400 border-stone-800"
              )}
            >
              {hudSettings.showNarratorSubtitles ? (isPl ? "WŁĄCZONE" : "ON") : (isPl ? "WYŁĄCZONE" : "OFF")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Combat Tips & Mechanics */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
            {t("crouchAimTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-stone-300 space-y-2.5 leading-relaxed">
          <div className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18]">
            <strong className="text-amber-300 block mb-1 font-serif text-sm">{t("dashAction")}:</strong>
            <p className="text-stone-300">{t("slideDescription")}</p>
            <p className="text-stone-400 mt-1">{t("backstepDescription")}</p>
          </div>

          <div className="p-3 rounded-xl bg-[#140602] border border-[#5c2d18]">
            <strong className="text-amber-300 block mb-1 font-serif text-sm">{t("directionalAimingTitle")}:</strong>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-stone-300">
              <li className="flex items-center gap-1.5"><Compass size={12} className="text-amber-400 shrink-0" />{t("aimStraightUp")}</li>
              <li className="flex items-center gap-1.5"><Compass size={12} className="text-amber-400 shrink-0" />{t("aim45Up")}</li>
              <li className="flex items-center gap-1.5"><Compass size={12} className="text-amber-400 shrink-0" />{t("aim45Down")}</li>
              <li className="flex items-center gap-1.5"><Compass size={12} className="text-amber-400 shrink-0" />{t("aimStraightDown")}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 5. Configuration Profile & Restart Bar */}
      <div className="p-3.5 rounded-xl bg-[#140602] border border-[#4a200e] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Save size={13} />}
            onClick={exportSettingsToFile}
            title={isPl ? "Eksportuj plik profilu konfiguracji" : "Export settings file"}
          >
            {isPl ? "Eksport Ustawień" : "Export Settings"}
          </Button>

          <label
            htmlFor={settingsFileInputId}
            className="inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none bg-[#1c0c07] hover:bg-[#321509] text-stone-300 border border-stone-800 hover:border-amber-600 px-3 py-1.5 text-xs font-semibold gap-1.5 rounded-lg shadow-md active:translate-y-px text-center"
          >
            <FolderOpen size={13} className="text-amber-400 shrink-0" />
            <span>{isPl ? "Import Ustawień" : "Import Settings"}</span>
            <input
              id={settingsFileInputId}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  await importSettingsFromFile(e.target.files[0]);
                }
              }}
            />
          </label>

          <Button
            size="sm"
            variant="secondary"
            icon={<RotateCcw size={13} />}
            onClick={resetSettingsToDefaults}
          >
            {isPl ? "Domyślne" : "Defaults"}
          </Button>
        </div>

        <Button
          id="restart-level-btn"
          variant="secondary"
          size="sm"
          icon={<RotateCcw size={13} />}
          onClick={restart}
          className="border-amber-700/60 hover:border-amber-500"
        >
          {t("restartLocation")}
        </Button>
      </div>
    </div>
  );
};

export default GameplayTab;
