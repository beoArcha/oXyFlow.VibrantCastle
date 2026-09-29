import React, { useCallback } from "react";
import { I18nProvider, useI18n } from "./context/I18nContext";
import { GameProvider, useGameSession } from "./context/GameContext";
import { useModalManager } from "./components/menu/hooks/useModalManager";
import { MenuModal } from "./components/menu/MenuModal";
import { HelpModal } from "./components/help/HelpModal";
import { DeveloperModal } from "./components/developer";
import { HUDOverlay } from "./components/hud/HUDOverlay";
import { InventoryPanel } from "./components/inventory/InventoryPanel";
import { SkillTreePanel } from "./components/skills/SkillTreePanel";
import { Layers, Swords, HelpCircle, Menu as MenuIcon } from "lucide-react";
import {
  Badge,
  KbdKey,
  ModalType,
  GameErrorBoundary,
  LanguageSelector,
  Toast,
  useToast,
} from "./components/ui";
import { KeyRebindDialog } from "./components/controls";
import { useAppHotkeys, useKeyRebind } from "./components/layout/hooks";

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
    onCancelRebind: cancelRebind,
  });

  return (
    <div
      id="game-root-container"
      onClick={initializeAudio}
      onKeyDown={initializeAudio}
      className="h-screen w-screen max-w-full max-h-full bg-[#120602] text-[#fef3c7] font-sans antialiased flex flex-col justify-between overflow-hidden"
    >
      {/* 1. Header Bar: Compact, High-Contrast with branding and language switch */}
      <header
        id="game-header"
        className="border-b border-[#3a1a0f] bg-[#140602]/95 px-3 md:px-5 py-2 flex justify-between items-center z-10 shrink-0"
      >
        <div className="flex items-center gap-3">
          <Layers className="text-[#f59e0b] animate-pulse shrink-0" size={22} />
          <div>
            <h1
              id="app-title"
              className="text-base md:text-lg font-serif font-black tracking-tight text-[#f59e0b] drop-shadow-md leading-none"
            >
              {t("title")}
            </h1>
            <p id="app-description" className="text-[11px] text-[#d97706] font-medium hidden sm:block">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Action Controls & Languages */}
        <div className="flex items-center gap-2">
          {/* Quick Hotkey Indicator Badges */}
          <div className="hidden md:flex items-center gap-2 text-xs text-stone-400 mr-2">
            <button
              onClick={handleOpenHelp}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <HelpCircle size={13} className="text-amber-400" />
              <span>{t("hints")}</span>
              <KbdKey variant="amber">H</KbdKey>
            </button>
            <button
              onClick={handleOpenMenu}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer ml-1"
            >
              <MenuIcon size={13} className="text-amber-400" />
              <span>{t("menu")}</span>
              <KbdKey variant="amber">M</KbdKey>
            </button>
          </div>

          <Badge variant="amber" className="text-[10px] hidden sm:inline-flex" icon={<Swords size={11} />}>
            {t("styleBadge")}
          </Badge>

          {/* Localization Toggle */}
          <LanguageSelector variant="pills" />
        </div>
      </header>

      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* 2. Main Game Viewport Occupying 100% Available Area */}
      <main
        id="game-main-content"
        className="flex-1 w-full h-full relative overflow-hidden flex flex-col"
      >
        <HUDOverlay
          onOpenInventory={modalManager.openInventory}
          onOpenSkillTree={modalManager.openSkillTree}
          onOpenHelp={handleOpenHelp}
          onOpenMenu={handleOpenMenu}
          onOpenCreation={handleOpenCreation}
          onTogglePause={handleTogglePause}
        />
      </main>

      {/* 3. Modals with Seamless Inter-Modal Navigation */}
      {/* Help / Tips Modal */}
      {modalManager.isHelpOpen && (
        <HelpModal
          onClose={handleCloseModal}
          onNavigateModal={handleNavigateModal}
          onResume={handleResumeGame}
        />
      )}

      {/* Menu / Settings Modal */}
      {modalManager.isMenuOpen && (
        <MenuModal
          onClose={handleCloseModal}
          onStartRebind={(action, player, label) =>
            startRebind({ action, player, label })
          }
          onNavigateModal={handleNavigateModal}
          onResume={handleResumeGame}
        />
      )}

      {/* Inventory Modal */}
      {modalManager.isInventoryOpen && (
        <InventoryPanel
          onClose={handleCloseModal}
          onNavigateModal={handleNavigateModal}
          onResume={handleResumeGame}
        />
      )}

      {/* Skill Tree Modal */}
      {modalManager.isSkillTreeOpen && (
        <SkillTreePanel
          onClose={handleCloseModal}
          onNavigateModal={handleNavigateModal}
          onResume={handleResumeGame}
        />
      )}

      {/* Developer / Creation Modal */}
      {modalManager.isCreationOpen && (
        <DeveloperModal
          onClose={handleCloseModal}
          onNavigateModal={handleNavigateModal}
          onResume={handleResumeGame}
        />
      )}

      {/* Rebind Key Overlay */}
      <KeyRebindDialog target={bindingTarget} onCancel={cancelRebind} />
    </div>
  );
}

export default function App() {
  return (
    <GameErrorBoundary fallbackTitle="Vibrant Castle Critical Failure">
      <I18nProvider>
        <GameProvider>
          <GameScreen />
        </GameProvider>
      </I18nProvider>
    </GameErrorBoundary>
  );
}
