import React from "react";
import { GameErrorContainer } from "./GameErrorContainer";
import { GameErrorIcon } from "./GameErrorIcon";
import { GameErrorTitle } from "./GameErrorTitle";
import { GameErrorDescription } from "./GameErrorDescription";
import { GameErrorDetails } from "./GameErrorDetails";
import { GameErrorActions } from "./GameErrorActions";
import { GameErrorRetryButton } from "./GameErrorRetryButton";
import { GameErrorCopyButton } from "./GameErrorCopyButton";
import { GameErrorReloadButton } from "./GameErrorReloadButton";

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
