import React, { useEffect, useState, useCallback } from "react";
import { I18nProvider } from "./context/I18nContext";
import { GameProvider } from "./context/GameContext";
import { useI18n } from "./hooks/useI18n";
import { useGameSession } from "./hooks/useGame";
import { useModalManager } from "./hooks/useModalManager";
import { MenuModal } from "./components/menu/MenuModal";
import { HelpModal } from "./components/help/HelpModal";
import { DeveloperModal } from "./components/developer";
import { HUDOverlay } from "./components/hud/HUDOverlay";
import { InventoryPanel } from "./components/inventory/InventoryPanel";
import { SkillTreePanel } from "./components/skills/SkillTreePanel";
import { Globe, Layers, Swords, Pause, Play, HelpCircle, Menu as MenuIcon } from "lucide-react";
import { Button, Badge, KbdKey, ModalType, GameErrorBoundary } from "./components/ui";
import { gameInputs } from "./game/loop/input";
import { PlayerId, InputMap } from "./game/types";
import { cn } from "./lib/utils";

function GameScreen() {
  const { t, language, setLanguage } = useI18n();
  const { initializeAudio, isPaused, setPaused, togglePause } = useGameSession();
  const modalManager = useModalManager();

  const [bindingTarget, setBindingTarget] = useState<{
    player: PlayerId;
    action: keyof InputMap;
    label: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Keyboard rebind listener
  useEffect(() => {
    if (!bindingTarget) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keyCode = e.code;
      const keyName = e.key;

      const keysToBind = [keyCode, keyName, keyName.toLowerCase()].filter(
        (v, i, arr) => v && arr.indexOf(v) === i
      );

      gameInputs.setKeyboardBinding(bindingTarget.player, bindingTarget.action, keysToBind);

      const keyDisplayName = keyName === " " ? t("spaceKey") : keyName;
      showToast(
        language === "pl"
          ? `Pomyślnie przypisano "${keyDisplayName}" dla akcji "${bindingTarget.label}"!`
          : `Successfully bound "${keyDisplayName}" to "${bindingTarget.label}"!`
      );

      setBindingTarget(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [bindingTarget, language, t]);

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

  // Global hotkeys for Menu [M], Help [H/?], Pause [P], Inventory [I] and Skill Tree [K]
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (bindingTarget) return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      // Help Modal shortcut: 'h', 'H', '?', 'F1'
      if (e.key === "h" || e.key === "H" || e.key === "?" || e.key === "F1") {
        e.preventDefault();
        if (modalManager.isHelpOpen) {
          handleCloseModal();
        } else {
          handleOpenHelp();
        }
        return;
      }

      // Menu Modal shortcut: 'm' or 'M'
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (modalManager.isMenuOpen) {
          handleCloseModal();
        } else {
          handleOpenMenu();
        }
        return;
      }

      // Creation / Developer Modal shortcut: 'c' or 'C'
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (modalManager.isCreationOpen) {
          handleCloseModal();
        } else {
          handleOpenCreation();
        }
        return;
      }

      // Pause toggle: 'p' or 'P' (closes active modal or toggles game pause)
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handleTogglePause();
        return;
      }

      // Inventory shortcut: 'i' or 'I' (does NOT pause game)
      if (e.key === "i" || e.key === "I") {
        if (modalManager.isInventoryOpen) {
          modalManager.closeModal();
        } else {
          modalManager.openInventory();
        }
        return;
      }

      // Skill tree shortcut: 'k' or 'K' (does NOT pause game)
      if (e.key === "k" || e.key === "K") {
        if (modalManager.isSkillTreeOpen) {
          modalManager.closeModal();
        } else {
          modalManager.openSkillTree();
        }
        return;
      }

      // Escape key: closes open modal, or opens menu with pause
      if (e.key === "Escape") {
        e.preventDefault();
        if (modalManager.activeModal !== "none") {
          handleCloseModal();
          setBindingTarget(null);
        } else {
          handleOpenMenu();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [
    bindingTarget,
    modalManager,
    handleOpenMenu,
    handleOpenHelp,
    handleCloseModal,
    togglePause,
  ]);

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
          <div className="flex bg-[#26120b] rounded-lg p-0.5 border border-[#5c2d18]">
            <button
              id="lang-pl"
              onClick={() => setLanguage("pl")}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer select-none",
                language === "pl"
                  ? "bg-[#d97706] text-white shadow-md"
                  : "text-[#fed7aa] hover:bg-[#3d1b0e]"
              )}
            >
              <Globe size={12} />
              PL
            </button>
            <button
              id="lang-en"
              onClick={() => setLanguage("en")}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-md transition-all cursor-pointer select-none",
                language === "en"
                  ? "bg-[#d97706] text-white shadow-md"
                  : "text-[#fed7aa] hover:bg-[#3d1b0e]"
              )}
            >
              <Globe size={12} />
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-amber-600 text-white rounded-xl shadow-2xl text-xs font-bold border border-amber-400 animate-in fade-in">
          {toastMessage}
        </div>
      )}

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
            setBindingTarget({ action, player, label })
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
      {bindingTarget && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 z-50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#26120b] border-2 border-[#fbbf24] rounded-2xl p-6 max-w-sm shadow-2xl flex flex-col items-center gap-4">
            <div className="text-[10px] font-bold tracking-widest text-[#d97706] uppercase">
              {t("rebindTitle")}
            </div>
            <h3 className="text-2xl font-black text-[#fbbf24] tracking-wide">
              {bindingTarget.label}
            </h3>
            <div className="w-14 h-14 rounded-full border border-[#fbbf24]/50 bg-[#1c0c07] flex items-center justify-center text-2xl animate-pulse">
              ⌨️
            </div>
            <p className="text-xs text-[#fed7aa] leading-relaxed max-w-xs">
              {t("rebindPrompt")}
            </p>
            <Button
              id="cancel-rebind-btn"
              variant="danger"
              size="sm"
              onClick={() => setBindingTarget(null)}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
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
