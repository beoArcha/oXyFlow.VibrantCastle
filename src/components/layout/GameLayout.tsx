import React from "react";
import { Layers } from "lucide-react";
import { cn } from "@lib/utils";
import { KbdKey } from "@ui";

/**
 * Props for the root game layout container.
 */
export interface GameLayoutRootProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional callback to trigger audio initialization or resume on user interaction */
  onInteract?: () => void;
  children?: React.ReactNode;
}

/**
 * Top-level viewport container for the full-screen game canvas and UI.
 *
 * @example
 * <GameLayout.Root onInteract={initAudio}>
 *   <GameLayout.Header>...</GameLayout.Header>
 *   <GameLayout.Main>...</GameLayout.Main>
 * </GameLayout.Root>
 */
export function GameLayoutRoot({
  onInteract,
  className,
  children,
  id = "game-root-container",
  ...props
}: GameLayoutRootProps) {
  return (
    <div
      id={id}
      onClick={onInteract}
      onKeyDown={onInteract}
      className={cn(
        "h-screen w-screen max-w-full max-h-full bg-[#120602] text-[#fef3c7] font-sans antialiased flex flex-col justify-between overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Props for the game top header bar.
 */
export interface GameLayoutHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

/**
 * Header bar housing brand identity, navigation actions, hotkeys, and language switcher.
 */
export function GameLayoutHeader({
  className,
  children,
  id = "game-header",
  ...props
}: GameLayoutHeaderProps) {
  return (
    <header
      id={id}
      className={cn(
        "border-b border-[#3a1a0f] bg-[#140602]/95 px-3 md:px-5 py-2 flex justify-between items-center z-10 shrink-0",
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}

/**
 * Props for the game brand identity section.
 */
export interface GameLayoutBrandProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Primary title text or element */
  title: React.ReactNode;
  /** Optional subtitle or description displayed on larger screens */
  subtitle?: React.ReactNode;
  /** Custom logo or icon (defaults to animated Layers icon) */
  icon?: React.ReactNode;
}

/**
 * Brand component rendering game title, subtitle, and primary icon.
 */
export function GameLayoutBrand({
  title,
  subtitle,
  icon,
  className,
  ...props
}: GameLayoutBrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {icon ?? <Layers className="text-[#f59e0b] animate-pulse shrink-0" size={22} />}
      <div>
        <h1
          id="app-title"
          className="text-base md:text-lg font-serif font-black tracking-tight text-[#f59e0b] drop-shadow-md leading-none"
        >
          {title}
        </h1>
        {subtitle && (
          <p id="app-description" className="text-[11px] text-[#d97706] font-medium hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Props for the right-hand actions container in the header.
 */
export interface GameLayoutActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * Container component for action controls, quick hotkeys, badges, and language selectors.
 */
export function GameLayoutActions({
  className,
  children,
  ...props
}: GameLayoutActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Props for grouping multiple hotkey hint buttons together.
 */
export interface GameLayoutHotkeyGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * Responsive container for hotkey indicators, hidden on smaller devices.
 */
export function GameLayoutHotkeyGroup({
  className,
  children,
  ...props
}: GameLayoutHotkeyGroupProps) {
  return (
    <div
      className={cn("hidden md:flex items-center gap-2 text-xs text-stone-400 mr-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Props for a single quick hotkey indicator button.
 */
export interface GameLayoutHotkeyHintProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Keyboard key shortcut label */
  hotkey: string;
  /** Descriptive button label */
  label: React.ReactNode;
  /** Optional icon prefix */
  icon?: React.ReactNode;
}

/**
 * Interactive button presenting a shortcut hotkey badge alongside an icon and label.
 */
export function GameLayoutHotkeyHint({
  hotkey,
  label,
  icon,
  className,
  onClick,
  ...props
}: GameLayoutHotkeyHintProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {icon && <span className="text-amber-400 flex items-center">{icon}</span>}
      <span>{label}</span>
      <KbdKey variant="amber">{hotkey}</KbdKey>
    </button>
  );
}

/**
 * Props for the main viewport container.
 */
export interface GameLayoutMainProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

/**
 * Full viewport container housing HUD overlays, canvas elements, and simulation viewports.
 */
export function GameLayoutMain({
  className,
  children,
  id = "game-main-content",
  ...props
}: GameLayoutMainProps) {
  return (
    <main
      id={id}
      className={cn(
        "flex-1 w-full h-full relative overflow-hidden flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

/**
 * Composite layout component for the application.
 */
export const GameLayout = {
  Root: GameLayoutRoot,
  Header: GameLayoutHeader,
  Brand: GameLayoutBrand,
  Actions: GameLayoutActions,
  HotkeyGroup: GameLayoutHotkeyGroup,
  HotkeyHint: GameLayoutHotkeyHint,
  Main: GameLayoutMain,
};
