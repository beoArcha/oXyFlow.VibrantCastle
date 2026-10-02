import React from "react";
import { X } from "lucide-react";
import { Badge, IconButton } from "@components/ui";
import { GameBaseError } from "@lib/errors";

export interface AtlasStatusBarErrorBannerProps {
  error: GameBaseError;
  onClearError?: () => void;
}

export const AtlasStatusBarErrorBanner: React.FC<AtlasStatusBarErrorBannerProps> = ({
  error,
  onClearError,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/80 border-t border-red-800 text-xs text-rose-200 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="red" className="text-[9px] uppercase font-mono">
          {error.code}
        </Badge>
        <span className="truncate font-semibold">{error.message}</span>
        {error.details && (
          <span className="text-[10px] text-rose-400/80 font-mono truncate">
            {JSON.stringify(error.details)}
          </span>
        )}
      </div>
      {onClearError && (
        <IconButton
          size="xs"
          variant="ghost"
          aria-label="Dismiss error"
          onClick={onClearError}
          className="text-rose-400 hover:text-rose-100"
        >
          <X size={13} />
        </IconButton>
      )}
    </div>
  );
};

export default AtlasStatusBarErrorBanner;
