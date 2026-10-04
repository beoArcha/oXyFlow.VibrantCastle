import React, { useMemo } from "react";
import { FileJson } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CopyableSnippet } from "@ui";
import { useI18n } from "@context/I18nContext";
import { DebugGameSnapshot } from "./types";

export interface DebugStateDumpProps {
  stateObject: DebugGameSnapshot | Record<string, unknown>;
}

export const DebugStateDumpCard: React.FC<DebugStateDumpProps> = React.memo(function DebugStateDumpCard({
  stateObject,
}) {
  const { t } = useI18n();

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(stateObject, null, 2);
    } catch (err) {
      return JSON.stringify(
        { error: "Failed to serialize state object", details: String(err) },
        null,
        2
      );
    }
  }, [stateObject]);

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<FileJson className="w-4 h-4 text-amber-400" />}>
          {t("debugStateSnapshotTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CopyableSnippet
          text={jsonString}
          copyLabel={t("debugCopySnapshot")}
          copiedLabel={t("debugSnapshotCopied")}
          maxHeightClass="max-h-56"
        />
      </CardContent>
    </Card>
  );
});

DebugStateDumpCard.displayName = "DebugStateDumpCard";

export default DebugStateDumpCard;
