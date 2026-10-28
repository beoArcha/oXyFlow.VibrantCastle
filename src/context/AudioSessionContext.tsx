import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import { SoundType } from "@game/types";
import { gameAudio } from "@game/engine/audioEngine";
import { useI18n } from "./I18nContext";
import { BaseProviderProps } from "./IContext";
import { MissingContextProviderError } from "@lib/errors";

export interface AudioSessionContextValue {
  isAudioInitialized: boolean;
  initializeAudio: () => void;
  playPreviewSFX: (type: "slash" | "magic") => void;
}

const AudioSessionContext = createContext<AudioSessionContextValue | null>(null);

export interface AudioSessionProviderProps extends BaseProviderProps {
  onNotification?: (msg: string) => void;
}

/**
 * Context provider managing audio hardware initialization, playback state, and sound effect previews.
 */
export const AudioSessionProvider: React.FC<AudioSessionProviderProps> = ({
  children,
  onNotification,
}) => {
  const { t } = useI18n();
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;
  const tRef = useRef(t);
  tRef.current = t;

  const initializeAudio = useCallback(() => {
    gameAudio.init();
    setIsAudioInitialized(true);
    if (onNotificationRef.current) {
      onNotificationRef.current(tRef.current("audioActivated"));
    }
  }, []);

  const playPreviewSFX = useCallback((type: "slash" | "magic") => {
    if (type === "slash") {
      gameAudio.playSFX(SoundType.SFX_SLASH);
    } else if (type === "magic") {
      gameAudio.playSFX(SoundType.SFX_MAGIC_BOLT);
    }
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
 * Hook providing access to audio state, initialization trigger, and sound preview playback.
 *
 * @throws {MissingContextProviderError} when used outside an AudioSessionProvider.
 */
export function useAudioSession(): AudioSessionContextValue {
  const context = useContext(AudioSessionContext);
  if (!context) {
    throw new MissingContextProviderError("useAudioSession", "AudioSessionProvider");
  }
  return context;
}
