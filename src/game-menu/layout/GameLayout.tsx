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
      "w-full px-4 py-2 bg-[#1c0b06]/95 border-b border-amber-900/50 flex flex-wrap items-center justify-between gap-3 z-20 shadow-md",
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
  <div className={cn("flex flex-col", className)}>
    <Heading
      level={1}
      size="base"
      variant="primary"
      className="leading-tight tracking-wide text-amber-300"
    >
      {title}
    </Heading>
    {subtitle && (
      <Text size="2xs" variant="muted" className="hidden md:block text-stone-400">
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
  <div className={cn("flex items-center gap-2 flex-wrap", className)}>
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
  <div className={cn("flex items-center gap-1.5", className)}>{children}</div>
);

export interface GameLayoutHotkeyHintProps {
  readonly hotkey: string;
  readonly label: string;
  readonly icon?: React.ReactNode;
  readonly onClick?: () => void;
  readonly className?: string;
}

const GameLayoutHotkeyHint: React.FC<GameLayoutHotkeyHintProps> = ({
  hotkey,
  label,
  icon,
  onClick,
  className,
}) => (
  <Button
    variant="secondary"
    size="sm"
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 h-auto rounded-lg bg-[#2a1209] hover:bg-[#3c1b0e] border border-amber-800/50 text-xs font-semibold text-amber-100",
      className
    )}
  >
    {icon && <span className="text-amber-400">{icon}</span>}
    <span>{label}</span>
    <Code
      size="2xs"
      className="px-1 py-0.5 rounded bg-black/50 text-amber-300 border-0"
    >
      [{hotkey}]
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
