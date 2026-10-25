import React, { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@lib/utils";
import { Button } from "../../core/button";

export interface CopyableSnippetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Text content to display and copy to system clipboard */
  text: string;
  /** Optional title or description displayed in the snippet header */
  title?: React.ReactNode;
  /** Optional leading icon in the header */
  icon?: React.ReactNode;
  /** Custom label for the copy button */
  copyLabel?: string;
  /** Custom label displayed when copied */
  copiedLabel?: string;
  /** Duration in ms for the copied state before reset (default: 2500) */
  copyTimeoutMs?: number;
  /** Custom max-height class for scrollable pre container (default: 'max-h-56') */
  maxHeightClass?: string;
  /** Callback fired on successful clipboard write */
  onCopySuccess?: () => void;
  /** Callback fired on clipboard error (e.g. denied permissions) */
  onCopyError?: (err: unknown) => void;
}

/**
 * Monospace text container with copy to clipboard functionality.
 */
export const CopyableSnippet = React.memo(
  React.forwardRef<HTMLDivElement, CopyableSnippetProps>(function CopyableSnippet(
    {
      text,
      title,
      icon,
      copyLabel = "Copy",
      copiedLabel = "Copied!",
      copyTimeoutMs = 2500,
      maxHeightClass = "max-h-56",
      onCopySuccess,
      onCopyError,
      className,
      ...props
    },
    ref
  ) {
    const [copied, setCopied] = useState<boolean>(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Lifecycle cleanup: prevent memory leaks and unmounted state updates
    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, []);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          setCopied(false);
          timerRef.current = null;
        }, copyTimeoutMs);

        onCopySuccess?.();
      } catch (err) {
        onCopyError?.(err);
      }
    }, [text, copyTimeoutMs, onCopySuccess, onCopyError]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2 rounded-xl bg-surface-darkest border border-stone-800/80 p-3",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between pb-1 border-b border-stone-800/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            {icon && <span className="text-amber-primary shrink-0">{icon}</span>}
            {title && <span>{title}</span>}
          </div>
          <Button
            size="sm"
            variant={copied ? "primary" : "secondary"}
            icon={copied ? <Check size={12} /> : <Copy size={12} />}
            onClick={handleCopy}
            className="text-xs py-0.5 px-2 h-7 ml-auto"
          >
            {copied ? copiedLabel : copyLabel}
          </Button>
        </div>

        <pre
          className={cn(
            "p-3 bg-surface-darkest rounded-lg border border-stone-900 text-[11px] font-mono text-amber-200/90 overflow-x-auto custom-scrollbar select-all leading-relaxed",
            maxHeightClass
          )}
        >
          {text}
        </pre>
      </div>
    );
  })
);

CopyableSnippet.displayName = "CopyableSnippet";
export default CopyableSnippet;
