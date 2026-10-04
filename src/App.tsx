import React, { useCallback } from "react";
import { I18nProvider, useI18n } from "@context/I18nContext";
import { GameProvider, useGameSession } from "@context/GameContext";
import { useModalManager } from "@components/menu/hooks/useModalManager";
import { HUDOverlay } from "@components/hud";
import { Swords, HelpCircle, Menu as MenuIcon } from "lucide-react";
import {
  Badge,
  GameErrorBoundary,
  Toast,
  useToast,
} from "@ui";
import { ModalType } from "@components/modal";
import { KeyRebindDialog, useKeyRebind } from "@components/controls";
import {
  GameLayout,
  GameModalHost,
  useAppHotkeys,
} from "@components/layout";
import { formatGameDiagnosticReport } from "@lib/logger";
import { LanguageSelector } from "@components/common";

function GameScreen() {
  const { t } = useI18n();
  const { initializeAudio, setPaused, togglePause } = useGameSession();
  const modalManager = useModalManager();
  const { toastMessage, showToast } = useToast();

  const { bindingTarget, isRebinding, startRebind, cancelRebind } = useKeyRebind({
    onSuccess: showToast,
  });

  // Modal Openers with automatic pause management
  const handleOpenMenu = useCallback(() => {
    setPaused(true);
    modalManager.openMenu();
  }, [modalManager, setPaused]);

  const handleOpenHelp = useCallback(() => {
    setPaused(true);
    modalManager.openHelp();
  }, [modalManager, setPaused]);

  const handleOpenCreation = useCallback(() => {
    setPaused(true);
    modalManager.openCreation();
  }, [modalManager, setPaused]);

  const handleCloseModal = useCallback(() => {
    const wasPausedModal =
      modalManager.isMenuOpen || modalManager.isHelpOpen || modalManager.isCreationOpen;
    modalManager.closeModal();
    if (wasPausedModal) {
      setPaused(false);
    }
  }, [modalManager, setPaused]);

  const handleResumeGame = useCallback(() => {
    modalManager.closeModal();
    setPaused(false);
  }, [modalManager, setPaused]);

  const handleTogglePause = useCallback(() => {
    if (modalManager.activeModal !== "none") {
      handleResumeGame();
    } else {
      togglePause();
    }
  }, [modalManager, handleResumeGame, togglePause]);

  const handleNavigateModal = useCallback(
    (targetModal: ModalType) => {
      if (targetModal === "menu") {
        setPaused(true);
        modalManager.openMenu();
      } else if (targetModal === "help") {
        setPaused(true);
        modalManager.openHelp();
      } else if (targetModal === "inventory") {
        modalManager.openInventory();
      } else if (targetModal === "skillTree") {
        modalManager.openSkillTree();
      } else if (targetModal === "creation") {
        setPaused(true);
        modalManager.openCreation();
      }
    },
    [modalManager, setPaused]
  );

  // Global hotkeys for Menu [M], Help [H/?], Pause [P], Inventory [I], Skill Tree [K], Escape
  useAppHotkeys({
    modalManager,
    onOpenHelp: handleOpenHelp,
    onOpenMenu: handleOpenMenu,
    onOpenCreation: handleOpenCreation,
    onCloseModal: handleCloseModal,
    onTogglePause: handleTogglePause,
    isRebinding,
  });

  return (
    <GameLayout.Root onInteract={initializeAudio}>
      <GameLayout.Header>
        <GameLayout.Brand title={t("title")} subtitle={t("subtitle")} />
        <GameLayout.Actions>
          <GameLayout.HotkeyGroup>
            <GameLayout.HotkeyHint
              hotkey="H"
              label={t("hints")}
              icon={<HelpCircle size={13} />}
              onClick={handleOpenHelp}
            />
            <GameLayout.HotkeyHint
              hotkey="M"
              label={t("menu")}
              icon={<MenuIcon size={13} />}
              onClick={handleOpenMenu}
            />
          </GameLayout.HotkeyGroup>

          <Badge variant="amber" className="text-[10px] hidden sm:inline-flex" icon={<Swords size={11} />}>
            {t("styleBadge")}
          </Badge>

          <LanguageSelector variant="pills" />
        </GameLayout.Actions>
      </GameLayout.Header>

      <Toast message={toastMessage} />

      <GameLayout.Main>
        <HUDOverlay
          onOpenInventory={modalManager.openInventory}
          onOpenSkillTree={modalManager.openSkillTree}
          onOpenHelp={handleOpenHelp}
          onOpenMenu={handleOpenMenu}
          onOpenCreation={handleOpenCreation}
          onTogglePause={handleTogglePause}
        />
      </GameLayout.Main>

      <GameModalHost
        modalManager={modalManager}
        onClose={handleCloseModal}
        onNavigateModal={handleNavigateModal}
        onResume={handleResumeGame}
        onStartRebind={(action, player, label) =>
          startRebind({ action, player, label })
        }
      />

      <KeyRebindDialog target={bindingTarget} onCancel={cancelRebind} />
    </GameLayout.Root>
  );
}

export default function App() {
  return (
    <GameErrorBoundary
      fallbackTitle="Vibrant Castle Critical Failure"
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
