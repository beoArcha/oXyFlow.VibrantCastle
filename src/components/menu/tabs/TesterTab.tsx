import React, { useState, useEffect } from "react";
import {
  Wrench,
  MapPin,
  Shield,
  Zap,
  Ghost,
  Heart,
  Swords,
  Skull,
  FastForward,
  Eye,
  Activity,
  Layers,
  Music,
  Sparkles,
  Plus,
  Trash2,
  Crosshair,
  Compass,
  Trophy,
  AlertTriangle,
  Coins,
  StepForward,
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@components/ui";
import { useGameSession } from "@context/GameContext";
import { useI18n } from "@context/I18nContext";
import { debugManager } from "@game/debug/debugManager";
import gameEngine from "@game/loop/engine";
import { PlayerId } from "@game/types";
import { LocationId } from "@game/locations";
import { BackgroundLayerTier } from "@game/locations/schema/locationSchema";

const LOCATION_LIST: { id: LocationId; namePl: string; nameEn: string }[] = [
  { id: "courtyard", namePl: "Dziedziniec Treningowy", nameEn: "Training Courtyard" },
  { id: "thorn_chasm", namePl: "Cierniowa Rozpadlina", nameEn: "Thorn Chasm" },
  { id: "grand_bastion", namePl: "Wielki Bastion", nameEn: "Grand Bastion" },
  { id: "clocktower", namePl: "Wieża Zegarowa", nameEn: "Clockwork Tower" },
  { id: "aether_sanctuary", namePl: "Astralne Sanktuarium", nameEn: "Aether Sanctuary" },
];

const MONSTER_OPTIONS = [
  { id: "training_dummy", namePl: "Kukła Treningowa", nameEn: "Training Dummy" },
  { id: "court_sentinel", namePl: "Strażnik Dziedzińca", nameEn: "Courtyard Sentinel" },
  { id: "chasm_crawler", namePl: "Cierniowy Pełzacz", nameEn: "Thorn Crawler" },
  { id: "bastion_gargoyle", namePl: "Kamienny Gargulec", nameEn: "Stone Gargoyle" },
  { id: "bastion_sentinel_boss", namePl: "Bastion Sentinel Boss", nameEn: "Bastion Sentinel Boss" },
  { id: "clockwork_automaton", namePl: "Mechaniczny Automaton", nameEn: "Clockwork Automaton" },
  { id: "aether_wisp", namePl: "Ognik Eteryczny", nameEn: "Aether Wisp" },
];

export const TesterTab: React.FC = () => {
  const { p1, currentLocationId, loadLocation, restart } = useGameSession();
  const { language } = useI18n();
  const isPl = language === "pl";

  // Reactive debug state from debugManager
  const [debugState, setDebugState] = useState(debugManager.state);
  useEffect(() => {
    return debugManager.subscribe(() => {
      setDebugState({ ...debugManager.state });
    });
  }, []);

  // Teleport inputs
  const [customX, setCustomX] = useState<number>(p1 ? Math.round(p1.x) : 150);
  const [customY, setCustomY] = useState<number>(p1 ? Math.round(p1.y) : 450);

  // Selected enemy for spawner
  const [selectedEnemy, setSelectedEnemy] = useState<string>("court_sentinel");

  // Update coords if player position is available on initial open
  useEffect(() => {
    if (p1) {
      setCustomX(Math.round(p1.x));
      setCustomY(Math.round(p1.y));
    }
  }, [p1?.x, p1?.y]);

  const presets = debugManager.getSpawnPresets(currentLocationId);

  const handleCustomTeleport = () => {
    gameEngine.teleportPlayer(PlayerId.Player1, customX, customY);
  };

  const handlePresetTeleport = (x: number, y: number) => {
    setCustomX(x);
    setCustomY(y);
    gameEngine.teleportPlayer(PlayerId.Player1, x, y);
  };

  return (
    <div id="tab-content-tester" className="flex flex-col gap-4 animate-in fade-in duration-150 text-sm">
      {/* 1. SPAWN & TELEPORTATION */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<MapPin className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Punkty Startowe i Teleportacja" : "Spawn Points & Teleportation"}
          </CardTitle>
          <Badge variant="amber">{currentLocationId}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Predefined Checkpoints */}
          <div>
            <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Compass size={13} className="text-amber-400" />
              <span>{isPl ? "Predefiniowane punkty kontrolne (Bieżąca lokacja):" : "Predefined Checkpoints:"}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePresetTeleport(preset.x, preset.y)}
                  className="flex flex-col items-start py-2 px-3 text-left h-auto"
                >
                  <span className="font-bold text-amber-300 text-xs">
                    {isPl ? preset.namePl : preset.name}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    X: {preset.x}, Y: {preset.y}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Teleport Coordinates */}
          <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crosshair size={15} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200">
                {isPl ? "Współrzędne X / Y:" : "Coordinates X / Y:"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-400 font-mono">X:</span>
                <input
                  type="number"
                  value={customX}
                  onChange={(e) => setCustomX(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-400 font-mono">Y:</span>
                <input
                  type="number"
                  value={customY}
                  onChange={(e) => setCustomY(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <Button size="sm" variant="primary" onClick={handleCustomTeleport}>
                {isPl ? "Teleportuj" : "Teleport"}
              </Button>
            </div>
          </div>

          {/* Click to Teleport & Location Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#4a1d0d]">
            <Button
              size="sm"
              variant={debugState.clickToTeleport ? "primary" : "secondary"}
              icon={<Crosshair size={14} />}
              onClick={() => debugManager.toggleClickToTeleport()}
            >
              {isPl
                ? `Kliknij na planszy = Teleport: ${debugState.clickToTeleport ? "WŁĄCZONE" : "WYŁĄCZONE"}`
                : `Click Canvas = Teleport: ${debugState.clickToTeleport ? "ON" : "OFF"}`}
            </Button>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-stone-400 font-medium">
                {isPl ? "Przełącz lokację:" : "Switch Location:"}
              </span>
              {LOCATION_LIST.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => loadLocation(loc.id)}
                  className={`px-2 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer ${currentLocationId === loc.id
                      ? "bg-amber-600 text-white border-amber-400"
                      : "bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-700"
                    }`}
                >
                  {isPl ? loc.namePl.split(" ")[0] : loc.nameEn.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CHEATS & STATS */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Shield className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Cheaty i Modyfikatory Postaci" : "Cheats & Stat Modifiers"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant={debugState.godMode ? "primary" : "secondary"}
              icon={<Shield size={14} />}
              onClick={() => debugManager.toggleGodMode()}
            >
              God Mode: {debugState.godMode ? "ON" : "OFF"}
            </Button>
            <Button
              variant={debugState.infiniteMana ? "primary" : "secondary"}
              icon={<Zap size={14} />}
              onClick={() => debugManager.toggleInfiniteMana()}
            >
              {isPl ? "Niesk. Mana:" : "Inf Mana:"} {debugState.infiniteMana ? "ON" : "OFF"}
            </Button>
            <Button
              variant={debugState.infiniteStamina ? "primary" : "secondary"}
              icon={<FastForward size={14} />}
              onClick={() => debugManager.toggleInfiniteStamina()}
            >
              {isPl ? "Niesk. Stamina:" : "Inf Stamina:"} {debugState.infiniteStamina ? "ON" : "OFF"}
            </Button>
            <Button
              variant={debugState.noClip ? "primary" : "secondary"}
              icon={<Ghost size={14} />}
              onClick={() => debugManager.toggleNoClip()}
            >
              No-Clip: {debugState.noClip ? "ON" : "OFF"}
            </Button>
          </div>

          {/* Vitals Quick Restores */}
          <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Heart size={15} className="text-red-400" />
              <span className="text-xs font-bold text-stone-200">
                {isPl ? "Zarządzanie Punktami Życia (HP):" : "Health Point (HP) Controls:"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => gameEngine.setPlayerStat(0, "health", 1)}>
                1 HP (Krytyk)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.setPlayerStat(0, "health", 50)}>
                50 HP
              </Button>
              <Button size="sm" variant="primary" icon={<Heart size={13} />} onClick={() => gameEngine.refillVitals(0)}>
                {isPl ? "100% HP/MP/SP" : "Refill All"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. SPAWNER (ITEMS, WEAPONS, GOLD) */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Swords className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Przedmioty, Broń i Magia" : "Items, Weapons & Magic"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="secondary"
              icon={<Swords size={14} />}
              onClick={() => gameEngine.giveAllWeapons(0)}
            >
              {isPl ? "Dodaj Wszystkie Bronie" : "Give All Weapons"}
            </Button>
            <Button
              variant="secondary"
              icon={<Sparkles size={14} />}
              onClick={() => gameEngine.unlockAllSkills(0)}
            >
              {isPl ? "Odblokuj Wszystkie Czary" : "Unlock All Spells"}
            </Button>
            <Button
              variant="secondary"
              icon={<Heart size={14} />}
              onClick={() => gameEngine.givePotions(0)}
            >
              {isPl ? "Dodaj Mikstury (5x)" : "Give Potions (5x)"}
            </Button>
            <Button
              variant="secondary"
              icon={<Trash2 size={14} />}
              onClick={() => gameEngine.clearInventory(0)}
            >
              {isPl ? "Wyczyść Ekwipunek" : "Clear Inventory"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#180904] rounded-lg border border-[#4a1d0d] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Coins size={15} className="text-yellow-400" />
              <span className="text-xs font-bold text-stone-200">
                {isPl ? "Dodaj Złoto do Skarbca:" : "Add Gold to Inventory:"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => gameEngine.addGold(100)}>
                +100
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.addGold(1000)}>
                +1,000
              </Button>
              <Button size="sm" variant="primary" onClick={() => gameEngine.addGold(10000)}>
                +10,000
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. COMBAT & AI MANAGEMENT */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Skull className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Walka i Kontrola Przeciwników (AI)" : "Combat & Enemy AI Management"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="secondary"
              icon={<Skull size={14} />}
              onClick={() => gameEngine.killAllEnemies()}
              className="text-red-400 hover:text-red-300"
            >
              {isPl ? "Zabij Wszystkich Wrogów" : "Kill All Enemies"}
            </Button>
            <Button
              variant={debugState.freezeAI ? "primary" : "secondary"}
              icon={<Ghost size={14} />}
              onClick={() => debugManager.toggleFreezeAI()}
            >
              {isPl ? "Zamroź AI:" : "Freeze AI:"} {debugState.freezeAI ? "ON" : "OFF"}
            </Button>
            <Button
              variant="secondary"
              icon={<Trophy size={14} />}
              onClick={() => gameEngine.forceVictory()}
              className="text-amber-400"
            >
              {isPl ? "Wymuś Zwycięstwo" : "Force Victory"}
            </Button>
            <Button
              variant="secondary"
              icon={<AlertTriangle size={14} />}
              onClick={() => gameEngine.forceDefeat()}
              className="text-stone-400"
            >
              {isPl ? "Wymuś Przegraną" : "Force Defeat"}
            </Button>
          </div>

          {/* Enemy Spawner Controls */}
          <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Plus size={15} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200">
                {isPl ? "Przywołaj Wroga w Świecie:" : "Spawn Monster into Scene:"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedEnemy}
                onChange={(e) => setSelectedEnemy(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-semibold"
              >
                {MONSTER_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isPl ? m.namePl : m.nameEn}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={13} />}
                onClick={() => gameEngine.spawnEnemy(selectedEnemy)}
              >
                {isPl ? "Przywołaj przy graczu" : "Spawn Near Player"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. SIMULATION SPEED & TIME SCALE */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<FastForward className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Prędkość Gry i Krok Symulacji" : "Simulation Speed & Time Scale"}
          </CardTitle>
          <Badge variant="stone">{debugState.timeScale}x</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0.25, 0.5, 1.0, 2.0, 4.0].map((scale) => (
              <Button
                key={scale}
                size="sm"
                variant={debugState.timeScale === scale ? "primary" : "secondary"}
                onClick={() => debugManager.setTimeScale(scale)}
              >
                {scale === 1.0 ? "1.0x (Normal)" : `${scale}x`}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={<StepForward size={14} />}
            onClick={() => gameEngine.stepSingleFrame()}
          >
            {isPl ? "Wykonaj 1 Klatkę (Step)" : "Step 1 Frame"}
          </Button>
        </CardContent>
      </Card>

      {/* 6. HITBOXES & DIAGNOSTICS */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Wizualizacja Kolizji i Nakładka Diagnostyczna" : "Hitboxes & Diagnostic HUD"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant={debugState.showHitboxes ? "primary" : "secondary"}
            icon={<Eye size={14} />}
            onClick={() => debugManager.toggleHitboxes()}
          >
            {isPl ? "Hitboxy i Hurtboxy:" : "Hitboxes & Hurtboxes:"} {debugState.showHitboxes ? "WŁĄCZONE" : "WYŁĄCZONE"}
          </Button>
          <Button
            variant={debugState.showProfiler ? "primary" : "secondary"}
            icon={<Activity size={14} />}
            onClick={() => debugManager.toggleProfiler()}
          >
            {isPl ? "Nakładka Profilera (HUD):" : "Profiler Overlay (HUD):"} {debugState.showProfiler ? "WŁĄCZONY" : "WYŁĄCZONY"}
          </Button>
        </CardContent>
      </Card>

      {/* 7. PARALLAX LAYERS & AUDIO/PARTICLES */}
      <Card variant="default">
        <CardHeader>
          <CardTitle icon={<Layers className="w-4 h-4 text-amber-400" />}>
            {isPl ? "Warstwy Tła i Środowisko" : "Parallax Layers & Environment"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Parallax Layer Toggles */}
          <div>
            <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-amber-400" />
              <span>{isPl ? "Izolacja warstw tła wielowarstwowego:" : "Multi-layer Parallax Tiers:"}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(["far", "mid_far", "mid", "mid_close", "close"] as BackgroundLayerTier[]).map((tier) => (
                <Button
                  key={tier}
                  size="sm"
                  variant={debugState.parallaxTiers[tier] ? "primary" : "secondary"}
                  onClick={() => debugManager.toggleParallaxTier(tier)}
                  className="text-xs"
                >
                  {tier.toUpperCase()}: {debugState.parallaxTiers[tier] ? "ON" : "OFF"}
                </Button>
              ))}
            </div>
          </div>

          {/* Music Intensity & Particle Emitter Test */}
          <div className="p-3 bg-[#180904] rounded-lg border border-[#4a1d0d] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Music size={15} className="text-purple-400" />
              <span className="text-xs font-bold text-stone-200">
                {isPl ? "Intensywność Muzyki:" : "Music Intensity:"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "10% (Chill)", val: 0.1 },
                { label: "40% (Suspense)", val: 0.4 },
                { label: "70% (Combat)", val: 0.7 },
                { label: "100% (Climax)", val: 1.0 },
              ].map((m) => (
                <Button key={m.val} size="sm" variant="secondary" onClick={() => gameEngine.setMusicIntensity(m.val)}>
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#180904] rounded-lg border border-[#4a1d0d] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200">
                {isPl ? "Test Emisji Cząsteczek:" : "Particle Emitter Test:"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => gameEngine.triggerParticleBurst("spark")}>
                Sparks
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.triggerParticleBurst("magic")}>
                Magic
              </Button>
              <Button size="sm" variant="secondary" onClick={() => gameEngine.triggerParticleBurst("dust")}>
                Dust
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
