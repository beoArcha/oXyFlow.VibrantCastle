import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Terminal,
  Copy,
  Check,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  SearchInput,
  Select,
  Switch,
  Text,
  Badge,
  EmptyState,
  Code,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { LoggerManager, LogLevel, LogRecord, LogLevelName } from "@lib/logger";

const LEVEL_FILTERS: ReadonlyArray<"ALL" | LogLevelName> = [
  "ALL",
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "FATAL",
];

const GLOBAL_LEVEL_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: String(LogLevel.DEBUG), label: "DEBUG" },
  { value: String(LogLevel.INFO), label: "INFO" },
  { value: String(LogLevel.WARN), label: "WARN" },
  { value: String(LogLevel.ERROR), label: "ERROR" },
  { value: String(LogLevel.FATAL), label: "FATAL" },
];

function getBadgeVariant(level: LogLevelName): "stone" | "cyan" | "amber" | "red" {
  switch (level) {
    case "INFO":
      return "cyan";
    case "WARN":
      return "amber";
    case "ERROR":
    case "FATAL":
      return "red";
    default:
      return "stone";
  }
}

export const LogsSubtab: React.FC = () => {
  const { t } = useI18n();
  const loggerManager = LoggerManager.getInstance();

  const [logs, setLogs] = useState<readonly LogRecord[]>(() =>
    loggerManager.ringBuffer.getLogs()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState<"ALL" | LogLevelName>("ALL");
  const [globalLevel, setGlobalLevel] = useState<number>(loggerManager.defaultLevel);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedLogs, setCopiedLogs] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLogs(loggerManager.ringBuffer.getLogs());
    const unsub = loggerManager.ringBuffer.subscribe(() => {
      setLogs(loggerManager.ringBuffer.getLogs());
    });
    return unsub;
  }, [loggerManager]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((entry) => set.add(entry.category));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((entry) => {
      if (categoryFilter !== "ALL" && entry.category !== categoryFilter) {
        return false;
      }
      if (levelFilter !== "ALL" && entry.levelName !== levelFilter) {
        return false;
      }
      if (!q) return true;
      const inMsg = entry.message.toLowerCase().includes(q);
      const inCat = entry.category.toLowerCase().includes(q);
      const inErr = entry.error?.message?.toLowerCase().includes(q) ?? false;
      return inMsg || inCat || inErr;
    });
  }, [logs, searchQuery, categoryFilter, levelFilter]);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll]);

  const handleClear = useCallback(() => {
    loggerManager.ringBuffer.clear();
    setLogs([]);
  }, [loggerManager]);

  const handleCopyVisible = useCallback(async () => {
    const text = filteredLogs
      .map(
        (r) =>
          `[${r.timeFormatted}] [${r.levelName}] [${r.category}] ${r.message}${
            r.context ? ` | ${JSON.stringify(r.context)}` : ""
          }`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLogs(true);
      window.setTimeout(() => setCopiedLogs(false), 1800);
    } catch {
      setCopiedLogs(false);
    }
  }, [filteredLogs]);

  const handleDownloadJson = useCallback(() => {
    const json = loggerManager.ringBuffer.exportAsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibrant-castle-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [loggerManager]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <div id="subtab-content-logs" className="flex flex-col gap-4">
      <Card variant="subtle">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <CardTitle icon={<Terminal className="w-4 h-4 text-emerald-400" />}>
                {t("debugEventLogTitle")}
              </CardTitle>
              <Text size="2xs" variant="muted">
                {t("debugEventLogSubtitle")}
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-stone-800 bg-black/30">
                <Text size="2xs" variant="muted">
                  {t("debugAutoScrollLabel")}
                </Text>
                <Switch
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                icon={copiedLogs ? <Check size={13} /> : <Copy size={13} />}
                className="whitespace-nowrap shrink-0 px-3"
                onClick={handleCopyVisible}
              >
                {copiedLogs ? t("debugSnapshotCopied") : t("debugCopyBtn")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<Download size={13} />}
                className="whitespace-nowrap shrink-0 px-3"
                onClick={handleDownloadJson}
              >
                JSON
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={<Trash2 size={13} />}
                className="whitespace-nowrap shrink-0 px-3"
                onClick={handleClear}
              >
                {t("debugClearBtn")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {/* Filter Controls */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <SearchInput
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                placeholder={t("debugFilterPlaceholder")}
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: "ALL", label: t("debugAllCategories") },
                ...categories.map((cat) => ({ value: cat, label: cat })),
              ]}
              containerClassName="w-52"
              size="sm"
            />
            <Select
              label={t("debugGlobalLogLevelLabel")}
              value={String(globalLevel)}
              onChange={(e) => {
                const lvl = Number(e.target.value) as LogLevel;
                setGlobalLevel(lvl);
                loggerManager.setDefaultLevel(lvl);
              }}
              options={[...GLOBAL_LEVEL_OPTIONS]}
              containerClassName="w-36"
              size="sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {LEVEL_FILTERS.map((lvl) => (
                <Button
                  key={lvl}
                  size="sm"
                  variant={levelFilter === lvl ? "primary" : "secondary"}
                  className="whitespace-nowrap shrink-0 px-2.5 font-mono"
                  onClick={() => setLevelFilter(lvl)}
                >
                  {lvl}
                </Button>
              ))}
            </div>
            <Text size="2xs" family="mono" variant="muted" className="tabular-nums">
              {filteredLogs.length} / {logs.length}
            </Text>
          </div>

          {/* Log Stream */}
          <div
            ref={listRef}
            className="rounded-xl border border-stone-800 bg-black/50 max-h-[420px] overflow-y-auto divide-y divide-stone-800/70"
          >
            {filteredLogs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={
                    logs.length === 0
                      ? t("debugEmptyLog")
                      : t("debugNoFilterResults")
                  }
                />
              </div>
            ) : (
              filteredLogs.map((record) => {
                const hasDetails = Boolean(record.context || record.error);
                const isExpanded = Boolean(expandedIds[record.id]);
                return (
                  <div key={record.id} className="px-3 py-2 flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Text
                        size="2xs"
                        family="mono"
                        variant="muted"
                        className="tabular-nums shrink-0"
                      >
                        {record.timeFormatted}
                      </Text>
                      <Badge variant={getBadgeVariant(record.levelName)}>
                        {record.levelName}
                      </Badge>
                      <Code size="2xs">{record.category}</Code>
                      <Text size="xs" className="text-stone-100 flex-1 min-w-[200px] break-words">
                        {record.message}
                      </Text>
                      {hasDetails && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={
                            isExpanded ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )
                          }
                          className="whitespace-nowrap shrink-0 px-2"
                          onClick={() => toggleExpand(record.id)}
                        >
                          {isExpanded
                            ? t("debugCollapseDetails")
                            : t("debugExpandDetails")}
                        </Button>
                      )}
                    </div>

                    {hasDetails && isExpanded && (
                      <div className="ml-4 p-2.5 rounded-lg bg-stone-950 border border-stone-800 flex flex-col gap-2">
                        {record.context && (
                          <pre className="text-[11px] font-mono text-stone-300 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(record.context, null, 2)}
                          </pre>
                        )}
                        {record.error && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <Text size="2xs" weight="bold" className="text-red-400">
                                {record.error.name}: {record.error.message}
                              </Text>
                              {record.error.stack && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  icon={<Copy size={11} />}
                                  className="whitespace-nowrap shrink-0 px-2"
                                  onClick={() =>
                                    navigator.clipboard?.writeText(
                                      record.error?.stack ?? ""
                                    )
                                  }
                                >
                                  {t("debugCopyStackTrace")}
                                </Button>
                              )}
                            </div>
                            {record.error.stack && (
                              <pre className="text-[11px] font-mono text-red-300/90 overflow-x-auto whitespace-pre-wrap">
                                {record.error.stack}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

LogsSubtab.displayName = "LogsSubtab";
export default LogsSubtab;
