import React from "react";
import {
  Sun,
  Swords,
  Flame,
  Shield,
  Sparkles,
  Hourglass,
  Zap,
  BookOpen,
  Heart,
  Snowflake,
  Crosshair,
  Droplets,
  Activity,
  LucideIcon,
} from "lucide-react";

export interface SkillIconProps {
  readonly name: string;
  readonly size?: number;
  readonly className?: string;
}

interface IconConfig {
  readonly component: LucideIcon;
  readonly colorClass: string;
}

const SKILL_ICON_MAP: Record<string, IconConfig> = {
  Sun: { component: Sun, colorClass: "text-amber-400" },
  Swords: { component: Swords, colorClass: "text-orange-400" },
  Sword: { component: Swords, colorClass: "text-orange-400" },
  Flame: { component: Flame, colorClass: "text-amber-500" },
  Shield: { component: Shield, colorClass: "text-emerald-400" },
  Sparkles: { component: Sparkles, colorClass: "text-purple-400" },
  Hourglass: { component: Hourglass, colorClass: "text-indigo-400" },
  Zap: { component: Zap, colorClass: "text-cyan-400" },
  Snowflake: { component: Snowflake, colorClass: "text-sky-300" },
  Crosshair: { component: Crosshair, colorClass: "text-yellow-400" },
  Droplets: { component: Droplets, colorClass: "text-blue-400" },
  BookOpen: { component: BookOpen, colorClass: "text-violet-400" },
  Heart: { component: Heart, colorClass: "text-rose-400" },
  Activity: { component: Activity, colorClass: "text-emerald-400" },
};

const DEFAULT_ICON_CONFIG: IconConfig = {
  component: Activity,
  colorClass: "text-emerald-400",
};

export const SkillIcon = ({
  name,
  size = 20,
  className = "",
}: SkillIconProps): React.ReactElement => {
  const config = SKILL_ICON_MAP[name] ?? DEFAULT_ICON_CONFIG;
  const Component = config.component;

  return <Component size={size} className={`${config.colorClass} ${className}`} />;
};

export default SkillIcon;
