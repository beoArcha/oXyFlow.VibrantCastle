import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../hooks/useI18n";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  maxWidthClass?: string;
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
  children,
}) => {
  const { t } = useI18n();
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
      <div
        className={cn(
          "bg-[#1c0c07]/95 border-2 border-amber-500/60 rounded-2xl w-full h-[88vh] max-h-[780px] min-h-[520px] shadow-2xl shadow-black/95 text-stone-100 flex flex-col relative animate-in zoom-in-95 duration-150 overflow-hidden",
          maxWidthClass
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Fixed Header (Gothic Castlevania Theme, matches pause modal) */}
        <div className="shrink-0 px-5 md:px-6 py-3.5 border-b border-amber-500/40 bg-[#140602]/90 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            {icon ? (
              <div className="w-10 h-10 rounded-full border border-amber-500/50 bg-black/70 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
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
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 rounded-xl bg-stone-900/90 hover:bg-[#2a130a] text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/60 transition-all cursor-pointer shadow-md active:translate-y-px"
              aria-label={t("closeModal")}
              title={t("closeModalHint")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content with Beautiful Stylized Scrollbar */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 flex flex-col gap-4 text-stone-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
