/**
 * Simulation and gameplay domain enumerations.
 */

export enum PlayerId {
  Player1 = "player1",
  Player2 = "player2",
}

export enum AnimationState {
  Idle = "idle",
  Crouch = "crouch",
  Run = "run",
  Jump = "jump",
  Fall = "fall",
  Attack = "attack",
  Dash = "dash",
  Slide = "slide",
  Backstep = "backstep",
  Cast = "cast",
  Hit = "hit",
  Dead = "dead",
}

export enum SoundType {
  BGM_EXPLORE = "bgm_explore",
  BGM_COMBAT = "bgm_combat",
  SFX_JUMP = "sfx_jump",
  SFX_SLASH = "sfx_slash",
  SFX_DASH = "sfx_dash",
  SFX_HIT = "sfx_hit",
  SFX_SAVE = "sfx_save",
  SFX_UNLOCK = "sfx_unlock",
  SFX_MAGIC_BOLT = "sfx_magic_bolt",
  SFX_MAGIC_SHIELD = "sfx_magic_shield",
  SFX_POTION = "sfx_potion",
  SFX_SKILL_UNLOCK = "sfx_skill_unlock",
  SFX_SPELL_CAST = "sfx_magic_bolt",
  SFX_LEVEL_CLEAR = "sfx_save",
  SFX_LEVER = "sfx_unlock",
  SFX_DEFEAT = "sfx_hit",
  SFX_BUTTON_CLICK = "sfx_potion",
}

export enum CollisionType {
  Solid = "solid",
  OneWay = "oneway",
  Hazard = "hazard",
  Trigger = "trigger",
  Lever = "lever",
  Goal = "goal",
}

export enum MagicCategory {
  Offensive = "offensive",
  Defensive = "defensive",
}

export enum MagicTriggerType {
  Action = "action",
  Automatic = "automatic",
  Passive = "passive",
}

export enum ItemType {
  Weapon = "weapon",
  Shield = "shield",
  Helmet = "helmet",
  Armor = "armor",
  Amulet = "amulet",
  Ring = "ring",
  Potion = "potion",
}
