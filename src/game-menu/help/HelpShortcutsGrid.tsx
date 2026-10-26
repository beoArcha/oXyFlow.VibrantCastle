import React, { useMemo } from "react";
import { Keyboard, Backpack, BookOpen } from "lucide-react";
import { KbdKey, Badge, Text, Code } from "@ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { ShortcutEntry, HelpShortcutsGridProps } from "./types";

export type { HelpShortcutsGridProps };

/**
 * Global keyboard shortcuts overview component.
 * Displays universal gameplay and interface navigation keys.
 */
export const HelpShortcutsGrid: React.FC<HelpShortcutsGridProps> = React.memo(
  function HelpShortcutsGrid({ className = "" }) {
    const { t } = useI18n();

    const shortcuts: readonly ShortcutEntry[] = useMemo(
      () => [
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
      ],
      [t]
    );

    return (
      <section className={cn("flex flex-col gap-2.5", className)} aria-labelledby="shortcuts-heading">
        <div id="shortcuts-heading" className="flex items-center gap-2">
          <Keyboard size={14} className="text-amber-400" />
          <Text size="xs" weight="bold" className="uppercase tracking-wider text-amber-400">
            {t("controlsHelp")}
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {shortcuts.map((s) => (
            <div
              key={s.id}
              className="bg-stone-950/80 border border-amber-900/40 rounded-xl p-3 flex items-center justify-between transition-colors hover:border-amber-500/60 shadow-xs"
            >
              <div className="flex items-center gap-2">
                {s.icon}
                <Text size="xs" weight="semibold" className="text-stone-200">{s.label}</Text>
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
                  <Badge variant={s.badgeVariant || "stone"} className="text-[9px] py-0.5 px-1.5">
                    <Code variant="plain" size="xs" className="text-[9px] p-0 text-inherit bg-transparent border-0">
                      {s.badge}
                    </Code>
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
);

HelpShortcutsGrid.displayName = "HelpShortcutsGrid";

export default HelpShortcutsGrid;
