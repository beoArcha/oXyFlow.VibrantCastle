import React from "react";
import { Activity, ExternalLink } from "lucide-react";
import { Badge, Button, EmptyState, Text, IconText } from "@ui";
import { useI18n } from "@context/I18nContext";
import { LogLevel, LogRecord } from "@lib/logger";

export interface AtlasStatusBarLogDrawerProps {
  logs: LogRecord[];
  onNavigateToLogs?: () => void;
}

export const AtlasStatusBarLogDrawer: React.FC<AtlasStatusBarLogDrawerProps> = ({
  logs,
  onNavigateToLogs,
}) => {
  const { t } = useI18n();

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return <Badge variant="red" className="text-[9px] px-1 py-0">ERROR</Badge>;
      case LogLevel.WARN:
        return <Badge variant="amber" className="text-[9px] px-1 py-0">WARN</Badge>;
      case LogLevel.INFO:
        return <Badge variant="cyan" className="text-[9px] px-1 py-0">INFO</Badge>;
      default:
        return <Badge variant="stone" className="text-[9px] px-1 py-0">DEBUG</Badge>;
    }
  };

  return (
    <div className="flex flex-col border-t border-stone-800 bg-black/90 p-2.5 max-h-[160px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-150 select-none">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-800/80 text-[11px]">
        <IconText
          icon={<Activity size={12} className="text-amber-400" />}
          size="2xs"
          weight="bold"
          transform="uppercase"
          tracking="wider"
          className="text-stone-400"
        >
          {t("atlasStudioRecentLogs") || "Recent slicer events"}
        </IconText>

        {onNavigateToLogs && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onNavigateToLogs}
            className="h-5 px-1.5 text-[10px] text-cyan-400 hover:text-cyan-200 min-h-0"
            leftIcon={<ExternalLink size={10} />}
          >
            {t("atlasStudioOpenLogsTab") || "Full view (Logs)"}
          </Button>
        )}
      </div>

      {logs.length === 0 ? (
        <EmptyState
          compact
          icon={<Activity size={16} className="text-stone-600" />}
          title={t("atlasStudioNoLogsYet") || "No slicer events recorded yet."}
          className="border-dashed py-3"
        />
      ) : (
        <Text as="div" family="mono" size="3xs" className="flex flex-col gap-1">
          {logs.slice(-10).reverse().map((entry, idx) => (
            <div
              key={`${entry.timestamp}_${idx}`}
              className="flex items-center justify-between p-1 rounded bg-[#100705] border border-stone-900 hover:border-stone-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-stone-600">{entry.timeFormatted}</span>
                {getLevelBadge(entry.level)}
                <Text as="span" weight="bold" className="text-amber-400/90">[{entry.category}]</Text>
                <span className="text-stone-300 truncate">{entry.message}</span>
              </div>
              {entry.context && (
                <span className="text-[9px] text-stone-500 truncate max-w-[150px] ml-2">
                  {JSON.stringify(entry.context)}
                </span>
              )}
            </div>
          ))}
        </Text>
      )}
    </div>
  );
};
