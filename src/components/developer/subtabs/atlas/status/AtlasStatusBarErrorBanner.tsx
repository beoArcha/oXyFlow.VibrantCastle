import React from "react";
import { Badge, Alert } from "@components/ui";
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
    <Alert
      variant="danger"
      onClose={onClearError}
      closeAriaLabel="Dismiss error"
      className="rounded-none border-x-0 border-b-0 border-t py-1.5 px-3 select-none"
      title={
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="red" className="text-[9px] uppercase font-mono shrink-0">
            {error.code}
          </Badge>
          <span className="truncate font-semibold">{error.message}</span>
        </div>
      }
    >
      {error.details && (
        <span className="text-[10px] text-rose-400/80 font-mono truncate block">
          {JSON.stringify(error.details)}
        </span>
      )}
    </Alert>
  );
};

export default AtlasStatusBarErrorBanner;
