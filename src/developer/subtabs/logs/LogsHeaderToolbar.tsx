import React from "react";
import { ScrollText, ArrowDownCircle, Copy, Check, Download, Trash2 } from "lucide-react";
import { Button, Heading, Paragraph, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { LogsHeaderToolbarProps } from "./types";

/**
 * Header toolbar for the logs terminal offering counters and global batch actions.
 */
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
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
          <ScrollText size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Heading level={2} size="sm" variant="gothic" className="tracking-wide">
              {t("debugEventLogTitle")}
            </Heading>
            <Text as="span" family="mono" weight="bold" size="2xs" className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {filteredCount} / {totalCount}
            </Text>
          </div>
          <Paragraph size="xs" variant="muted" className="text-[11px]">
            {t("debugEventLogSubtitle")}
          </Paragraph>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant={autoScroll ? "primary" : "outline"}
          icon={
            <ArrowDownCircle
              size={13}
              className={autoScroll ? "text-amber-200" : "text-stone-400"}
            />
          }
          onClick={onToggleAutoScroll}
          title={t("debugAutoScrollToggle")}
          aria-pressed={autoScroll}
          className="text-xs"
        >
          {t("debugAutoScrollLabel")}
        </Button>

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
