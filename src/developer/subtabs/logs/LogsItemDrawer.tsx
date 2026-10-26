import React from "react";
import { AlertTriangle, Braces } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { CopyableSnippet, Text, IconText } from "@ui";
import { LogItemDrawerProps } from "./types";
import { safeStringify } from "./utils";

/**
 * Collapsible drawer displaying formatted structured context and error stack traces for a log entry.
 */
export const LogsItemDrawer: React.FC<LogItemDrawerProps> = ({ context, error }) => {
  const { t } = useI18n();

  return (
    <div className="border-t border-stone-800/80 bg-black/80 p-3 flex flex-col gap-2.5 text-[11px] animate-in slide-in-from-top-1 duration-100">
      {context && (
        <CopyableSnippet
          text={safeStringify(context, 2)}
          title="Structured Log Context"
          icon={<Braces size={12} className="text-amber-400" />}
          copyLabel={t("debugCopyBtn")}
          className="border-stone-800/90 bg-stone-950 text-amber-200/90"
        />
      )}

      {error && (
        <div className="flex flex-col gap-1">
          {error.stack ? (
            <CopyableSnippet
              text={error.stack}
              title={`${error.name}: ${error.message}`}
              icon={<AlertTriangle size={12} className="text-rose-400" />}
              copyLabel={t("debugCopyStackTrace")}
              className="border-rose-900/50 bg-rose-950/20 text-rose-200"
            />
          ) : (
            <IconText
              icon={<AlertTriangle size={12} className="text-rose-400 shrink-0" />}
              family="mono"
              size="xs"
              className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-rose-200"
            >
              {error.name}: {error.message}
            </IconText>
          )}
        </div>
      )}
    </div>
  );
};

export const LogItemDrawer = LogsItemDrawer;
export default LogsItemDrawer;
