import React from "react";
import { Menu as MenuIcon, HelpCircle, Backpack, BookOpen, Play } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { cn } from "../../lib/utils";

export type ModalType = "menu" | "help" | "inventory" | "skillTree" | "creation";

export interface ModalNavigationTabsProps {
  currentModal: ModalType;
  onNavigate: (modal: ModalType) => void;
  onResume: () => void;
  showCreation?: boolean;
  className?: string;
}

export const ModalNavigationTabs: React.FC<ModalNavigationTabsProps> = ({
  currentModal,
  onNavigate,
  onResume,
  showCreation = true,
  className = "",
}) => {
  const { t } = useI18n();

  const items: {
    id: ModalType;
    label: string;
    keyLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "menu",
      label: t("menu"),
      keyLabel: "M",
      icon: <MenuIcon size={14} className="text-amber-400" />,
    },
    {
      id: "help",
      label: t("hints"),
      keyLabel: "H",
      icon: <HelpCircle size={14} className="text-amber-400" />,
    },
    {
      id: "inventory",
      label: t("inventoryBtn"),
      keyLabel: "I",
      icon: <Backpack size={14} className="text-amber-400" />,
    },
    {
      id: "skillTree",
      label: t("skillTreeBtn"),
      keyLabel: "K",
      icon: <BookOpen size={14} className="text-purple-400" />,
    },
  ];

  if (showCreation) {
    items.push({
      id: "creation",
      label: t("tabCreation"),
      keyLabel: "C",
      icon: <Layers size={14} className="text-emerald-400" />,
    });
  }

  return (
    <div
      id="modal-quick-navigation"
      className={cn(
        "shrink-0 flex flex-wrap items-center justify-between gap-2 p-2 bg-[#120502]/95 border border-amber-500/35 rounded-xl text-xs font-semibold select-none shadow-md",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => {
          const isActive = currentModal === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs font-bold",
                isActive
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400 shadow-md shadow-amber-950/60"
                  : "bg-black/50 hover:bg-amber-950/50 text-stone-300 hover:text-amber-200 border border-stone-800 hover:border-amber-600/60"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded font-mono font-bold",
                  isActive ? "bg-black/30 text-amber-200" : "bg-stone-900 text-stone-400"
                )}
              >
                [{item.keyLabel}]
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onResume}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 hover:text-white border border-emerald-600/60 text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-emerald-900/40 ml-auto"
        title={`${t("resume")} [P]`}
      >
        <Play size={13} className="text-emerald-400 fill-emerald-400" />
        <span>{t("resume")}</span>
        <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold">
          [P]
        </span>
      </button>
    </div>
  );
};

export default ModalNavigationTabs;
