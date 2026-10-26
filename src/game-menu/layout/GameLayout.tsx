import React from "react";
import { Layers } from "lucide-react";
import { cn } from "@lib/utils";
import { KbdKey, Heading, Paragraph, Button, Text } from "@ui";
const LAYOUT_STYLES = {
  root: "h-screen w-screen max-w-full max-h-full bg-[#120602] text-[#fef3c7] font-sans antialiased flex flex-col justify-between overflow-hidden",
  header: "border-b border-[#3a1a0f] bg-[#140602]/95 px-3 md:px-5 py-2 flex justify-between items-center z-10 shrink-0",
  title: "text-base md:text-lg leading-none",
  subtitle: "text-amber-600 hidden sm:block",
  icon: "text-amber-500 animate-pulse shrink-0",
} as const;

/**
 * Props for the root game layout container.
 */
export interface GameLayoutRootProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional callback to trigger audio initialization or resume on user interaction */
  readonly onInteract?: () => void;
  readonly children?: React.ReactNode;
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
}: GameLayoutRootProps): React.ReactElement {
  return (
    <div
      id={id}
      tabIndex={-1}
      onClick={onInteract}
      onKeyDown={onInteract}
      className={cn(LAYOUT_STYLES.root, className)}
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
  readonly children?: React.ReactNode;
}

/**
 * Header bar housing brand identity, navigation actions, hotkeys, and language switcher.
 */
export function GameLayoutHeader({
  className,
  children,
  id = "game-header",
  ...props
}: GameLayoutHeaderProps): React.ReactElement {
  return (
    <header
      id={id}
      className={cn(LAYOUT_STYLES.header, className)}
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
  readonly title: React.ReactNode;
  /** Optional subtitle or description displayed on larger screens */
  readonly subtitle?: React.ReactNode;
  /** Custom logo or icon (defaults to animated Layers icon) */
  readonly icon?: React.ReactNode;
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
}: GameLayoutBrandProps): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {icon ?? <Layers className={LAYOUT_STYLES.icon} size={22} />}
      <div>
        <Heading
          level={1}
          id="app-title"
          variant="gothic"
          dropShadow
          className={cn(LAYOUT_STYLES.title, "text-amber-500")}
        >
          {title}
        </Heading>
        {subtitle && (
          <Paragraph id="app-description" size="2xs" className={LAYOUT_STYLES.subtitle}>
            {subtitle}
          </Paragraph>
        )}
      </div>
    </div>
  );
}

/**
 * Props for the right-hand actions container in the header.
 */
export interface GameLayoutActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children?: React.ReactNode;
}

/**
 * Container component for action controls, quick hotkeys, badges, and language selectors.
 */
export function GameLayoutActions({
  className,
  children,
  ...props
}: GameLayoutActionsProps): React.ReactElement {
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
  readonly children?: React.ReactNode;
}

/**
 * Responsive container for hotkey indicators, hidden on smaller devices.
 */
export function GameLayoutHotkeyGroup({
  className,
  children,
  ...props
}: GameLayoutHotkeyGroupProps): React.ReactElement {
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
  readonly hotkey: string;
  /** Descriptive button label */
  readonly label: React.ReactNode;
  /** Optional icon prefix */
  readonly icon?: React.ReactNode;
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
}: GameLayoutHotkeyHintProps): React.ReactElement {
  const ariaLabel = typeof label === "string" ? `${label} (${hotkey})` : undefined;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-keyshortcuts={hotkey}
      aria-label={ariaLabel}
      className={cn(
        "h-auto p-0 hover:bg-transparent flex items-center gap-1 text-stone-400 hover:text-amber-300 transition-colors font-normal",
        className
      )}
      {...props}
    >
      {icon && <span className="text-amber-400 flex items-center">{icon}</span>}
      <Text size="xs">{label}</Text>
      <KbdKey variant="amber">{hotkey}</KbdKey>
    </Button>
  );
}

/**
 * Props for the main viewport container.
 */
export interface GameLayoutMainProps extends React.HTMLAttributes<HTMLElement> {
  readonly children?: React.ReactNode;
}

/**
 * Full viewport container housing HUD overlays, canvas elements, and simulation viewports.
 */
export function GameLayoutMain({
  className,
  children,
  id = "game-main-content",
  ...props
}: GameLayoutMainProps): React.ReactElement {
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

