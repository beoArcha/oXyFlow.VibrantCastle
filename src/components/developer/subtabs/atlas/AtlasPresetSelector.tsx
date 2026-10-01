import React, { useState, useRef, useEffect, useMemo } from "react";
import { defaultAtlasAssetRegistry } from "@game/engine/meta/registry";
import {
  AssetFilterType,
  AtlasPresetTriggerButton,
  AtlasPresetSearchInput,
  AtlasPresetCategoryFilter,
  AtlasPresetList,
} from "./presets";

export { type AssetFilterType } from "./presets";

export interface AtlasPresetSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  className?: string;
}

/**
 * AtlasPresetSelector Component.
 * Orchestrates preset selection through a searchable, category-filtered dropdown popover.
 * Decomposed into focused presentational components under presets/.
 */
export const AtlasPresetSelector: React.FC<AtlasPresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  className = "",
}) => {
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

  // Filtered asset list from registry
  const filteredAssets = useMemo(() => {
    return defaultAtlasAssetRegistry.search(searchQuery, activeFilter);
  }, [searchQuery, activeFilter]);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <AtlasPresetTriggerButton
        activeAsset={activeAsset}
        isOpen={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-[340px] sm:w-[420px] bg-[#0d0705] border border-amber-600/50 rounded-2xl shadow-2xl shadow-black/90 p-3 flex flex-col gap-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <AtlasPresetSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            inputRef={searchInputRef}
          />

          <AtlasPresetCategoryFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          <AtlasPresetList
            assets={filteredAssets}
            selectedPresetId={selectedPresetId}
            onSelectPreset={(presetId) => {
              onSelectPreset(presetId);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AtlasPresetSelector;
