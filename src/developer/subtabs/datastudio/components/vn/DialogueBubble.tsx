import React from "react";
import { UserCheck, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@ui";
import { useI18n } from "@context/I18nContext";
import { VisualNovelNodeSchema } from "@lib/schemas/visualNovelSchema";

export interface DialogueBubbleProps {
  readonly node: VisualNovelNodeSchema;
  readonly activeSpeakerName: string;
  readonly isNarrator: boolean;
  readonly onSelectNode: (nodeId: string) => void;
  readonly className?: string;
}

/**
 * Visual Novel dialogue bubble presentation component, rendering speech transcript,
 * speaker metadata, narrative choices and scene progression buttons.
 */
export const DialogueBubble: React.FC<DialogueBubbleProps> = ({
  node,
  activeSpeakerName,
  isNarrator,
  onSelectNode,
  className = "",
}) => {
  const { t } = useI18n();

  return (
    <section
      aria-label={t("dataStudioVnSpeakerSpeechAria")}
      aria-live="polite"
      className={`w-full bg-stone-950/90 border border-amber-800/60 rounded-lg p-3.5 flex flex-col justify-between gap-3 shadow-lg ${className}`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
          <span className="flex items-center gap-1.5">
            {isNarrator ? (
              <BookOpen size={14} className="text-amber-400" />
            ) : (
              <UserCheck size={14} className="text-amber-300" />
            )}
            <span className="uppercase tracking-wider">{activeSpeakerName}</span>
          </span>
          <span className="font-mono text-[10px] text-amber-200/50">
            {t("dataStudioVnNodeLabel")}: {node.id}
          </span>
        </div>
        <p className="text-xs text-amber-100/90 leading-relaxed italic bg-black/30 p-2.5 rounded border border-amber-950/40">
          "{t(node.dialogueKey)}"
        </p>
      </div>

      <div className="flex flex-col gap-1.5 pt-2 border-t border-amber-900/40">
        {node.choices && node.choices.length > 0 ? (
          <div role="group" aria-label={t("dataStudioVnPlayerDecisions")} className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-amber-200/60 uppercase tracking-wider">
              {t("dataStudioVnPlayerDecisions")}
            </span>
            <div className="flex flex-wrap gap-2">
              {node.choices.map((choice) => (
                <Button
                  key={choice.choiceId}
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectNode(choice.targetNodeId)}
                >
                  {t(choice.textKey)}
                </Button>
              ))}
            </div>
          </div>
        ) : node.nextNodeId ? (
          <Button
            variant="primary"
            size="sm"
            className="self-end"
            icon={<ChevronRight size={13} />}
            onClick={() => {
              if (node.nextNodeId) {
                onSelectNode(node.nextNodeId);
              }
            }}
          >
            {t("dataStudioVnContinueDialogue")}
          </Button>
        ) : (
          <span className="text-[11px] text-emerald-400 font-medium self-end">
            • {t("dataStudioVnEndOfScene")}
          </span>
        )}
      </div>
    </section>
  );
};
