import React from "react";
import { ScrollText, ArrowDownCircle, Copy, Check, Download, Trash2 } from "lucide-react";
import { Button } from "@components/ui";
import { useI18n } from "@hooks/useI18n";

export interface LogsHeaderToolbarProps {
  filteredCount: number;
  totalCount: number;
  autoScroll: boolean;
  copied: boolean;
  onToggleAutoScroll: () => void;
  onCopyLogs: () => void;
  onDownloadLogs: () => void;
  onClearLogs: () => void;
}

export const LogsHeaderToolbar: React.FC<LogsHeaderToolbarProps> = ({
  filteredCount,
  totalCount,
  autoScroll,
  copied,
  onToggleAutoScroll,
  onCopyLogs,
  onDownloadLogs,
  onClearLogs,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Title and live counter badge */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
          <ScrollText size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-amber-300 tracking-wide font-serif">
              {t("debugEventLogTitle")}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {filteredCount} / {totalCount}
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            {t("debugEventLogSubtitle")}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleAutoScroll}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${autoScroll
              ? "bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm"
              : "bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200"
            }`}
          title={t("debugAutoScrollToggle")}
        >
          <ArrowDownCircle size={13} className={autoScroll ? "text-amber-400" : "text-stone-500"} />
          <span>{t("debugAutoScrollLabel")}</span>
        </button>

        <Button
          size="sm"
          variant="outline"
          icon={copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          onClick={onCopyLogs}
          title={t("debugCopyVisibleLogs")}
          className="text-xs text-stone-300 hover:text-white"
        >
          {t("debugCopyBtn")}
        </Button>

        <Button
          size="sm"
          variant="outline"
          icon={<Download size={13} />}
          onClick={onDownloadLogs}
          title={t("debugDownloadLogsJson")}
          className="text-xs text-stone-300 hover:text-white"
        >
          JSON
        </Button>

        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 size={13} className="text-rose-400" />}
          onClick={onClearLogs}
          title={t("debugClearLog")}
          className="text-xs text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 border border-rose-900/50"
        >
          {t("debugClearBtn")}
        </Button>
      </div>
    </div>
  );
};

export default LogsHeaderToolbar;
