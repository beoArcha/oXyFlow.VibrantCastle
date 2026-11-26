import React, { useCallback, useMemo } from "react";
import { Swords, HelpCircle, Menu as MenuIcon, Backpack, BookOpen, Layers } from "lucide-react";
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
import { Badge, GameErrorBoundary, Toast, useToast } from "@ui";
import { formatGameDiagnosticReport } from "@lib/logger";

const HEADER_SHORTCUT_ICONS: Record<ModalIconKey, React.ReactNode> = {
  help: <HelpCircle size={13} />,
  menu: <MenuIcon size={13} />,
  inventory: <Backpack size={13} />,
  skillTree: <BookOpen size={13} />,
  creation: <Layers size={13} />,
};

function GameScreen() {
  const { t } = useI18n();
  const { initializeAudio, setPaused, togglePause } = useGameSession();
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

  const headerShortcuts = useMemo(() => getHeaderModalShortcuts(), []);

  const renderDeveloperSuite = useCallback(() => <DeveloperSuite />, []);

  return (
    <GameLayout.Root onInteract={initializeAudio}>
      <GameLayout.Header>
        <GameLayout.Brand
          title={t(APP_CONFIG.i18nKeys.title)}
          subtitle={t(APP_CONFIG.i18nKeys.subtitle)}
        />
        <GameLayout.Actions>
          <GameLayout.HotkeyGroup>
            {headerShortcuts.map((def) => {
              const cfg = def.headerShortcut!;
              return (
                <GameLayout.HotkeyHint
                  key={def.id}
                  hotkey={cfg.hotkeyLabel}
                  label={t(cfg.labelKey)}
                  icon={HEADER_SHORTCUT_ICONS[cfg.iconKey]}
                  onClick={() => coordinator.openModal(def.id)}
                />
              );
            })}
          </GameLayout.HotkeyGroup>

          <Badge
            variant="amber"
            className="text-[10px] hidden sm:inline-flex"
            icon={<Swords size={11} />}
          >
            {t(APP_CONFIG.i18nKeys.styleBadge)}
          </Badge>

          <LanguageSelector variant="pills" />
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
