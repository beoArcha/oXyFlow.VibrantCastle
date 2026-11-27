import React from "react";
import { ScrollText } from "lucide-react";
import { Card, CardContent, Button, Badge, Text } from "@ui";
import type { LogRecord } from "@lib/logger";

export interface AtlasSlicerLogStripProps {
  readonly slicerLogs: readonly LogRecord[];
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
  readonly onOpenLogs?: () => void;
}

/**
 * Collapsible event log strip filtering AtlasSlicing entries from LoggerManager.
 */
export const AtlasSlicerLogStrip: React.FC<AtlasSlicerLogStripProps> = ({
  slicerLogs,
  isOpen,
  onToggleOpen,
  onOpenLogs,
}) => (
  <Card variant="subtle">
    <CardContent className="p-2.5 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScrollText size={14} className="text-amber-400" />
          <Text size="xs" weight="semibold">
            Dziennik AtlasSlicing ({slicerLogs.length})
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleOpen}
            className="whitespace-nowrap shrink-0 px-2.5"
          >
            {isOpen ? "Zwiń logi" : "Rozwiń logi"}
          </Button>
          {onOpenLogs && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenLogs}
              className="whitespace-nowrap shrink-0 px-2.5"
            >
              Pełny Strumień Logów
            </Button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1 rounded-lg bg-black/50 p-2 border border-stone-800">
          {slicerLogs.length === 0 ? (
            <Text size="2xs" variant="muted">
              Brak zarejestrowanych zdarzeń AtlasSlicing.
            </Text>
          ) : (
            slicerLogs
              .slice()
              .reverse()
              .map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-2 text-[11px] font-mono text-stone-300"
                >
                  <Badge variant="stone">{rec.level}</Badge>
                  <span className="truncate">{rec.message}</span>
                </div>
              ))
          )}
        </div>
      )}
    </CardContent>
  </Card>
);
