import { Player, Enemy, Entity, PlayerId, AnimationState, CollisionType } from "../types";
import { createDefaultInventory } from "../logic/inventory";
import { getDefaultSkillsForCharacter } from "../logic/skills";
import { LocationId, LocationDefinition } from "./types";
import { getLocation, LOCATION_REGISTRY } from "./registry";

export interface LoadedLevelState {
  players: Player[];
  enemies: Enemy[];
  entities: Entity[];
  levelWidth: number;
  levelHeight: number;
  spawnPoint: { x: number; y: number };
  location: LocationDefinition;
}

/**
 * Level designer delegator.
 * Builds level states dynamically from modular location definition files.
 */
export class LevelDesigner {
  /**
   * Universal parameterized factory for player entity instances.
   * Couples mechanical physics slot (PlayerId) with selectable RPG identity (CharacterId).
   */
  public static createPlayerEntity(
    playerId: PlayerId,
    characterId: "valen" | "aurelia",
    x: number,
    y: number
  ): Player {
    const isValen = characterId === "valen";
    const defaults = getDefaultSkillsForCharacter(characterId);

    return {
      id: playerId,
      characterId,
      characterName: isValen ? "Valen" : "Aurelia",
      levelGroup: 1,
      characterTier: 1,
      x,
      y,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      isGrounded: false,
      isCrouching: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpHoldTimer: 0,
      isJumping: false,
      wasGrounded: false,
      squashStretchScaleX: 1,
      squashStretchScaleY: 1,
      standingPlatformId: null,
      platformVelocityX: 0,
      platformVelocityY: 0,
      health: 100,
      maxHealth: 100,
      mana: 100,
      maxMana: 100,
      stamina: 100,
      maxStamina: 100,
      isDead: false,
      facingLeft: false,
      attackCooldown: 0,
      dashCooldown: 0,
      isDashing: false,
      isBackstepping: false,
      dashTime: 0,
      isAttacking: false,
      attackTime: 0,
      magicCooldown: 0,
      isCasting: false,
      castTime: 0,
      shieldActiveTime: 0,
      primarySpellId: defaults.primarySpellId,
      secondarySpellId: defaults.secondarySpellId,
      skillPoints: defaults.skillPoints,
      score: 0,
      inventory: createDefaultInventory(),
      unlockedSkills: [...defaults.unlockedSkills],
      autoSkillTimer: 0,
      animationState: AnimationState.Idle,
    };
  }

  public static createDefaultP1(x: number, y: number): Player {
    return LevelDesigner.createPlayerEntity(PlayerId.Player1, "valen", x, y);
  }

  public static createDefaultP2(x: number, y: number): Player {
    return LevelDesigner.createPlayerEntity(PlayerId.Player2, "aurelia", x, y);
  }

  public static createLocationState(
    locationId: LocationId = "courtyard",
    isTwoPlayer: boolean = false,
    spawnPointOverride?: { x: number; y: number },
    existingPlayers?: Player[],
    p1CharacterId: "valen" | "aurelia" = "valen"
  ): LoadedLevelState {
    const loc = getLocation(locationId);
    const spawn = spawnPointOverride || loc.spawnPoint;

    let players: Player[];

    if (existingPlayers && existingPlayers.length > 0) {
      // Retain RPG progression, inventory, health & unlocked skills across locations.
      // STRICTLY PRESERVE the active player session count: 1P remains 1P, 2P remains 2P.
      // Portal level transitions must NEVER mutate the session mode or inject unrequested players.
      players = existingPlayers.map((p, idx) => {
        const offset = idx === 0 ? { x: 0, y: 0 } : loc.p2SpawnOffset;
        return {
          ...p,
          x: spawn.x + offset.x,
          y: spawn.y + offset.y,
          vx: 0,
          vy: 0,
          isGrounded: false,
          isCrouching: false,
          isJumping: false,
          standingPlatformId: null,
          platformVelocityX: 0,
          platformVelocityY: 0,
          isAttacking: false,
          isDashing: false,
          isBackstepping: false,
          dashTime: 0,
          attackTime: 0,
          isDead: false,
          animationState: AnimationState.Idle,
        };
      });
    } else {
      const p2CharacterId: "valen" | "aurelia" = p1CharacterId === "valen" ? "aurelia" : "valen";
      players = [LevelDesigner.createPlayerEntity(PlayerId.Player1, p1CharacterId, spawn.x, spawn.y)];

      if (isTwoPlayer) {
        players.push(
          LevelDesigner.createPlayerEntity(
            PlayerId.Player2,
            p2CharacterId,
            spawn.x + loc.p2SpawnOffset.x,
            spawn.y + loc.p2SpawnOffset.y
          )
        );
      }
    }

    const effectiveTwoPlayer = players.length > 1;
    const entities = loc.createEntities(effectiveTwoPlayer);
    const enemies = loc.createEnemies(effectiveTwoPlayer);

    // Safety guarantee: ensure no player spawns overlapping any portal bounding box
    const portalEntities = entities.filter((e) => e.type === CollisionType.Goal);
    for (const p of players) {
      for (const portal of portalEntities) {
        const padding = 15;
        const overlapsPortal =
          p.x < portal.x + portal.width + padding &&
          p.x + p.width > portal.x - padding &&
          p.y < portal.y + portal.height + padding &&
          p.y + p.height > portal.y - padding;

        if (overlapsPortal) {
          // Push player safely to the side with greater space
          if (portal.x < loc.width / 2) {
            p.x = portal.x + portal.width + 30;
          } else {
            p.x = portal.x - p.width - 30;
          }
        }
      }
    }

    return {
      players,
      enemies,
      entities,
      levelWidth: loc.width,
      levelHeight: loc.height,
      spawnPoint: loc.spawnPoint,
      location: loc,
    };
  }

  /**
   * Backwards compatible helper
   */
  public static createTrainingLevel(isTwoPlayer: boolean) {
    return this.createLocationState("grand_bastion", isTwoPlayer);
  }
}

export { LOCATION_REGISTRY };
export default LevelDesigner;
