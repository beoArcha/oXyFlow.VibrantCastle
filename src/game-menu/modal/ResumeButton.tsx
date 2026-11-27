import React from "react";
import { Play } from "lucide-react";
import { useI18n } from "@context/I18nContext";
import { Button, Text, Code } from "@ui";

export interface ResumeButtonProps {
  readonly onResume: () => void;
  readonly className?: string;
}

/**
 * Header-level Resume [P] action button for the player-facing game dialog.
 */
export const ResumeButton: React.FC<ResumeButtonProps> = React.memo(
  function ResumeButton({ onResume, className = "" }) {
    const { t } = useI18n();

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onResume}
        className={`gap-1.5 px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 hover:text-white border border-emerald-600/60 transition-all shadow-md hover:shadow-emerald-900/40 focus-visible:ring-emerald-400 whitespace-nowrap shrink-0 ${className}`}
        title={`${t("resume")} [P]`}
        aria-label={`${t("resume")} [P]`}
      >
        <Play size={13} className="text-emerald-400 fill-emerald-400 shrink-0" />
        <Text size="xs" weight="bold">
          {t("resume")}
        </Text>
        <Code
          size="xs"
          className="text-[10px] bg-emerald-900/90 text-emerald-300 px-1 py-0.5 rounded leading-none border-0"
        >
          [P]
        </Code>
      </Button>
    );
  }
);

ResumeButton.displayName = "ResumeButton";
export default ResumeButton;
