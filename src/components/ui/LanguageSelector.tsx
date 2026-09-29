import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";

export interface LanguageSelectorProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  showIcon = true,
}) => {
  const { language, setLanguage } = useI18n();

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1 bg-[#120502] border border-amber-500/30 rounded-xl select-none shadow-sm",
        className
      )}
      role="group"
      aria-label="Language selection"
    >
      {showIcon && <Languages className="w-3.5 h-3.5 text-amber-400 ml-1 shrink-0" />}
      <button
        type="button"
        onClick={() => setLanguage("pl")}
        className={cn(
          "px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
          language === "pl"
            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400 shadow-xs"
            : "text-stone-400 hover:text-stone-200"
        )}
        title="Polski"
      >
        PL
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={cn(
          "px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
          language === "en"
            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400 shadow-xs"
            : "text-stone-400 hover:text-stone-200"
        )}
        title="English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
