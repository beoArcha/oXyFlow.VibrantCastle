import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Flame,
  Skull,
  Shield,
  BookOpen,
  GitBranch,
  Sparkles,
  Plus,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Smile,
} from "lucide-react";
import {
  Tabs,
  TabItem,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  SearchInput,
  Select,
  Switch,
  Textarea,
  ColorPickerInput,
  CopyableSnippet,
  Text,
  Paragraph,
  Label,
  Code,
  Alert,
  EmptyState,
} from "@ui";
import {
  spellsData,
  enemiesData,
  itemsData,
  dialoguesVnData,
  skillsData,
  skillTreesData,
} from "@data";
import {
  validateSpell,
  validateEnemy,
  validateItem,
  validateVisualNovelScene,
  validateSkillTreeDag,
  MAGIC_DOMAINS,
  SPELL_CAST_TYPES,
  SPELL_CATEGORIES,
  SPELL_TRIGGER_TYPES,
  SPELL_OWNER_TYPES,
  CHARACTER_IDS,
  ITEM_TYPES,
  ITEM_RARITIES,
  DAMAGE_TYPES,
  VALEN_PORTRAIT_EMOTIONS,
  AURELIA_PORTRAIT_EMOTIONS,
  type SpellJsonSchema,
  type EnemyJsonSchema,
  type ItemJsonSchema,
  type SkillTreeDagJsonSchema,
  type CharacterId,
} from "@lib/schemas";
import { useI18n } from "@context/I18nContext";
import { ATLAS_PRESETS } from "@developer/subtabs/atlas/assetPresets";
import { CHARACTER_PROFILE_REGISTRY } from "@game/characters/characterProfiles";
import {
  createBlankSpellTemplate,
  createBlankEnemyTemplate,
  createBlankItemTemplate,
  buildAiSystemPrompt,
  analyzeSkillTreeDag,
  extractVnScenes,
  extractSpellsList,
  extractEnemiesList,
  extractItemsList,
  extractSkillNodesById,
  downloadJsonFile,
  type DataStudioEntityKind,
} from "./dataStudioDefaults";

type DataStudioTabId =
  | "spells"
  | "enemies"
  | "items"
  | "vn"
  | "skillTree"
  | "aiSandbox";

/**
 * Full 6-domain Data Studio backed by @lib/schemas validators and canonical JSON datasets.
 * Note: Strictly zero raw HTML form/text tags and zero hardcoded hex literals in TSX.
 */
export const DataStudioSubtab: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<DataStudioTabId>("spells");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // 1. Spells state
  const [spells, setSpells] = useState<SpellJsonSchema[]>(() =>
    extractSpellsList(spellsData)
  );
  const [selectedSpellId, setSelectedSpellId] = useState<string>(
    () => extractSpellsList(spellsData)[0]?.id ?? ""
  );

  // 2. Enemies & Bestiary state
  const [enemies, setEnemies] = useState<EnemyJsonSchema[]>(() =>
    extractEnemiesList(enemiesData)
  );
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(
    () => extractEnemiesList(enemiesData)[0]?.id ?? ""
  );
  const [enemySearch, setEnemySearch] = useState("");
  const [enemyCategoryFilter, setEnemyCategoryFilter] = useState<string>("all");
  const [enemyAerialOnly, setEnemyAerialOnly] = useState(false);

  // 3. Items state
  const [items, setItems] = useState<ItemJsonSchema[]>(() =>
    extractItemsList(itemsData)
  );
  const [selectedItemId, setSelectedItemId] = useState<string>(
    () => extractItemsList(itemsData)[0]?.id ?? ""
  );

  // 4. Visual Novel & Portrait Matrix state
  const vnScenes = useMemo(() => extractVnScenes(dialoguesVnData), []);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    () => vnScenes[0]?.sceneId ?? ""
  );
  const selectedScene = useMemo(
    () => vnScenes.find((s) => s.sceneId === selectedSceneId) ?? vnScenes[0],
    [vnScenes, selectedSceneId]
  );
  const [currentNodeId, setCurrentNodeId] = useState<string>(
    () => vnScenes[0]?.initialNodeId ?? ""
  );
  const [portraitCharacter, setPortraitCharacter] = useState<CharacterId>("valen");
  const [selectedEmotionIdx, setSelectedEmotionIdx] = useState<number>(0);
  const portraitCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 5. Skill Tree DAG state
  const skillNodesById = useMemo(() => extractSkillNodesById(skillsData), []);
  const [dagCharacter, setDagCharacter] = useState<CharacterId>("valen");
  const [selectedTreeId, setSelectedTreeId] = useState<string>("");
  const [selectedDagNodeId, setSelectedDagNodeId] = useState<string>("");
  const [dagZoom, setDagZoom] = useState<number>(1);

  // 6. AI Prompt & Validator Sandbox state
  const [sandboxKind, setSandboxKind] = useState<DataStudioEntityKind>("spell");
  const [aiObjective, setAiObjective] = useState<string>(
    "Create a balanced Tier 2 Astral spell with frost slow effect for Aurelia."
  );
  const [sandboxInput, setSandboxInput] = useState<string>(() =>
    JSON.stringify(extractSpellsList(spellsData)[0] ?? createBlankSpellTemplate(), null, 2)
  );

  // Sync current VN node when scene changes
  useEffect(() => {
    if (selectedScene) {
      setCurrentNodeId(selectedScene.initialNodeId);
    }
  }, [selectedScene]);

  // Draw portrait preview cell (5x5 matrix)
  useEffect(() => {
    if (activeTab !== "vn") return;
    const canvas = portraitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const presetId = portraitCharacter === "valen" ? "valen_portraits" : "aurelia_portraits";
    const preset = ATLAS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const img = new Image();
    img.src = preset.imageSrc;
    img.onload = () => {
      const cols = preset.defaultMeta.atlas.columns || 5;
      const rows = preset.defaultMeta.atlas.rows || 5;
      const cellW = img.naturalWidth / cols;
      const cellH = img.naturalHeight / rows;
      const col = selectedEmotionIdx % cols;
      const row = Math.floor(selectedEmotionIdx / cols);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        col * cellW,
        row * cellH,
        cellW,
        cellH,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };
  }, [activeTab, portraitCharacter, selectedEmotionIdx]);

  const handleCopyJson = async (label: string, payload: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyFeedback(label);
      window.setTimeout(() => setCopyFeedback(null), 1800);
    } catch {
      setCopyFeedback(null);
    }
  };

  // Selected entity derivations
  const activeSpell = useMemo(
    () => spells.find((s) => s.id === selectedSpellId) ?? spells[0],
    [spells, selectedSpellId]
  );
  const spellValidation = useMemo(
    () => (activeSpell ? validateSpell(activeSpell) : null),
    [activeSpell]
  );

  const filteredEnemies = useMemo(() => {
    const q = enemySearch.trim().toLowerCase();
    return enemies.filter((e) => {
      if (enemyCategoryFilter !== "all" && e.category !== enemyCategoryFilter) return false;
      if (enemyAerialOnly && !e.isAerial) return false;
      if (!q) return true;
      return (
        e.id.toLowerCase().includes(q) ||
        e.defaultName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [enemies, enemySearch, enemyCategoryFilter, enemyAerialOnly]);

  const activeEnemy = useMemo(
    () => enemies.find((e) => e.id === selectedEnemyId) ?? enemies[0],
    [enemies, selectedEnemyId]
  );
  const enemyValidation = useMemo(
    () => (activeEnemy ? validateEnemy(activeEnemy) : null),
    [activeEnemy]
  );

  const activeItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? items[0],
    [items, selectedItemId]
  );
  const itemValidation = useMemo(
    () => (activeItem ? validateItem(activeItem) : null),
    [activeItem]
  );

  const vnValidation = useMemo(
    () => (selectedScene ? validateVisualNovelScene(selectedScene) : null),
    [selectedScene]
  );

  const characterTrees = useMemo<SkillTreeDagJsonSchema[]>(() => {
    const doc = skillTreesData as unknown as {
      characters?: Record<CharacterId, { trees: SkillTreeDagJsonSchema[] }>;
    };
    return doc.characters?.[dagCharacter]?.trees ?? [];
  }, [dagCharacter]);

  const activeTree = useMemo(
    () => characterTrees.find((tr) => tr.treeId === selectedTreeId) ?? characterTrees[0],
    [characterTrees, selectedTreeId]
  );

  const dagValidation = useMemo(
    () => (activeTree ? validateSkillTreeDag(activeTree) : null),
    [activeTree]
  );
  const dagStats = useMemo(
    () => (activeTree ? analyzeSkillTreeDag(activeTree) : null),
    [activeTree]
  );

  // Sandbox validation
  const sandboxValidation = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(sandboxInput);
      if (sandboxKind === "spell") return validateSpell(parsed);
      if (sandboxKind === "enemy") return validateEnemy(parsed);
      if (sandboxKind === "item") return validateItem(parsed);
      return validateVisualNovelScene(parsed);
    } catch (err) {
      return {
        success: false as const,
        errors: [
          {
            path: "JSON",
            message: err instanceof Error ? err.message : "Invalid JSON syntax",
          },
        ],
      };
    }
  }, [sandboxInput, sandboxKind]);

  const studioTabs: TabItem<DataStudioTabId>[] = useMemo(
    () => [
      { id: "spells", label: `Zaklęcia (${spells.length})`, icon: <Flame size={14} /> },
      { id: "enemies", label: `Bestiariusz (${enemies.length})`, icon: <Skull size={14} /> },
      { id: "items", label: `Przedmioty (${items.length})`, icon: <Shield size={14} /> },
      { id: "vn", label: `Dialogi VN & Portrety`, icon: <BookOpen size={14} /> },
      { id: "skillTree", label: `Drzewko DAG`, icon: <GitBranch size={14} /> },
      { id: "aiSandbox", label: `AI Prompt & Walidator`, icon: <Sparkles size={14} /> },
    ],
    [spells.length, enemies.length, items.length]
  );

  const updateActiveSpell = (patch: Partial<SpellJsonSchema>) => {
    if (!activeSpell) return;
    setSpells((prev) =>
      prev.map((s) => (s.id === activeSpell.id ? { ...s, ...patch } : s))
    );
    if (patch.id && patch.id !== activeSpell.id) {
      setSelectedSpellId(patch.id);
    }
  };

  const updateActiveEnemy = (updater: (prev: EnemyJsonSchema) => EnemyJsonSchema) => {
    if (!activeEnemy) return;
    const updated = updater(activeEnemy);
    setEnemies((prev) => prev.map((e) => (e.id === activeEnemy.id ? updated : e)));
    if (updated.id !== activeEnemy.id) {
      setSelectedEnemyId(updated.id);
    }
  };

  const updateActiveItem = (patch: Partial<ItemJsonSchema>) => {
    if (!activeItem) return;
    setItems((prev) =>
      prev.map((i) => (i.id === activeItem.id ? { ...i, ...patch } : i))
    );
    if (patch.id && patch.id !== activeItem.id) {
      setSelectedItemId(patch.id);
    }
  };

  const enemyCategories = useMemo(() => {
    const unique = Array.from(new Set(enemies.map((e) => e.category)));
    return [
      { value: "all", label: "Wszystkie kategorie" },
      ...unique.map((c) => ({ value: c, label: c })),
    ];
  }, [enemies]);

  const emotionsList =
    portraitCharacter === "valen" ? VALEN_PORTRAIT_EMOTIONS : AURELIA_PORTRAIT_EMOTIONS;

  const activeVnNode = selectedScene ? selectedScene.nodes[currentNodeId] : undefined;

  return (
    <div id="subtab-content-data-studio" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs<DataStudioTabId>
          items={studioTabs}
          activeId={activeTab}
          onChange={setActiveTab}
        />
        {copyFeedback && (
          <Badge variant="green" icon={<CheckCircle2 size={12} />}>
            Skopiowano: {copyFeedback}
          </Badge>
        )}
      </div>

      {/* 1. SPELLS STUDIO */}
      {activeTab === "spells" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card variant="subtle" className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Katalog Zaklęć</CardTitle>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={13} />}
                  className="whitespace-nowrap shrink-0"
                  onClick={() => {
                    const created = createBlankSpellTemplate();
                    setSpells((prev) => [created, ...prev]);
                    setSelectedSpellId(created.id);
                  }}
                >
                  Nowe
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 max-h-[440px] overflow-y-auto">
              {spells.map((sp) => (
                <Button
                  key={sp.id}
                  size="sm"
                  variant={sp.id === activeSpell?.id ? "primary" : "ghost"}
                  onClick={() => setSelectedSpellId(sp.id)}
                  className="justify-between whitespace-nowrap"
                >
                  <span className="truncate font-mono text-xs">{sp.id}</span>
                  <Badge variant="amber">{sp.magicDomain}</Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card variant="subtle" className="lg:col-span-8">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Edytor Zaklęcia</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {spellValidation?.success ? (
                    <Badge variant="green" icon={<CheckCircle2 size={12} />}>
                      Schema OK
                    </Badge>
                  ) : (
                    <Badge variant="red" icon={<AlertTriangle size={12} />}>
                      Błędy ({spellValidation?.errors.length ?? 0})
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Copy size={13} />}
                    className="whitespace-nowrap shrink-0"
                    onClick={() => activeSpell && handleCopyJson(activeSpell.id, activeSpell)}
                  >
                    Kopiuj JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Download size={13} />}
                    className="whitespace-nowrap shrink-0"
                    onClick={() =>
                      activeSpell && downloadJsonFile(`${activeSpell.id}.spell.json`, activeSpell)
                    }
                  >
                    Eksportuj
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activeSpell ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input
                      label="ID"
                      family="mono"
                      value={activeSpell.id}
                      onChange={(e) => updateActiveSpell({ id: e.target.value })}
                    />
                    <Select
                      label="Domena Magii"
                      value={activeSpell.magicDomain}
                      onChange={(e) =>
                        updateActiveSpell({
                          magicDomain: e.target.value as SpellJsonSchema["magicDomain"],
                        })
                      }
                      options={MAGIC_DOMAINS.map((m) => ({ value: m, label: m }))}
                    />
                    <Select
                      label="Typ Rzucania"
                      value={activeSpell.castType}
                      onChange={(e) =>
                        updateActiveSpell({
                          castType: e.target.value as SpellJsonSchema["castType"],
                        })
                      }
                      options={SPELL_CAST_TYPES.map((c) => ({ value: c, label: c }))}
                    />
                    <Select
                      label="Kategoria"
                      value={activeSpell.category}
                      onChange={(e) =>
                        updateActiveSpell({
                          category: e.target.value as SpellJsonSchema["category"],
                        })
                      }
                      options={SPELL_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    />
                    <Select
                      label="Wyzwalacz"
                      value={activeSpell.triggerType}
                      onChange={(e) =>
                        updateActiveSpell({
                          triggerType: e.target.value as SpellJsonSchema["triggerType"],
                        })
                      }
                      options={SPELL_TRIGGER_TYPES.map((tr) => ({ value: tr, label: tr }))}
                    />
                    <Select
                      label="Właściciel"
                      value={activeSpell.ownerType ?? "hero"}
                      onChange={(e) =>
                        updateActiveSpell({
                          ownerType: e.target.value as SpellJsonSchema["ownerType"],
                        })
                      }
                      options={SPELL_OWNER_TYPES.map((o) => ({ value: o, label: o }))}
                    />
                    <Input
                      label="Obrażenia"
                      type="number"
                      value={String(activeSpell.damage)}
                      onChange={(e) => updateActiveSpell({ damage: Number(e.target.value) || 0 })}
                    />
                    <Input
                      label="Koszt Many"
                      type="number"
                      value={String(activeSpell.manaCost)}
                      onChange={(e) =>
                        updateActiveSpell({ manaCost: Number(e.target.value) || 0 })
                      }
                    />
                    <Input
                      label="Cooldown (klatki)"
                      type="number"
                      value={String(activeSpell.cooldownFrames)}
                      onChange={(e) =>
                        updateActiveSpell({ cooldownFrames: Number(e.target.value) || 0 })
                      }
                    />
                    <Input
                      label="Klucz nazwy (i18n)"
                      family="mono"
                      value={activeSpell.nameKey}
                      onChange={(e) => updateActiveSpell({ nameKey: e.target.value })}
                    />
                    <Input
                      label="Ikona Lucide"
                      family="mono"
                      value={activeSpell.iconName}
                      onChange={(e) => updateActiveSpell({ iconName: e.target.value })}
                    />
                    <div className="flex flex-col gap-1">
                      <Label>Kolor FX</Label>
                      <ColorPickerInput
                        value={activeSpell.color}
                        onChange={(hex) => updateActiveSpell({ color: hex })}
                      />
                    </div>
                  </div>
                  {spellValidation && !spellValidation.success && (
                    <Alert variant="danger" title="Błędy walidacji schematu">
                      {spellValidation.errors.map((err, i) => (
                        <Text key={i} size="2xs" className="block font-mono">
                          {err.path}: {err.message}
                        </Text>
                      ))}
                    </Alert>
                  )}
                </>
              ) : (
                <EmptyState title="Brak zaklęć" description="Dodaj nowe zaklęcie do katalogu." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. ENEMIES & BESTIARY STUDIO */}
      {activeTab === "enemies" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card variant="subtle" className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Bestiariusz</CardTitle>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={13} />}
                  className="whitespace-nowrap shrink-0"
                  onClick={() => {
                    const created = createBlankEnemyTemplate();
                    setEnemies((prev) => [created, ...prev]);
                    setSelectedEnemyId(created.id);
                  }}
                >
                  Nowy Wróg
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <SearchInput
                value={enemySearch}
                onChange={(val) => setEnemySearch(val)}
                onClear={() => setEnemySearch("")}
                placeholder="Szukaj wroga..."
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={enemyCategoryFilter}
                  onChange={(e) => setEnemyCategoryFilter(e.target.value)}
                  options={enemyCategories}
                  size="sm"
                  containerClassName="flex-1 min-w-[140px]"
                />
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={enemyAerialOnly}
                    onCheckedChange={setEnemyAerialOnly}
                    aria-label="Tylko latający"
                  />
                  <Text size="2xs" variant="muted" className="whitespace-nowrap">
                    Latający
                  </Text>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto">
                {filteredEnemies.map((en) => (
                  <Button
                    key={en.id}
                    size="sm"
                    variant={en.id === activeEnemy?.id ? "primary" : "ghost"}
                    onClick={() => setSelectedEnemyId(en.id)}
                    className="justify-between whitespace-nowrap"
                  >
                    <span className="truncate text-xs">{en.defaultName}</span>
                    <Badge variant={en.isAerial ? "cyan" : "amber"}>{en.category}</Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="subtle" className="lg:col-span-8">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Edytor Wroga</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {enemyValidation?.success ? (
                    <Badge variant="green" icon={<CheckCircle2 size={12} />}>
                      Schema OK
                    </Badge>
                  ) : (
                    <Badge variant="red" icon={<AlertTriangle size={12} />}>
                      Błędy ({enemyValidation?.errors.length ?? 0})
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Copy size={13} />}
                    className="whitespace-nowrap shrink-0"
                    onClick={() => activeEnemy && handleCopyJson(activeEnemy.id, activeEnemy)}
                  >
                    Kopiuj JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Download size={13} />}
                    className="whitespace-nowrap shrink-0"
                    onClick={() =>
                      downloadJsonFile("bestiary_export.json", {
                        version: "1.0",
                        enemies: Object.fromEntries(enemies.map((e) => [e.id, e])),
                      })
                    }
                  >
                    Eksportuj Bestiariusz
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activeEnemy ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input
                      label="ID"
                      family="mono"
                      value={activeEnemy.id}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({ ...prev, id: e.target.value }))
                      }
                    />
                    <Input
                      label="Domyślna Nazwa"
                      value={activeEnemy.defaultName}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({ ...prev, defaultName: e.target.value }))
                      }
                    />
                    <Input
                      label="Kategoria"
                      value={activeEnemy.category}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({ ...prev, category: e.target.value }))
                      }
                    />
                    <Input
                      label="Max HP"
                      type="number"
                      value={String(activeEnemy.stats.maxHealth)}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        updateActiveEnemy((prev) => ({
                          ...prev,
                          stats: { ...prev.stats, maxHealth: val, health: val },
                        }));
                      }}
                    />
                    <Input
                      label="Atak"
                      type="number"
                      value={String(activeEnemy.stats.attackPower)}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({
                          ...prev,
                          stats: { ...prev.stats, attackPower: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                    <Input
                      label="Prędkość"
                      type="number"
                      step="0.1"
                      value={String(activeEnemy.stats.speed)}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({
                          ...prev,
                          stats: { ...prev.stats, speed: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                    <Input
                      label="Nagroda (pkt)"
                      type="number"
                      value={String(activeEnemy.stats.scoreReward)}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({
                          ...prev,
                          stats: { ...prev.stats, scoreReward: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                    <Input
                      label="Szerokość (px)"
                      type="number"
                      value={String(activeEnemy.dimensions.width)}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({
                          ...prev,
                          dimensions: {
                            ...prev.dimensions,
                            width: Math.max(1, Number(e.target.value) || 1),
                          },
                        }))
                      }
                    />
                    <Input
                      label="Wysokość (px)"
                      type="number"
                      value={String(activeEnemy.dimensions.height)}
                      onChange={(e) =>
                        updateActiveEnemy((prev) => ({
                          ...prev,
                          dimensions: {
                            ...prev.dimensions,
                            height: Math.max(1, Number(e.target.value) || 1),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-stone-800">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={activeEnemy.isAerial}
                        onCheckedChange={(checked) =>
                          updateActiveEnemy((prev) => ({ ...prev, isAerial: checked }))
                        }
                      />
                      <Text size="xs">Jednostka latająca (Aerial)</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={activeEnemy.isDummy}
                        onCheckedChange={(checked) =>
                          updateActiveEnemy((prev) => ({ ...prev, isDummy: checked }))
                        }
                      />
                      <Text size="xs">Manekin treningowy (Dummy)</Text>
                    </div>
                    {activeEnemy.atlas && (
                      <Badge variant="green">
                        Atlas: {activeEnemy.atlas.presetId} ({activeEnemy.atlas.defaultAnimation})
                      </Badge>
                    )}
                  </div>
                  {enemyValidation && !enemyValidation.success && (
                    <Alert variant="danger" title="Błędy walidacji schematu">
                      {enemyValidation.errors.map((err, i) => (
                        <Text key={i} size="2xs" className="block font-mono">
                          {err.path}: {err.message}
                        </Text>
                      ))}
                    </Alert>
                  )}
                </>
              ) : (
                <EmptyState title="Brak wrogów" description="Dodaj nowego przeciwnika." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. ITEMS STUDIO */}
      {activeTab === "items" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card variant="subtle" className="lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Przedmioty i Ekwipunek</CardTitle>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus size={13} />}
                  className="whitespace-nowrap shrink-0"
                  onClick={() => {
                    const created = createBlankItemTemplate();
                    setItems((prev) => [created, ...prev]);
                    setSelectedItemId(created.id);
                  }}
                >
                  Nowy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto">
              {items.map((it) => (
                <Button
                  key={it.id}
                  size="sm"
                  variant={it.id === activeItem?.id ? "primary" : "ghost"}
                  onClick={() => setSelectedItemId(it.id)}
                  className="justify-between whitespace-nowrap"
                >
                  <span className="truncate font-mono text-xs">{it.id}</span>
                  <Badge
                    variant={
                      it.rarity === "legendary"
                        ? "amber"
                        : it.rarity === "rare"
                          ? "cyan"
                          : "stone"
                    }
                  >
                    {it.rarity}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card variant="subtle" className="lg:col-span-8">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Edytor Przedmiotu</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {itemValidation?.success ? (
                    <Badge variant="green" icon={<CheckCircle2 size={12} />}>
                      Schema OK
                    </Badge>
                  ) : (
                    <Badge variant="red" icon={<AlertTriangle size={12} />}>
                      Błędy ({itemValidation?.errors.length ?? 0})
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Copy size={13} />}
                    className="whitespace-nowrap shrink-0"
                    onClick={() => activeItem && handleCopyJson(activeItem.id, activeItem)}
                  >
                    Kopiuj JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Download size={13} />}
                    className="whitespace-nowrap shrink-0"
                    onClick={() =>
                      activeItem && downloadJsonFile(`${activeItem.id}.item.json`, activeItem)
                    }
                  >
                    Eksportuj
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activeItem ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input
                      label="ID"
                      family="mono"
                      value={activeItem.id}
                      onChange={(e) => updateActiveItem({ id: e.target.value })}
                    />
                    <Select
                      label="Typ"
                      value={activeItem.type}
                      onChange={(e) =>
                        updateActiveItem({ type: e.target.value as ItemJsonSchema["type"] })
                      }
                      options={ITEM_TYPES.map((tp) => ({ value: tp, label: tp }))}
                    />
                    <Select
                      label="Rzadkość"
                      value={activeItem.rarity}
                      onChange={(e) =>
                        updateActiveItem({
                          rarity: e.target.value as ItemJsonSchema["rarity"],
                        })
                      }
                      options={ITEM_RARITIES.map((r) => ({ value: r, label: r }))}
                    />
                    <Select
                      label="Typ Obrażeń"
                      value={activeItem.damageType ?? "physical"}
                      onChange={(e) =>
                        updateActiveItem({
                          damageType: e.target.value as ItemJsonSchema["damageType"],
                        })
                      }
                      options={DAMAGE_TYPES.map((d) => ({ value: d, label: d }))}
                    />
                    <Input
                      label="Bonus Ataku"
                      type="number"
                      value={String(activeItem.attackBonus ?? 0)}
                      onChange={(e) =>
                        updateActiveItem({ attackBonus: Number(e.target.value) || 0 })
                      }
                    />
                    <Input
                      label="Bonus Obrony"
                      type="number"
                      value={String(activeItem.defenseBonus ?? 0)}
                      onChange={(e) =>
                        updateActiveItem({ defenseBonus: Number(e.target.value) || 0 })
                      }
                    />
                    <Input
                      label="Bonus Max HP"
                      type="number"
                      value={String(activeItem.maxHpBonus ?? 0)}
                      onChange={(e) =>
                        updateActiveItem({ maxHpBonus: Number(e.target.value) || 0 })
                      }
                    />
                    <Input
                      label="Bonus Max Many"
                      type="number"
                      value={String(activeItem.maxManaBonus ?? 0)}
                      onChange={(e) =>
                        updateActiveItem({ maxManaBonus: Number(e.target.value) || 0 })
                      }
                    />
                    <Input
                      label="Ikona Lucide"
                      family="mono"
                      value={activeItem.icon}
                      onChange={(e) => updateActiveItem({ icon: e.target.value })}
                    />
                  </div>
                  {itemValidation && !itemValidation.success && (
                    <Alert variant="danger" title="Błędy walidacji schematu">
                      {itemValidation.errors.map((err, i) => (
                        <Text key={i} size="2xs" className="block font-mono">
                          {err.path}: {err.message}
                        </Text>
                      ))}
                    </Alert>
                  )}
                </>
              ) : (
                <EmptyState title="Brak przedmiotów" description="Dodaj nowy przedmiot." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. VISUAL NOVEL & 5x5 PORTRAIT EMOTION MATRIX */}
      {activeTab === "vn" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card variant="subtle" className="lg:col-span-7">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Podgląd Sceny Visual Novel</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedScene?.sceneId ?? ""}
                    onChange={(e) => setSelectedSceneId(e.target.value)}
                    options={vnScenes.map((sc) => ({
                      value: sc.sceneId,
                      label: sc.sceneId,
                    }))}
                    size="sm"
                  />
                  {vnValidation?.success && (
                    <Badge variant="green" icon={<CheckCircle2 size={12} />}>
                      Graf OK
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RotateCcw size={13} />}
                    className="whitespace-nowrap shrink-0"
                    onClick={() =>
                      selectedScene && setCurrentNodeId(selectedScene.initialNodeId)
                    }
                  >
                    Restart
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {selectedScene && activeVnNode ? (
                <div className="rounded-xl border border-stone-800 bg-stone-950/90 p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="amber">{activeVnNode.speaker.toUpperCase()}</Badge>
                      {activeVnNode.emotion && (
                        <Badge variant="cyan">{activeVnNode.emotion}</Badge>
                      )}
                      {activeVnNode.position && (
                        <Badge variant="stone">{activeVnNode.position}</Badge>
                      )}
                    </div>
                    <Code size="xs">{activeVnNode.id}</Code>
                  </div>

                  <Paragraph size="sm" className="text-stone-100 leading-relaxed">
                    {t(activeVnNode.dialogueKey)}
                  </Paragraph>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-800">
                    {activeVnNode.choices && activeVnNode.choices.length > 0 ? (
                      activeVnNode.choices.map((ch) => (
                        <Button
                          key={ch.choiceId}
                          size="sm"
                          variant="primary"
                          className="whitespace-nowrap"
                          onClick={() => setCurrentNodeId(ch.targetNodeId)}
                        >
                          {t(ch.textKey)}
                        </Button>
                      ))
                    ) : activeVnNode.nextNodeId ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="whitespace-nowrap"
                        onClick={() => setCurrentNodeId(activeVnNode.nextNodeId!)}
                      >
                        Dalej → {activeVnNode.nextNodeId}
                      </Button>
                    ) : (
                      <Badge variant="green">Koniec sceny</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Brak załadowanej sceny"
                  description="Wybierz scenę z pliku dialogues_vn.json."
                />
              )}
            </CardContent>
          </Card>

          <Card variant="subtle" className="lg:col-span-5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-1.5">
                  <Smile size={15} className="text-amber-400" />
                  Matryca Portretów 5×5
                </CardTitle>
                <div className="flex gap-1.5">
                  {CHARACTER_IDS.map((charId) => (
                    <Button
                      key={charId}
                      size="sm"
                      variant={portraitCharacter === charId ? "primary" : "secondary"}
                      className="whitespace-nowrap shrink-0"
                      onClick={() => {
                        setPortraitCharacter(charId);
                        setSelectedEmotionIdx(0);
                      }}
                    >
                      {CHARACTER_PROFILE_REGISTRY[charId].displayName}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <canvas
                  ref={portraitCanvasRef}
                  width={116}
                  height={135}
                  className="rounded-xl border border-stone-700 bg-black/70 shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <Text size="xs" weight="bold" className="text-amber-300">
                    {CHARACTER_PROFILE_REGISTRY[portraitCharacter].displayName}
                  </Text>
                  <Code size="xs">{emotionsList[selectedEmotionIdx] ?? "neutral"}</Code>
                  <Text size="2xs" variant="muted" className="tabular-nums">
                    Wiersz {Math.floor(selectedEmotionIdx / 5) + 1}, Kolumna{" "}
                    {(selectedEmotionIdx % 5) + 1}
                  </Text>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {emotionsList.map((emotion, idx) => (
                  <Button
                    key={emotion}
                    size="sm"
                    variant={idx === selectedEmotionIdx ? "primary" : "ghost"}
                    onClick={() => setSelectedEmotionIdx(idx)}
                    className="px-1.5 py-1 text-[10px] truncate"
                    title={emotion}
                  >
                    {emotion.slice(0, 6)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. SKILL TREE DAG VISUALIZER */}
      {activeTab === "skillTree" && (
        <Card variant="subtle">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Wizualizator Drzewka Umiejętności (DAG)</CardTitle>
                {CHARACTER_IDS.map((charId) => (
                  <Button
                    key={charId}
                    size="sm"
                    variant={dagCharacter === charId ? "primary" : "secondary"}
                    className="whitespace-nowrap shrink-0"
                    onClick={() => {
                      setDagCharacter(charId);
                      setSelectedTreeId("");
                      setSelectedDagNodeId("");
                    }}
                  >
                    {CHARACTER_PROFILE_REGISTRY[charId].displayName}
                  </Button>
                ))}
                <Select
                  value={activeTree?.treeId ?? ""}
                  onChange={(e) => {
                    setSelectedTreeId(e.target.value);
                    setSelectedDagNodeId("");
                  }}
                  options={characterTrees.map((tr) => ({
                    value: tr.treeId,
                    label: tr.treeId,
                  }))}
                  size="sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {dagStats && (
                  <Badge variant={dagStats.hasCycle ? "red" : "green"}>
                    {dagStats.hasCycle
                      ? "WYKRYTO CYKL!"
                      : `DAG OK • ${dagStats.nodeCount} węzłów • ${dagStats.edgeCount} krawędzi`}
                  </Badge>
                )}
                {dagValidation && !dagValidation.success && (
                  <Badge variant="red">Błędy walidacji: {dagValidation.errors.length}</Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ZoomOut size={13} />}
                  className="whitespace-nowrap shrink-0"
                  onClick={() => setDagZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                >
                  -
                </Button>
                <Code size="xs" className="tabular-nums">
                  {Math.round(dagZoom * 100)}%
                </Code>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ZoomIn size={13} />}
                  className="whitespace-nowrap shrink-0"
                  onClick={() => setDagZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="whitespace-nowrap shrink-0"
                  onClick={() => setDagZoom(1)}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 rounded-xl border border-stone-800 bg-stone-950/80 p-4 overflow-auto min-h-[300px]">
              {activeTree ? (
                <div
                  className="grid gap-4 transition-transform origin-top-left"
                  style={{ transform: `scale(${dagZoom})` }}
                >
                  {[1, 2, 3, 4].map((tier) => {
                    const tierNodes = Object.values(activeTree.nodes).filter(
                      (n) => n.tier === tier
                    );
                    if (tierNodes.length === 0) return null;
                    return (
                      <div key={tier} className="flex flex-col gap-2">
                        <Text size="2xs" variant="muted" className="uppercase tracking-wider">
                          Poziom / Tier {tier}
                        </Text>
                        <div className="flex flex-wrap gap-2.5">
                          {tierNodes.map((node) => {
                            const isRoot = activeTree.rootSkillIds.includes(node.skillId);
                            const isSelected = selectedDagNodeId === node.skillId;
                            return (
                              <Button
                                key={node.skillId}
                                size="sm"
                                variant={isSelected ? "primary" : "secondary"}
                                onClick={() => setSelectedDagNodeId(node.skillId)}
                                className="flex flex-col items-start h-auto py-2 px-3 gap-1 whitespace-nowrap"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs">{node.skillId}</span>
                                  {isRoot && <Badge variant="amber">ROOT</Badge>}
                                </div>
                                <Text size="2xs" variant="muted" className="tabular-nums">
                                  Koszt: {node.pointCost} pkt • Wymaga:{" "}
                                  {node.prerequisites.length > 0
                                    ? node.prerequisites.join(", ")
                                    : "brak"}
                                </Text>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Brak drzewka" description="Wybierz bohatera z listy." />
              )}
            </div>

            <div className="lg:col-span-4 rounded-xl border border-stone-800 bg-black/40 p-3 flex flex-col gap-2">
              <Text size="xs" weight="bold" className="text-amber-300">
                Inspektor Węzła
              </Text>
              {selectedDagNodeId && activeTree?.nodes[selectedDagNodeId] ? (
                <>
                  <Code size="xs">{selectedDagNodeId}</Code>
                  <Text size="xs" variant="muted">
                    Pozycja siatki: ({activeTree.nodes[selectedDagNodeId].gridPosition.x},{" "}
                    {activeTree.nodes[selectedDagNodeId].gridPosition.y})
                  </Text>
                  <Text size="xs" variant="muted">
                    Wymagania:{" "}
                    {activeTree.nodes[selectedDagNodeId].prerequisites.join(", ") || "Brak (Root)"}
                  </Text>
                  {skillNodesById[selectedDagNodeId] && (
                    <div className="pt-2 border-t border-stone-800 flex flex-col gap-1">
                      <Text size="xs" weight="semibold">
                        {t(skillNodesById[selectedDagNodeId].nameKey)}
                      </Text>
                      <Paragraph size="2xs" variant="muted">
                        {t(skillNodesById[selectedDagNodeId].descKey)}
                      </Paragraph>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Badge variant="amber">
                          DMG: {skillNodesById[selectedDagNodeId].damage}
                        </Badge>
                        <Badge variant="cyan">
                          MP: {skillNodesById[selectedDagNodeId].manaCost}
                        </Badge>
                        <Badge variant="stone">
                          CD: {skillNodesById[selectedDagNodeId].cooldownFrames}f
                        </Badge>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Paragraph size="xs" variant="muted">
                  Kliknij dowolny węzeł w drzewku po lewej, aby podejrzeć jego parametry i zależności.
                </Paragraph>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. AI PROMPT & VALIDATOR SANDBOX */}
      {activeTab === "aiSandbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card variant="subtle" className="lg:col-span-6">
            <CardHeader>
              <CardTitle>Generator Promptu AI (Schema Contract)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Typ encji"
                  value={sandboxKind}
                  onChange={(e) => setSandboxKind(e.target.value as DataStudioEntityKind)}
                  options={[
                    { value: "spell", label: "Zaklęcie (Spell)" },
                    { value: "enemy", label: "Wróg (Enemy)" },
                    { value: "item", label: "Przedmiot (Item)" },
                    { value: "vn", label: "Scena VN (Dialogue)" },
                  ]}
                />
                <Input
                  label="Cel projektowy"
                  value={aiObjective}
                  onChange={(e) => setAiObjective(e.target.value)}
                />
              </div>
              <CopyableSnippet
                title="Gotowy System Prompt"
                text={buildAiSystemPrompt(sandboxKind, aiObjective)}
                maxHeightClass="max-h-[280px]"
              />
            </CardContent>
          </Card>

          <Card variant="subtle" className="lg:col-span-6">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Piaskownica Walidacji JSON</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {sandboxValidation.success ? (
                    <Badge variant="green" icon={<CheckCircle2 size={12} />}>
                      Poprawny JSON
                    </Badge>
                  ) : (
                    <Badge variant="red" icon={<AlertTriangle size={12} />}>
                      Błędy ({sandboxValidation.errors.length})
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="whitespace-nowrap shrink-0"
                    onClick={() => {
                      const sample =
                        sandboxKind === "spell"
                          ? createBlankSpellTemplate()
                          : sandboxKind === "enemy"
                            ? createBlankEnemyTemplate()
                            : sandboxKind === "item"
                              ? createBlankItemTemplate()
                              : vnScenes[0] ?? {};
                      setSandboxInput(JSON.stringify(sample, null, 2));
                    }}
                  >
                    Załaduj przykład
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
              {!sandboxValidation.success && (
                <Alert variant="danger" title="Raport walidacji">
                  {sandboxValidation.errors.slice(0, 6).map((err, i) => (
                    <Text key={i} size="2xs" className="block font-mono">
                      {err.path}: {err.message}
                    </Text>
                  ))}
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

DataStudioSubtab.displayName = "DataStudioSubtab";
export default DataStudioSubtab;
