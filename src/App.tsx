import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HelpCircle,
  Menu as MenuIcon,
  MapPin,
  User,
  Backpack,
  BookOpen,
  Settings,
  Layers,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import { APP_CONFIG } from "@/app/appConfig";
import { DeveloperSuiteSlot } from "@/app/developerSuiteSlot";
import { I18nProvider, useI18n } from "@context/I18nContext";
import { GameProvider, useControls, useGameSession } from "@context/GameContext";
import { useModalCoordinator } from "@game-menu/menu/hooks/useModalCoordinator";
import {
  ModalId,
  getHeaderModalShortcuts,
  isGameModal,
  type ModalIconKey,
} from "@game-menu/modal";
import { KeyRebindDialog, useKeyRebind, useMenuGamepad } from "@game-menu/controls";
import { GameLayout, GameModalHost, useAppHotkeys } from "@game-menu/layout";
import { LanguageSelector } from "@game-menu/common";
import { HUDOverlay } from "@hud";
import { GameErrorBoundary, Toast, useToast } from "@ui";
import { formatGameDiagnosticReport } from "@lib/logger";

const HEADER_SHORTCUT_ICONS: Record<ModalIconKey, React.ReactNode> = {
  help: <HelpCircle size={14} />,
  menu: <MenuIcon size={14} />,
  locations: <MapPin size={14} />,
  character: <User size={14} />,
  inventory: <Backpack size={14} />,
  skillTree: <BookOpen size={14} />,
  settings: <Settings size={14} />,
  creation: <Layers size={14} />,
};

function GameScreen() {
  const { t } = useI18n();
  const {
    currentLocation,
    isPaused,
    isAudioInitialized,
    initializeAudio,
    setPaused,
    togglePause,
  } = useGameSession();
  const { toastMessage, showToast } = useToast();

  const { bindingTarget, isRebinding, startRebind, cancelRebind } = useKeyRebind({
    onSuccess: showToast,
  });

  const coordinator = useModalCoordinator({ setPaused, togglePause });
  const { setMenuCapture, connectedGamepads } = useControls();
  const [showLegend, setShowLegend] = useState(true);
  const isGameDialogOpen = isGameModal(coordinator.modalManager.activeModal);

  useEffect(() => {
    setMenuCapture(isGameDialogOpen);
    return () => setMenuCapture(false);
  }, [isGameDialogOpen, setMenuCapture]);

  useAppHotkeys({
    modalManager: coordinator.modalManager,
    onToggleModal: coordinator.toggleModal,
    onCloseModal: coordinator.closeModal,
    onOpenDefaultEscapeModal: coordinator.openLastGameModal,
    onTogglePause: coordinator.togglePause,
    onStepL1Tab: coordinator.stepGameTab,
    onStepL2Tab: coordinator.stepSubTab,
    isRebinding,
  });

  useMenuGamepad({
    isGameDialogOpen,
    isAnyDialogOpen: coordinator.modalManager.isAnyModalOpen,
    isRebinding,
    onOpenGameDialog: coordinator.openLastGameModal,
    onClose: coordinator.closeModal,
    onStepL1Tab: coordinator.stepGameTab,
    onStepL2Tab: coordinator.stepSubTab,
    onToggleLegend: () => setShowLegend((prev) => !prev),
    onCancelRebind: cancelRebind,
  });

  const allHeaderShortcuts = useMemo(() => getHeaderModalShortcuts(), []);
  const centerShortcuts = useMemo(
    () => allHeaderShortcuts.filter((def) => def.id !== ModalId.Menu),
    [allHeaderShortcuts]
  );
  const menuShortcut = useMemo(
    () => allHeaderShortcuts.find((def) => def.id === ModalId.Menu),
    [allHeaderShortcuts]
  );

  const currentLocationName = currentLocation ? t(currentLocation.nameKey) : "";

  const renderDeveloperSuite = useCallback(() => <DeveloperSuiteSlot />, []);

  return (
    <GameLayout.Root onInteract={initializeAudio}>
      <GameLayout.Header>
        <GameLayout.Brand
          title={t(APP_CONFIG.i18nKeys.title)}
          locationName={currentLocationName}
        />

        <GameLayout.HotkeyGroup ariaLabel={t("gameControls")}>
          {centerShortcuts.map((def) => {
            const cfg = def.headerShortcut!;
            return (
              <GameLayout.HotkeyHint
                key={def.id}
                hotkey={cfg.hotkeyLabel}
                label={t(cfg.labelKey)}
                icon={HEADER_SHORTCUT_ICONS[cfg.iconKey]}
                labelVisibility="xl"
                hotkeyVisibility="xl"
                onClick={() => coordinator.openModal(def.id)}
              />
            );
          })}
        </GameLayout.HotkeyGroup>

        <GameLayout.Actions>
          <GameLayout.HotkeyHint
            id="top-pause-btn"
            hotkey="P"
            label={isPaused ? t("resume") : t("pause")}
            tooltip={`${isPaused ? t("resume") : t("pause")} [P]`}
            icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
            active={isPaused}
            ariaPressed={isPaused}
            labelVisibility="md"
            hotkeyVisibility="lg"
            onClick={coordinator.togglePause}
          />

          {!isAudioInitialized && (
            <GameLayout.HotkeyHint
              id="top-audio-btn"
              label={t("headerAudioShort")}
              tooltip={t("clickToEnableSound")}
              icon={<Volume2 size={14} />}
              emphasized
              labelVisibility="xl"
              onClick={initializeAudio}
            />
          )}

          <LanguageSelector variant="pills" showIcon={false} />

          {menuShortcut?.headerShortcut && (
            <GameLayout.HotkeyHint
              id="top-menu-btn"
              hotkey={menuShortcut.headerShortcut.hotkeyLabel}
              label={t(menuShortcut.headerShortcut.labelKey)}
              icon={HEADER_SHORTCUT_ICONS[menuShortcut.headerShortcut.iconKey]}
              emphasized
              labelVisibility="sm"
              onClick={() => coordinator.openModal(ModalId.Menu)}
            />
          )}
        </GameLayout.Actions>
      </GameLayout.Header>

      <Toast message={toastMessage} />

      <GameLayout.Main>
        <HUDOverlay
          isModalOpen={coordinator.modalManager.isAnyModalOpen}
          onOpenInventory={() => coordinator.openModal(ModalId.Inventory)}
          onOpenSkillTree={() => coordinator.openModal(ModalId.SkillTree)}
          onOpenHelp={() => coordinator.openModal(ModalId.Help)}
          onOpenMenu={() => coordinator.openModal(ModalId.Menu)}
          onTogglePause={coordinator.togglePause}
        />
      </GameLayout.Main>

      <GameModalHost
        modalManager={coordinator.modalManager}
        activeSubTabs={coordinator.activeSubTabs}
        onSubTabChange={coordinator.setActiveSubTab}
        onClose={coordinator.closeModal}
        onNavigateModal={coordinator.openModal}
        onResume={coordinator.resumeGame}
        onStartRebind={(action, player, label) =>
          startRebind({ action, player, label })
        }
        showLegend={showLegend}
        isPadConnected={connectedGamepads.length > 0 ? true : undefined}
        renderDeveloperSuite={renderDeveloperSuite}
      />

      <KeyRebindDialog target={bindingTarget} onCancel={cancelRebind} />
    </GameLayout.Root>
  );
}

export default function App() {
  return (
    <GameErrorBoundary
      fallbackTitle={APP_CONFIG.errorBoundaryFallbackTitle}
      reportCollector={formatGameDiagnosticReport}
    >
      <I18nProvider>
        <GameProvider>
          <GameScreen />
        </GameProvider>
      </I18nProvider>
    </GameErrorBoundary>
  );
}
