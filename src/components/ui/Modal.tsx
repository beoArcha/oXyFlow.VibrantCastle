import React, { useEffect, useState } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@lib/utils";
import { useI18n } from "@context/I18nContext";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  maxWidthClass?: string;
  allowMaximize?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  defaultMaximized?: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerRight,
  maxWidthClass = "max-w-4xl",
  allowMaximize = false,
  isMaximized: controlledMaximized,
  onToggleMaximize,
  defaultMaximized = false,
  children,
}) => {
  const { t } = useI18n();
  const [internalMaximized, setInternalMaximized] = useState<boolean>(defaultMaximized);

  const isMax = controlledMaximized !== undefined ? controlledMaximized : internalMaximized;

  const handleToggleMaximize = () => {
    if (onToggleMaximize) {
      onToggleMaximize();
    } else {
      setInternalMaximized((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div
        className={cn(
          "bg-[#1c0c07]/95 border-2 border-amber-500/60 rounded-2xl shadow-2xl shadow-black/95 text-stone-100 flex flex-col relative animate-in zoom-in-95 duration-150 overflow-hidden transition-all duration-200",
          isMax
            ? "w-full max-w-[98vw] h-[95vh] max-h-[95vh]"
            : cn("w-full h-[88vh] max-h-[780px] min-h-[520px]", maxWidthClass)
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Fixed Header (Gothic Castlevania Theme, matches pause modal) */}
        <div className="shrink-0 px-4 md:px-6 py-3 border-b border-amber-500/40 bg-[#140602]/90 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            {icon ? (
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-amber-500/50 bg-black/70 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-serif font-black text-[#fbbf24] tracking-wide drop-shadow-md flex items-center gap-2 truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-stone-300 font-sans mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerRight}

            {allowMaximize && (
              <button
                onClick={handleToggleMaximize}
                className="p-1.5 md:p-2 rounded-xl bg-stone-900/90 hover:bg-[#2a130a] text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/60 transition-all cursor-pointer shadow-md active:translate-y-px"
                aria-label={isMax ? t("modalRestore") : t("modalMaximize")}
                title={isMax ? t("modalRestore") : t("modalMaximize")}
              >
                {isMax ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 md:p-2 rounded-xl bg-stone-900/90 hover:bg-[#2a130a] text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/60 transition-all cursor-pointer shadow-md active:translate-y-px"
              aria-label={t("closeModal")}
              title={t("closeModalHint")}
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content with Beautiful Stylized Scrollbar */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 md:p-5 flex flex-col gap-4 text-stone-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
