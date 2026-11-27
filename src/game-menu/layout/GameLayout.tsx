import React from "react";
import { MapPin } from "lucide-react";
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
      "h-screen h-dvh w-full flex flex-col bg-[#120704] text-stone-100 select-none overflow-hidden",
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
      "w-full h-12 px-3 md:px-4 bg-[#160804]/95 border-b border-amber-900/35 flex items-center justify-between gap-2 md:gap-3 z-20 shrink-0",
      className
    )}
  >
    {children}
  </header>
);

export interface GameLayoutBrandProps {
  readonly title: string;
  readonly locationName?: string;
  readonly subtitle?: string;
  readonly className?: string;
}

const GameLayoutBrand: React.FC<GameLayoutBrandProps> = ({
  title,
  locationName,
  subtitle,
  className,
}) => (
  <div className={cn("flex items-center gap-2.5 min-w-0 shrink-0 whitespace-nowrap", className)}>
    <Heading
      level={1}
      size="sm"
      variant="primary"
      className="leading-none tracking-wide text-amber-300 whitespace-nowrap shrink-0"
    >
      {title}
    </Heading>
    {locationName && (
      <>
        <span
          aria-hidden="true"
          className="hidden lg:block h-4 w-px bg-amber-900/50 shrink-0"
        />
        <div
          className="hidden lg:flex items-center gap-1.5 min-w-0 whitespace-nowrap"
          title={locationName}
        >
          <MapPin size={13} className="text-amber-400/90 shrink-0" />
          <Text
            size="xs"
            weight="medium"
            className="text-stone-300 truncate max-w-[120px] lg:max-w-[165px] xl:max-w-[230px] whitespace-nowrap"
          >
            {locationName}
          </Text>
        </div>
      </>
    )}
    {!locationName && subtitle && (
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
  <div className={cn("flex items-center gap-1.5 md:gap-2 shrink-0 whitespace-nowrap", className)}>
    {children}
  </div>
);

export interface GameLayoutHotkeyGroupProps {
  readonly children: React.ReactNode;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const GameLayoutHotkeyGroup: React.FC<GameLayoutHotkeyGroupProps> = ({
  children,
  ariaLabel = "Primary navigation",
  className,
}) => (
  <nav
    aria-label={ariaLabel}
    className={cn(
      "flex items-center gap-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap",
      className
    )}
  >
    {children}
  </nav>
);

export type LabelVisibility = "always" | "sm" | "md" | "lg" | "xl";

const LABEL_VISIBILITY_CLASS: Record<LabelVisibility, string> = {
  always: "inline",
  sm: "hidden sm:inline",
  md: "hidden md:inline",
  lg: "hidden lg:inline",
  xl: "hidden xl:inline",
};

export interface GameLayoutHotkeyHintProps {
  readonly id?: string;
  readonly hotkey?: string;
  readonly label: string;
  readonly tooltip?: string;
  readonly icon?: React.ReactNode;
  readonly onClick?: () => void;
  readonly emphasized?: boolean;
  readonly active?: boolean;
  readonly ariaPressed?: boolean;
  readonly labelVisibility?: LabelVisibility;
  readonly hotkeyVisibility?: LabelVisibility;
  readonly className?: string;
}

const GameLayoutHotkeyHint: React.FC<GameLayoutHotkeyHintProps> = ({
  id,
  hotkey,
  label,
  tooltip,
  icon,
  onClick,
  emphasized = false,
  active = false,
  ariaPressed,
  labelVisibility = "lg",
  hotkeyVisibility = "lg",
  className,
}) => {
  const titleText = tooltip ?? (hotkey ? `${label} [${hotkey}]` : label);

  return (
    <Button
      id={id}
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-pressed={ariaPressed}
      aria-label={titleText}
      title={titleText}
      leftIcon={
        icon ? (
          <span
            className={cn(
              "inline-flex items-center shrink-0",
              active ? "text-amber-50" : "text-amber-400/90"
            )}
          >
            {icon}
          </span>
        ) : undefined
      }
      rightIcon={
        hotkey ? (
          <Code
            size="2xs"
            className={cn(
              LABEL_VISIBILITY_CLASS[hotkeyVisibility],
              "px-1 py-0 leading-tight rounded border-0 font-mono tabular-nums",
              active
                ? "bg-black/30 text-amber-100"
                : "bg-black/45 text-stone-400"
            )}
          >
            {hotkey}
          </Code>
        ) : undefined
      }
      className={cn(
        "h-8 min-h-8 px-2 py-0 gap-1.5 rounded-lg text-xs font-medium leading-none whitespace-nowrap shrink-0 shadow-none transition-colors",
        active
          ? "bg-amber-600/90 hover:bg-amber-500 border border-amber-400/80 text-white"
          : emphasized
            ? "bg-amber-950/60 hover:bg-amber-900/65 border border-amber-700/50 text-amber-200 hover:text-amber-100"
            : "bg-transparent hover:bg-amber-950/50 border border-transparent hover:border-amber-800/40 text-stone-300 hover:text-amber-100",
        className
      )}
    >
      <span className={cn(LABEL_VISIBILITY_CLASS[labelVisibility], "whitespace-nowrap")}>
        {label}
      </span>
    </Button>
  );
};

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
      "relative flex-1 min-h-0 w-full flex flex-col overflow-hidden bg-[#0c0402]",
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
