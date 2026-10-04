import { LocationId } from "@game/locations";
import { BackgroundLayerTier } from "@game/locations/schema/locationSchema";
import { MonsterOption, MusicIntensityPreset } from "./types";

/**
 * List of primary location IDs available for testing level loading and teleportation.
 */
export const LOCATION_IDS: readonly LocationId[] = [
  "courtyard",
  "thorn_chasm",
  "grand_bastion",
  "clocktower",
  "aether_sanctuary",
] as const;

/**
 * Available monster templates for the debug spawner tool.
 */
export const MONSTER_ID_LIST: readonly MonsterOption[] = [
  { id: "training_dummy", translationKey: "enemyTrainingDummy" },
  { id: "court_sentinel", translationKey: "enemyCourtSentinel" },
  { id: "chasm_crawler", translationKey: "enemyChasmCrawler" },
  { id: "bastion_gargoyle", translationKey: "enemyBastionGargoyle" },
  { id: "bastion_sentinel_boss", translationKey: "enemyBastionSentinelBoss" },
  { id: "clockwork_automaton", translationKey: "enemyClockworkAutomaton" },
  { id: "aether_wisp", translationKey: "enemyAetherWisp" },
] as const;

/**
 * Discrete simulation speed multipliers for game time dilation.
 */
export const TIME_SCALE_OPTIONS: readonly number[] = [0.25, 0.5, 1.0, 2.0, 4.0] as const;

/**
 * Audio intensity presets for dynamic background music testing.
 */
export const MUSIC_INTENSITY_PRESETS: readonly MusicIntensityPreset[] = [
  { labelKey: "testerMusicChill", val: 0.1 },
  { labelKey: "testerMusicSuspense", val: 0.4 },
  { labelKey: "testerMusicCombat", val: 0.7 },
  { labelKey: "testerMusicClimax", val: 1.0 },
] as const;

/**
 * Parallax depth tiers order for background inspection.
 */
export const PARALLAX_TIERS: readonly BackgroundLayerTier[] = [
  "far",
  "mid_far",
  "mid",
  "mid_close",
  "close",
] as const;

/**
 * Fast currency injection presets.
 */
export const GOLD_PRESETS: readonly number[] = [100, 1000, 10000] as const;

/**
 * Critical health threshold testing values.
 */
export const QUICK_HP_PRESETS: readonly number[] = [1, 50] as const;
