import React from "react";
import { Button, Heading, Text, Code } from "@ui";
import { cn } from "@lib/utils";

export interface GameLayoutRootProps {
  readonly children: React.ReactNode;
  readonly onInteract?: () => void;
  readonly className?: string;
}

const GameLayoutRoot: React.FC<GameLayoutRootProps> = ({
  children,
  onInteract,
  className,
}) => (
  <div
    id="game-root-container"
    onPointerDown={onInteract}
    onKeyDown={onInteract}
    className={cn(
      "min-h-screen w-full flex flex-col bg-[#120704] text-stone-100 select-none overflow-hidden",
      className
    )}
  >
    {children}
  </div>
);

export interface GameLayoutHeaderProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

const GameLayoutHeader: React.FC<GameLayoutHeaderProps> = ({
  children,
  className,
}) => (
  <header
    className={cn(
      "w-full h-11 px-4 bg-[#160804]/95 border-b border-amber-900/35 flex items-center justify-between gap-3 z-20 shrink-0",
      className
    )}
  >
    {children}
  </header>
);

export interface GameLayoutBrandProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly className?: string;
}

const GameLayoutBrand: React.FC<GameLayoutBrandProps> = ({
  title,
  subtitle,
  className,
}) => (
  <div className={cn("flex items-center gap-2 shrink-0 whitespace-nowrap", className)}>
    <Heading
      level={1}
      size="base"
      variant="primary"
      className="leading-none tracking-wide text-amber-300 whitespace-nowrap"
    >
      {title}
    </Heading>
    {subtitle && (
      <Text size="2xs" variant="muted" className="hidden xl:block text-stone-400 whitespace-nowrap">
        {subtitle}
      </Text>
    )}
  </div>
);

export interface GameLayoutActionsProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

const GameLayoutActions: React.FC<GameLayoutActionsProps> = ({
  children,
  className,
}) => (
  <div className={cn("flex items-center gap-2 shrink-0 whitespace-nowrap", className)}>
    {children}
  </div>
);

export interface GameLayoutHotkeyGroupProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

const GameLayoutHotkeyGroup: React.FC<GameLayoutHotkeyGroupProps> = ({
  children,
  className,
}) => (
  <nav
    aria-label="Primary navigation"
    className={cn("flex items-center gap-1 whitespace-nowrap", className)}
  >
    {children}
  </nav>
);

export interface GameLayoutHotkeyHintProps {
  readonly hotkey: string;
  readonly label: string;
  readonly icon?: React.ReactNode;
  readonly onClick?: () => void;
  readonly emphasized?: boolean;
  readonly className?: string;
}

const GameLayoutHotkeyHint: React.FC<GameLayoutHotkeyHintProps> = ({
  hotkey,
  label,
  icon,
  onClick,
  emphasized = false,
  className,
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={`${label} [${hotkey}]`}
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 shadow-none transition-colors",
      emphasized
        ? "bg-amber-950/55 hover:bg-amber-900/60 border border-amber-700/45 text-amber-200"
        : "bg-transparent hover:bg-amber-950/45 border border-transparent hover:border-amber-800/35 text-stone-300 hover:text-amber-100",
      className
    )}
  >
    {icon && <span className="text-amber-400/90 shrink-0">{icon}</span>}
    <span className="hidden md:inline">{label}</span>
    <Code
      size="2xs"
      className="px-1 py-0 rounded bg-black/40 text-stone-400 border-0 font-mono"
    >
      {hotkey}
    </Code>
  </Button>
);

export interface GameLayoutMainProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

const GameLayoutMain: React.FC<GameLayoutMainProps> = ({
  children,
  className,
}) => (
  <main
    className={cn(
      "relative flex-1 w-full flex items-center justify-center overflow-hidden bg-[#0c0402]",
      className
    )}
  >
    {children}
  </main>
);

export const GameLayout = {
  Root: GameLayoutRoot,
  Header: GameLayoutHeader,
  Brand: GameLayoutBrand,
  Actions: GameLayoutActions,
  HotkeyGroup: GameLayoutHotkeyGroup,
  HotkeyHint: GameLayoutHotkeyHint,
  Main: GameLayoutMain,
};

export default GameLayout;
