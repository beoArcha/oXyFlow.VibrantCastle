import React, { useState } from "react";
import { FileJson, Copy, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";

export interface DebugStateDumpProps {
  stateObject: Record<string, unknown>;
}

export const DebugStateDumpCard: React.FC<DebugStateDumpProps> = ({ stateObject }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState<boolean>(false);

  const jsonString = JSON.stringify(stateObject, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard errors if denied
    }
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle icon={<FileJson className="w-4 h-4 text-amber-400" />}>
            {t("debugStateSnapshotTitle")}
          </CardTitle>
          <Button
            size="sm"
            variant={copied ? "primary" : "secondary"}
            icon={copied ? <Check size={12} /> : <Copy size={12} />}
            onClick={handleCopy}
            className="text-xs py-1"
          >
            {copied ? t("debugSnapshotCopied") : t("debugCopySnapshot")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="p-3 bg-[#0a0301] rounded-xl border border-stone-900 text-[11px] font-mono text-amber-200/90 overflow-x-auto max-h-56 custom-scrollbar select-all">
          {jsonString}
        </pre>
      </CardContent>
    </Card>
  );
};

export default DebugStateDumpCard;
