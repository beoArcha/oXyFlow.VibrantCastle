import React from "react";
import { Keyboard, Backpack, BookOpen } from "lucide-react";
import { KbdKey, Badge } from "../ui";
import { useI18n } from "../../hooks/useI18n";
import { ShortcutEntry } from "./types";

export interface HelpShortcutsGridProps {
  className?: string;
}

/**
 * Global keyboard shortcuts overview component.
 * Displays universal gameplay and interface navigation keys.
 */
export const HelpShortcutsGrid: React.FC<HelpShortcutsGridProps> = ({ className = "" }) => {
  const { t } = useI18n();

  const shortcuts: ShortcutEntry[] = [
    {
      id: "hints",
      label: t("hints"),
      keys: ["H", "?"],
      separator: "/",
      keyVariant: "amber",
    },
    {
      id: "menu",
      label: `${t("menu")} / ${t("settings")}`,
      keys: ["M", "Esc"],
      separator: "/",
      keyVariant: "amber",
    },
    {
      id: "pause",
      label: `${t("pause")} / ${t("resume")}`,
      keys: ["P"],
      keyVariant: "amber",
    },
    {
      id: "inventory",
      icon: <Backpack size={13} className="text-amber-400" />,
      label: t("inventoryBtn"),
      keys: ["I"],
      badge: t("noPauseLive"),
      badgeVariant: "stone",
      keyVariant: "amber",
    },
    {
      id: "skills",
      icon: <BookOpen size={13} className="text-purple-400" />,
      label: t("skillTreeBtn"),
      keys: ["K"],
      badge: t("noPauseLive"),
      badgeVariant: "stone",
      keyVariant: "purple",
    },
    {
      id: "potions",
      label: t("quickPotions"),
      keys: ["1", "2", "3"],
      keyVariant: "stone",
    },
  ];

  return (
    <section className={`flex flex-col gap-2.5 ${className}`} aria-labelledby="shortcuts-heading">
      <div
        id="shortcuts-heading"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"
      >
        <Keyboard size={14} />
        <span>{t("controlsHelp")}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {shortcuts.map((s) => (
          <div
            key={s.id}
            className="bg-[#140602] border border-amber-500/30 rounded-xl p-3 flex items-center justify-between transition-colors hover:border-amber-500/60 shadow-xs"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              {s.icon}
              <span>{s.label}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1">
                {s.keys.map((k, idx) => (
                  <React.Fragment key={k}>
                    <KbdKey variant={s.keyVariant || "stone"}>{k}</KbdKey>
                    {s.separator && idx < s.keys.length - 1 && (
                      <span className="text-[10px] text-stone-400">{s.separator}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {s.badge && (
                <Badge variant={s.badgeVariant || "stone"} className="text-[9px] py-0.5 px-1.5 font-mono">
                  {s.badge}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HelpShortcutsGrid;
