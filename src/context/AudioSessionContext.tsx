import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { SoundType } from "@game/types";
import { gameAudio } from "@game/engine/audioEngine";
import { MissingContextProviderError } from "@lib/errors";
import { BaseProviderProps } from "./IContext";

export interface AudioSessionContextValue {
  isAudioInitialized: boolean;
  initializeAudio: () => void;
  playPreviewSFX: (type: "slash" | "magic") => void;
}

const AudioSessionContext = createContext<AudioSessionContextValue | null>(
  null
);

export interface AudioSessionProviderProps extends BaseProviderProps {
  onNotification?: (msg: string) => void;
}

/**
 * Context provider managing Web Audio gesture initialization and preview SFX playback.
 */
export const AudioSessionProvider: React.FC<AudioSessionProviderProps> = ({
  children,
  onNotification,
}) => {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const initializeAudio = useCallback(() => {
    gameAudio.init();
    setIsAudioInitialized((alreadyInit) => {
      if (!alreadyInit && onNotification) {
        onNotification("Audio initialized");
      }
      return true;
    });
  }, [onNotification]);

  const playPreviewSFX = useCallback((type: "slash" | "magic") => {
    gameAudio.init();
    setIsAudioInitialized(true);
    gameAudio.playSFX(
      type === "magic" ? SoundType.SFX_MAGIC_BOLT : SoundType.SFX_SLASH
    );
  }, []);

  const value = useMemo<AudioSessionContextValue>(
    () => ({
      isAudioInitialized,
      initializeAudio,
      playPreviewSFX,
    }),
    [isAudioInitialized, initializeAudio, playPreviewSFX]
  );

  return (
    <AudioSessionContext.Provider value={value}>
      {children}
    </AudioSessionContext.Provider>
  );
};

/**
 * Hook providing access to audio session initialization and preview sound triggers.
 *
 * @throws {MissingContextProviderError} when used outside an AudioSessionProvider.
 */
export function useAudioSession(): AudioSessionContextValue {
  const context = useContext(AudioSessionContext);
  if (!context) {
    throw new MissingContextProviderError(
      "useAudioSession",
      "AudioSessionProvider"
    );
  }
  return context;
}
