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
} from "lucide-react";

export interface SkillIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const SkillIcon: React.FC<SkillIconProps> = ({ name, size = 20, className = "" }) => {
  switch (name) {
    case "Sun":
      return <Sun size={size} className={`text-amber-400 ${className}`} />;
    case "Swords":
    case "Sword":
      return <Swords size={size} className={`text-orange-400 ${className}`} />;
    case "Flame":
      return <Flame size={size} className={`text-amber-500 ${className}`} />;
    case "Shield":
      return <Shield size={size} className={`text-emerald-400 ${className}`} />;
    case "Sparkles":
      return <Sparkles size={size} className={`text-purple-400 ${className}`} />;
    case "Hourglass":
      return <Hourglass size={size} className={`text-indigo-400 ${className}`} />;
    case "Zap":
      return <Zap size={size} className={`text-cyan-400 ${className}`} />;
    case "Snowflake":
      return <Snowflake size={size} className={`text-sky-300 ${className}`} />;
    case "Crosshair":
      return <Crosshair size={size} className={`text-yellow-400 ${className}`} />;
    case "Droplets":
      return <Droplets size={size} className={`text-blue-400 ${className}`} />;
    case "BookOpen":
      return <BookOpen size={size} className={`text-violet-400 ${className}`} />;
    case "Heart":
      return <Heart size={size} className={`text-rose-400 ${className}`} />;
    case "Activity":
    default:
      return <Activity size={size} className={`text-emerald-400 ${className}`} />;
  }
};

export default SkillIcon;
