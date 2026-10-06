import { LanguageCode, SettingsAudioI18n } from "../../types";

export const settingsAudioTranslations: Record<LanguageCode, SettingsAudioI18n> = {
  pl: {
    tabAudio: "Dźwięk i Muzyka",
    audioPresetsLabel: "Szybki wybór:",
    audioMute: "Wycisz",
    audioTestSfxBtn: "Test Dźwięku",
    audioTestMagicBtn: "Test Magii",
    soundVolume: "Głośność efektów",
    musicVolume: "Głośność muzyki (BGM)",
    soundEffectsVolume: "Efekty Dźwiękowe (SFX)",
  },
  en: {
    tabAudio: "Audio & Music",
    audioPresetsLabel: "Quick Presets:",
    audioMute: "Mute",
    audioTestSfxBtn: "Test SFX",
    audioTestMagicBtn: "Test Magic",
    soundVolume: "Master Volume",
    musicVolume: "Music Volume (BGM)",
    soundEffectsVolume: "Sound Effects (SFX)",
  },
};
