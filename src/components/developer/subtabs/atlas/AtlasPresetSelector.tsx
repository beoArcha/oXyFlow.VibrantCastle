import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  X,
  ChevronDown,
  Star,
  User,
  Skull,
  Building,
  Sparkles,
  Check,
  Layers,
} from "lucide-react";
import { Badge } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import {
  defaultAtlasAssetRegistry,
  AtlasCategory,
  IAtlasAssetManifestItem,
} from "@game/engine/meta/registry";

export type AssetFilterType = AtlasCategory | "all" | "popular";

export interface AtlasPresetSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  className?: string;
}

export const AtlasPresetSelector: React.FC<AtlasPresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  className = "",
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<AssetFilterType>("all");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Active asset item from registry
  const activeAsset = useMemo(() => {
    return defaultAtlasAssetRegistry.getById(selectedPresetId) || defaultAtlasAssetRegistry.getAll()[0];
  }, [selectedPresetId]);

  // Filtered asset list from registry (OCP)
  const filteredAssets = useMemo(() => {
    return defaultAtlasAssetRegistry.search(searchQuery, activeFilter);
  }, [searchQuery, activeFilter]);

  // Helper for category badge and icon
  const getCategoryMeta = (cat: AtlasCategory) => {
    switch (cat) {
      case "character":
        return {
          icon: <User size={12} className="text-amber-300" />,
          variant: "amber" as const,
          label: t("atlasStudioFilterCharacters"),
        };
      case "enemy":
        return {
          icon: <Skull size={12} className="text-rose-400" />,
          variant: "red" as const,
          label: t("atlasStudioFilterEnemies"),
        };
      case "structure":
        return {
          icon: <Building size={12} className="text-cyan-400" />,
          variant: "cyan" as const,
          label: t("atlasStudioFilterStructures"),
        };
      case "portrait":
        return {
          icon: <Sparkles size={12} className="text-purple-400" />,
          variant: "purple" as const,
          label: t("atlasStudioFilterPortraits"),
        };
      default:
        return {
          icon: <Layers size={12} className="text-stone-400" />,
          variant: "stone" as const,
          label: "Custom",
        };
    }
  };

  const activeMeta = activeAsset ? getCategoryMeta(activeAsset.category) : null;

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* 1. Main Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-[#120603] hover:bg-[#1a0904] text-stone-200 border border-amber-800/60 hover:border-amber-500 rounded-xl transition-all shadow-md shadow-black/40 group"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-1.5">
          {activeMeta?.icon}
          <span className="font-bold text-xs text-amber-200 group-hover:text-amber-100 max-w-[160px] sm:max-w-[200px] truncate">
            {activeAsset?.name || "Select Atlas"}
          </span>
        </div>

        {activeMeta && (
          <Badge variant={activeMeta.variant} className="text-[10px] px-1.5 py-0 uppercase">
            {activeAsset.category}
          </Badge>
        )}

        <ChevronDown
          size={14}
          className={`text-amber-400/80 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {/* 2. Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-[340px] sm:w-[420px] bg-[#0d0705] border border-amber-600/50 rounded-2xl shadow-2xl shadow-black/90 p-3 flex flex-col gap-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {/* A. Search Input */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-stone-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("atlasStudioSearchPlaceholder")}
              className="w-full pl-8 pr-7 py-1.5 bg-black/70 border border-stone-800 focus:border-amber-400 rounded-xl text-xs text-amber-100 placeholder:text-stone-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-stone-400 hover:text-stone-200"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* B. Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 text-[11px]">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-2 py-1 rounded-lg font-bold transition-all border ${activeFilter === "all"
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200"
                }`}
            >
              {t("atlasStudioFilterAll")}
            </button>

            <button
              onClick={() => setActiveFilter("popular")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all border ${activeFilter === "popular"
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/40 text-amber-300/80 border-stone-800 hover:text-amber-200"
                }`}
            >
              <Star size={11} className="text-amber-300 fill-amber-300/60" />
              {t("atlasStudioFilterPopular")}
            </button>

            <button
              onClick={() => setActiveFilter("character")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all border ${activeFilter === "character"
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200"
                }`}
            >
              <User size={11} />
              {t("atlasStudioFilterCharacters")}
            </button>

            <button
              onClick={() => setActiveFilter("enemy")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all border ${activeFilter === "enemy"
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200"
                }`}
            >
              <Skull size={11} />
              {t("atlasStudioFilterEnemies")}
            </button>

            <button
              onClick={() => setActiveFilter("structure")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all border ${activeFilter === "structure"
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200"
                }`}
            >
              <Building size={11} />
              {t("atlasStudioFilterStructures")}
            </button>

            <button
              onClick={() => setActiveFilter("portrait")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all border ${activeFilter === "portrait"
                  ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                  : "bg-black/40 text-stone-400 border-stone-800 hover:text-stone-200"
                }`}
            >
              <Sparkles size={11} />
              {t("atlasStudioFilterPortraits")}
            </button>
          </div>

          {/* C. Scrollable Asset List */}
          <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto custom-scrollbar pr-0.5">
            {filteredAssets.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 font-medium">
                {t("atlasStudioNoAssetsFound")}
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = asset.id === selectedPresetId;
                const meta = getCategoryMeta(asset.category);

                return (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onSelectPreset(asset.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all group ${isSelected
                        ? "bg-gradient-to-r from-amber-950/60 to-amber-900/40 border-amber-500/80 shadow-sm"
                        : "bg-black/40 border-stone-800/80 hover:bg-[#1a0c06] hover:border-amber-700/60"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#140804] border border-stone-800 flex items-center justify-center flex-shrink-0">
                        {meta.icon}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${isSelected
                                ? "text-amber-200"
                                : "text-stone-300 group-hover:text-amber-200"
                              }`}
                          >
                            {asset.name}
                          </span>
                          {asset.isPopular && (
                            <Star
                              size={11}
                              className="text-amber-400 fill-amber-400 flex-shrink-0"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-stone-500">
                            {asset.id}
                          </span>
                          {asset.tags && asset.tags.length > 0 && (
                            <span className="text-[9px] text-stone-400 truncate max-w-[140px]">
                              • {asset.tags.slice(0, 3).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <Badge variant={meta.variant} className="text-[9px] px-1.5 py-0 uppercase">
                        {asset.category}
                      </Badge>
                      {isSelected && <Check size={14} className="text-amber-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
