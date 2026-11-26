import React, { useCallback, useMemo } from "react";
import {
  HelpCircle,
  Menu as MenuIcon,
  Backpack,
  BookOpen,
  Layers,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import { APP_CONFIG } from "@/app/appConfig";
import { I18nProvider, useI18n } from "@context/I18nContext";
import { GameProvider, useGameSession } from "@context/GameContext";
import { useModalCoordinator } from "@game-menu/menu/hooks/useModalCoordinator";
import {
  ModalId,
  getHeaderModalShortcuts,
  type ModalIconKey,
} from "@game-menu/modal";
import { KeyRebindDialog, useKeyRebind } from "@game-menu/controls";
import { GameLayout, GameModalHost, useAppHotkeys } from "@game-menu/layout";
import { LanguageSelector } from "@game-menu/common";
import { DeveloperSuite } from "@developer";
import { HUDOverlay } from "@hud";
import { GameErrorBoundary, Toast, useToast } from "@ui";
import { formatGameDiagnosticReport } from "@lib/logger";

const HEADER_SHORTCUT_ICONS: Record<ModalIconKey, React.ReactNode> = {
  help: <HelpCircle size={14} />,
  menu: <MenuIcon size={14} />,
  inventory: <Backpack size={14} />,
  skillTree: <BookOpen size={14} />,
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

  const openDefaultEscapeModal = useCallback(
    () => coordinator.openModal(ModalId.Menu),
    [coordinator]
  );

  useAppHotkeys({
    modalManager: coordinator.modalManager,
    onToggleModal: coordinator.toggleModal,
    onCloseModal: coordinator.closeModal,
    onOpenDefaultEscapeModal: openDefaultEscapeModal,
    onTogglePause: coordinator.togglePause,
    isRebinding,
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

  const renderDeveloperSuite = useCallback(() => <DeveloperSuite />, []);

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
                labelVisibility="lg"
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
          onOpenCreation={() => coordinator.openModal(ModalId.Creation)}
          onTogglePause={coordinator.togglePause}
        />
      </GameLayout.Main>

      <GameModalHost
        modalManager={coordinator.modalManager}
        onClose={coordinator.closeModal}
        onNavigateModal={coordinator.openModal}
        onResume={coordinator.resumeGame}
        onStartRebind={(action, player, label) =>
          startRebind({ action, player, label })
        }
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
