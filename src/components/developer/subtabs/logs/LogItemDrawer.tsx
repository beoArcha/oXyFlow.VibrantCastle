import React from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../../../hooks/useI18n";
import { SerializedError } from "../../../../lib/logger";

export interface LogItemDrawerProps {
  context?: Record<string, unknown>;
  error?: SerializedError;
}

export const LogItemDrawer: React.FC<LogItemDrawerProps> = ({ context, error }) => {
  const { t } = useI18n();

  const handleCopyStack = () => {
    if (error?.stack && navigator.clipboard) {
      navigator.clipboard.writeText(error.stack).catch(() => {});
    }
  };

  return (
    <div className="border-t border-stone-800/80 bg-black/80 p-3 flex flex-col gap-2 text-[11px] animate-in slide-in-from-top-1 duration-100">
      {/* Structured Context */}
      {context && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
            Structured Log Context:
          </span>
          <pre className="p-2 rounded bg-stone-950 border border-stone-800 text-amber-200/90 overflow-x-auto text-[10px] font-mono leading-relaxed">
            {JSON.stringify(context, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Stack Trace */}
      {error && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <AlertTriangle size={11} />
              <span>
                {error.name}: {error.message}
              </span>
            </span>
            {error.stack && (
              <button
                type="button"
                onClick={handleCopyStack}
                className="text-[9px] text-stone-400 hover:text-stone-200 font-mono underline cursor-pointer"
              >
                {t("debugCopyStackTrace")}
              </button>
            )}
          </div>
          {error.stack && (
            <pre className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-rose-200 overflow-x-auto text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default LogItemDrawer;
