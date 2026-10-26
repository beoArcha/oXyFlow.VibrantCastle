import React from "react";
import { Badge, Alert, Text } from "@ui";
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
          <Badge variant="red" className="text-[9px] uppercase shrink-0">
            <Text as="span" family="mono" size="3xs">{error.code}</Text>
          </Badge>
          <Text as="span" weight="semibold" className="truncate">{error.message}</Text>
        </div>
      }
    >
      {error.details && (
        <Text as="span" family="mono" size="3xs" className="text-rose-400/80 truncate block">
          {JSON.stringify(error.details)}
        </Text>
      )}
    </Alert>
  );
};

export default AtlasStatusBarErrorBanner;
