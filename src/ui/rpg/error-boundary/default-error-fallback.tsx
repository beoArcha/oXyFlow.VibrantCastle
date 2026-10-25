import React from "react";
import { GameErrorContainer } from "./error-container";
import { GameErrorIcon } from "./error-icon";
import { GameErrorTitle } from "./error-title";
import { GameErrorDescription } from "./error-description";
import { GameErrorDetails } from "./error-details";
import { GameErrorActions } from "./error-actions";
import { GameErrorRetryButton } from "./error-retry-button";
import { GameErrorCopyButton } from "./error-copy-button";
import { GameErrorReloadButton } from "./error-reload-button";

export interface DefaultGameErrorFallbackProps {
  className?: string;
}

/**
 * Standard complete gothic crash screen composed of GameErrorBoundary compound primitives.
 */
export const DefaultGameErrorFallback: React.FC<DefaultGameErrorFallbackProps> = React.memo(
  function DefaultGameErrorFallback({ className }) {
    return (
      <GameErrorContainer className={className}>
        <GameErrorIcon />

        <div className="flex flex-col gap-1">
          <GameErrorTitle />
          <GameErrorDescription />
        </div>

        <GameErrorDetails />

        <GameErrorActions>
          <GameErrorRetryButton />
          <GameErrorCopyButton />
          <GameErrorReloadButton />
        </GameErrorActions>
      </GameErrorContainer>
    );
  }
);

DefaultGameErrorFallback.displayName = "DefaultGameErrorFallback";
