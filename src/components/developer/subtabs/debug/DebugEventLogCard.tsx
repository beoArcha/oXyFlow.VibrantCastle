import React, { useState } from "react";
import { ListFilter, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";

export interface LogEntry {
  id: string;
  time: string;
  type: "combat" | "magic" | "system" | "item";
  message: string;
}

export interface DebugEventLogProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
}

export const DebugEventLogCard: React.FC<DebugEventLogProps> = ({ logs, onClearLogs }) => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<string>("all");

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  const getTypeBadgeClass = (type: LogEntry["type"]) => {
    switch (type) {
      case "combat":
        return "bg-rose-950/70 text-rose-300 border-rose-800";
      case "magic":
        return "bg-cyan-950/70 text-cyan-300 border-cyan-800";
      case "item":
        return "bg-amber-950/70 text-amber-300 border-amber-800";
      default:
        return "bg-stone-900 text-stone-400 border-stone-800";
    }
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <CardTitle icon={<ListFilter className="w-4 h-4 text-amber-400" />}>
            {t("debugEventLogTitle")}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {["all", "combat", "magic", "item", "system"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                  filter === cat
                    ? "bg-amber-600 text-white border-amber-400"
                    : "bg-black/40 text-stone-400 border-stone-800 hover:border-amber-700"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
            {onClearLogs && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 size={12} />}
                onClick={onClearLogs}
                title={t("debugClearLog")}
                className="h-6 text-[10px] px-2 py-0 text-stone-400 hover:text-rose-400"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 p-2 bg-[#120502] rounded-xl border border-stone-800 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-500 font-mono">
              {t("debugEmptyLog")}
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors text-[11px]"
              >
                <span className="text-stone-500 text-[10px] shrink-0">{entry.time}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border shrink-0 ${getTypeBadgeClass(
                    entry.type
                  )}`}
                >
                  {entry.type}
                </span>
                <span className="text-stone-300 truncate">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugEventLogCard;
