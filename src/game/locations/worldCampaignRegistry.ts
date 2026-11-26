import { LocationId, WorldId } from "./types";

export type StageArchetype =
  | "intro"
  | "exploration"
  | "gauntlet"
  | "stage_boss"
  | "vertical"
  | "secret_wing"
  | "siege"
  | "world_boss";

export type StageBuildStatus = "playable" | "planned";

export interface StageBlueprint {
  readonly code: string; // e.g. "W1-1" .. "W8-8"
  readonly worldId: WorldId;
  readonly worldIndex: number;
  readonly stageNumber: number;
  readonly titlePl: string;
  readonly titleEn: string;
  readonly archetype: StageArchetype;
  readonly status: StageBuildStatus;
  /** Playable location id when status === "playable". */
  readonly locationId?: LocationId;
  readonly bossScope?: "stage" | "world";
  readonly farLayerKey: string;
  readonly sharedLayerKeys: readonly string[];
  readonly bossLayerKey?: string;
}

export interface WorldCampaignDefinition {
  readonly index: number;
  readonly code: string; // "W1" .. "W8"
  readonly id: WorldId;
  readonly primaryLocationId: LocationId;
  readonly namePl: string;
  readonly nameEn: string;
  readonly themePl: string;
  readonly themeEn: string;
  readonly accentHex: string;
  readonly farLayerKey: string;
  readonly stageBossLayerKey: string;
  readonly worldBossLayerKey: string;
  readonly isNewWorld: boolean;
  readonly stages: readonly StageBlueprint[];
}

interface WorldSeed {
  readonly index: number;
  readonly id: WorldId;
  readonly namePl: string;
  readonly nameEn: string;
  readonly themePl: string;
  readonly themeEn: string;
  readonly accentHex: string;
  readonly isNewWorld: boolean;
  readonly sharedPresets: readonly [string, string, string, string];
  readonly stageTitles: readonly [
    [string, string],
    [string, string],
    [string, string],
    [string, string],
    [string, string],
    [string, string],
    [string, string],
    [string, string],
  ];
}

const ARCHETYPES_BY_STAGE: readonly StageArchetype[] = [
  "intro",
  "exploration",
  "gauntlet",
  "stage_boss",
  "vertical",
  "secret_wing",
  "siege",
  "world_boss",
];

const WORLD_SEEDS: readonly WorldSeed[] = [
  {
    index: 1,
    id: "courtyard",
    namePl: "Dziedziniec Zamkowy",
    nameEn: "Courtyard of Awakening",
    themePl: "Złoty zmierzch, brukowane arkady i ogród treningowy",
    themeEn: "Golden twilight, stone arcades, and training grounds",
    accentHex: "#f59e0b",
    isNewWorld: false,
    sharedPresets: [
      "shared:mid_far:courtyard_ramparts_a",
      "shared:mid:courtyard_arches_a",
      "shared:mid_close:autumn_trees_a",
      "shared:close:stone_battlements_a",
    ],
    stageTitles: [
      ["Brama Przebudzenia", "Gate of Awakening"],
      ["Ogród Arkad", "Arcade Gardens"],
      ["Zewnętrzny Mur", "Outer Ramparts"],
      ["Plac Próby Strażnika", "Sentinel's Trial Square"],
      ["Stare Koszary", "Old Barracks"],
      ["Skarbiec Bluszczu", "Ivy Vault"],
      ["Most Zwodzony", "Drawbridge Crossing"],
      ["Dziedziniec Sztandaru", "Banner Courtyard"],
    ],
  },
  {
    index: 2,
    id: "thorn_chasm",
    namePl: "Rozpadlina Cierni",
    nameEn: "Thorn Chasm",
    themePl: "Bursztynowa mgła, kolczaste przepaście i wąskie łuki",
    themeEn: "Amber mist, thorn gorges, and low stone archways",
    accentHex: "#ea580c",
    isNewWorld: false,
    sharedPresets: [
      "shared:mid_far:chasm_cliffs_a",
      "shared:mid:thorn_arches_a",
      "shared:mid_close:bramble_pillars_a",
      "shared:close:foreground_thorns_a",
    ],
    stageTitles: [
      ["Skraj Rozpadliny", "Chasm Overlook"],
      ["Mosty Pnączy", "Bramble Bridges"],
      ["Wąwóz Gargulców", "Gargoyle Gorge"],
      ["Leże Cierniowego Strażnika", "Thorn Warden's Lair"],
      ["Podwieszony Szlak", "Suspended Path"],
      ["Jaskinia Żywicy", "Amber Resin Cavern"],
      ["Półki Przepaści", "Abyssal Ledges"],
      ["Serce Cierni", "Heart of Thorns"],
    ],
  },
  {
    index: 3,
    id: "ashen_catacombs",
    namePl: "Katakumby Popiołu",
    nameEn: "Ashen Catacombs",
    themePl: "Podziemne krypty, żarzące szczeliny, łańcuchy i ossuaria",
    themeEn: "Subterranean crypts, glowing ember fissures, and iron chains",
    accentHex: "#f97316",
    isNewWorld: true,
    sharedPresets: [
      "shared:mid_far:chasm_cliffs_a",
      "shared:mid:catacomb_arches_a",
      "shared:mid_close:iron_battlements_a",
      "shared:close:stone_battlements_a",
    ],
    stageTitles: [
      ["Zejście do Ossuarium", "Ossuary Descent"],
      ["Korytarz Łańcuchów", "Hall of Chains"],
      ["Krypta Popielnych", "Crypt of the Ashen"],
      ["Kaplica Żaru", "Chapel of Embers"],
      ["Studnia Relikwii", "Relic Well"],
      ["Ukryty Grobowiec", "Hidden Sepulcher"],
      ["Most nad Piecem", "Furnace Span"],
      ["Bazylika Popiołu", "Basilica of Ash"],
    ],
  },
  {
    index: 4,
    id: "clocktower",
    namePl: "Wieża Zegarowa",
    nameEn: "Clockwork Tower",
    themePl: "Mosiężne koła zębate, windy pionowe i poligon kątowy",
    themeEn: "Brass cogs, vertical lifts, and angled precision firing lanes",
    accentHex: "#eab308",
    isNewWorld: false,
    sharedPresets: [
      "shared:mid_far:clockwork_pendulums_a",
      "shared:mid:clockface_hall_a",
      "shared:mid_close:brass_galleries_a",
      "shared:close:foreground_cogs_a",
    ],
    stageTitles: [
      ["Podstawa Wahadeł", "Pendulum Base"],
      ["Szyb Zębaty", "Cogwheel Shaft"],
      ["Galeria Sprężyn", "Mainspring Gallery"],
      ["Komnata Automatu", "Automaton Chamber"],
      ["Bliźniacze Windy", "Twin Elevators"],
      ["Skrytka Zegarmistrza", "Horologist's Nook"],
      ["Iglica Dzwonów", "Belfry Spire"],
      ["Wielka Tarcza Czasu", "Grand Dial of Time"],
    ],
  },
  {
    index: 5,
    id: "alchemist_library",
    namePl: "Biblioteka Alchemika",
    nameEn: "Alchemist's Library",
    themePl: "Szmaragdowe witraże, regały ksiąg, fiolki i astrolabia",
    themeEn: "Emerald skylights, towering bookshelves, flasks, and astrolabes",
    accentHex: "#10b981",
    isNewWorld: true,
    sharedPresets: [
      "shared:mid_far:aether_aqueduct_a",
      "shared:mid:alchemy_shelves_a",
      "shared:mid_close:brass_galleries_a",
      "shared:close:foreground_runes_a",
    ],
    stageTitles: [
      ["Czytelnia Szmaragdu", "Emerald Reading Hall"],
      ["Galerie Manuskryptów", "Manuscript Galleries"],
      ["Destylarnia Eteru", "Aether Distillery"],
      ["Rotunda Astrolabium", "Astrolabe Rotunda"],
      ["Piętra Zakazanych Tomów", "Forbidden Stacks"],
      ["Archiwum Pieczęci", "Archive of Seals"],
      ["Most Krystalizacji", "Crystallization Bridge"],
      ["Wielka Kopuła Alchemika", "Grand Alchemist's Dome"],
    ],
  },
  {
    index: 6,
    id: "aether_sanctuary",
    namePl: "Sanktuarium Eteru",
    nameEn: "Aether Sanctuary",
    themePl: "Astralny błękit, lewitujące wyspy i podniebny akwedukt",
    themeEn: "Astral azure, floating islets, and skyward aqueducts",
    accentHex: "#38bdf8",
    isNewWorld: false,
    sharedPresets: [
      "shared:mid_far:aether_aqueduct_a",
      "shared:mid:aether_islets_a",
      "shared:mid_close:astral_pillars_a",
      "shared:close:foreground_runes_a",
    ],
    stageTitles: [
      ["Schody Akweduktu", "Aqueduct Steps"],
      ["Archipelag Mgły", "Mist Archipelago"],
      ["Kładki Wiatru", "Windward Spans"],
      ["Ołtarz Archonta", "Archon's Altar"],
      ["Pionowe Monolity", "Ascending Monoliths"],
      ["Sanktuarium Ciszy", "Silent Sanctum"],
      ["Szlak Gwiazd", "Starlight Causeway"],
      ["Niebiańska Kopuła", "Celestial Dome"],
    ],
  },
  {
    index: 7,
    id: "grand_bastion",
    namePl: "Wielki Bastion",
    nameEn: "Grand Bastion",
    themePl: "Forteca oblężnicza, żelazne blanki i ciężkie starcia",
    themeEn: "Siege fortress, iron battlements, and armored frontline combat",
    accentHex: "#d97706",
    isNewWorld: false,
    sharedPresets: [
      "shared:mid_far:bastion_walls_a",
      "shared:mid:bastion_ramparts_a",
      "shared:mid_close:iron_battlements_a",
      "shared:close:foreground_towers_a",
    ],
    stageTitles: [
      ["Bramy Oblężnicze", "Siege Gates"],
      ["Główne Wały", "Great Ramparts"],
      ["Korytarz Strzelniczy", "Battlement Corridor"],
      ["Arena Komendanta", "Commander's Arena"],
      ["Baszta Wschodnia", "Eastern Keep"],
      ["Zbrojownia Cieni", "Shadow Armory"],
      ["Śluza Żelazna", "Iron Sluice"],
      ["Cytadela Bastionu", "Bastion Citadel"],
    ],
  },
  {
    index: 8,
    id: "eclipse_crown",
    namePl: "Korona Zaćmienia",
    nameEn: "Eclipse Crown",
    themePl: "Czarne zaćmienie słońca, obsydianowe iglice i finałowy tron",
    themeEn: "Blazing solar eclipse, obsidian spires, and the final monarch throne",
    accentHex: "#e11d48",
    isNewWorld: true,
    sharedPresets: [
      "shared:mid_far:bastion_walls_a",
      "shared:mid:obsidian_spires_a",
      "shared:mid_close:astral_pillars_a",
      "shared:close:foreground_towers_a",
    ],
    stageTitles: [
      ["Schody Obsydianu", "Obsidian Steps"],
      ["Aleja Złamanych Posągów", "Avenue of Shattered Statues"],
      ["Krawędź Korony", "Edge of the Corona"],
      ["Sanktuarium Zaćmienia", "Sanctum of the Eclipse"],
      ["Iglice Karmazynu", "Crimson Spires"],
      ["Komnata Proroctwa", "Prophecy Chamber"],
      ["Most Ofiarny", "Sacrificial Bridge"],
      ["Tron Zaćmienia (Finał)", "Throne of the Eclipse (Finale)"],
    ],
  },
];

export const WORLD_CAMPAIGN_REGISTRY: readonly WorldCampaignDefinition[] = WORLD_SEEDS.map(
  (seed) => {
    const farLayerKey = `world:${seed.id}:far`;
    const stageBossLayerKey = "boss:stage:arcane_sigil_arena";
    const worldBossLayerKey = "boss:world:eclipse_throne_colossus";

    const stages: StageBlueprint[] = seed.stageTitles.map(([titlePl, titleEn], idx) => {
      const stageNumber = idx + 1;
      const archetype = ARCHETYPES_BY_STAGE[idx];
      const isStageBoss = archetype === "stage_boss";
      const isWorldBoss = archetype === "world_boss";
      const isPlayable = stageNumber === 1;

      return {
        code: `W${seed.index}-${stageNumber}`,
        worldId: seed.id,
        worldIndex: seed.index,
        stageNumber,
        titlePl,
        titleEn,
        archetype,
        status: isPlayable ? "playable" : "planned",
        locationId: isPlayable ? seed.id : undefined,
        bossScope: isWorldBoss ? "world" : isStageBoss ? "stage" : undefined,
        farLayerKey,
        sharedLayerKeys: seed.sharedPresets,
        bossLayerKey: isWorldBoss
          ? worldBossLayerKey
          : isStageBoss
            ? stageBossLayerKey
            : undefined,
      };
    });

    return {
      index: seed.index,
      code: `W${seed.index}`,
      id: seed.id,
      primaryLocationId: seed.id,
      namePl: seed.namePl,
      nameEn: seed.nameEn,
      themePl: seed.themePl,
      themeEn: seed.themeEn,
      accentHex: seed.accentHex,
      farLayerKey,
      stageBossLayerKey,
      worldBossLayerKey,
      isNewWorld: seed.isNewWorld,
      stages,
    };
  }
);

export const ALL_CAMPAIGN_STAGES: readonly StageBlueprint[] = WORLD_CAMPAIGN_REGISTRY.flatMap(
  (world) => world.stages
);

export function getWorldCampaign(worldId: string): WorldCampaignDefinition | undefined {
  return WORLD_CAMPAIGN_REGISTRY.find((w) => w.id === worldId);
}
