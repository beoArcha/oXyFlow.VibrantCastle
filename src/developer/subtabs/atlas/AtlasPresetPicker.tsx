import React from "react";
import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  SearchInput,
  FileUploadButton,
} from "@ui";
import type { AtlasAssetPreset } from "./assetPresets";
import { CATEGORY_FILTERS, type CategoryFilter } from "./types";

export interface AtlasPresetPickerProps {
  readonly categoryFilter: CategoryFilter;
  readonly onCategoryFilterChange: (category: CategoryFilter) => void;
  readonly presetSearch: string;
  readonly onPresetSearchChange: (value: string) => void;
  readonly filteredPresets: readonly AtlasAssetPreset[];
  readonly activePresetId: string | undefined;
  readonly hasCustomImage: boolean;
  readonly onSelectPreset: (presetId: string) => void;
  readonly onUploadImage: (file: File) => void;
  readonly onUploadMeta: (file: File) => void;
}

/**
 * Top preset filter, search, and custom texture/meta upload bar for the Atlas Slicer.
 */
export const AtlasPresetPicker: React.FC<AtlasPresetPickerProps> = ({
  categoryFilter,
  onCategoryFilterChange,
  presetSearch,
  onPresetSearchChange,
  filteredPresets,
  activePresetId,
  hasCustomImage,
  onSelectPreset,
  onUploadImage,
  onUploadMeta,
}) => (
  <Card variant="subtle">
    <CardContent className="p-3 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={categoryFilter === cat.id ? "primary" : "secondary"}
              onClick={() => onCategoryFilterChange(cat.id)}
              className="whitespace-nowrap shrink-0 px-3"
            >
              {cat.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={presetSearch}
            onChange={(val) => onPresetSearchChange(val)}
            onClear={() => onPresetSearchChange("")}
            placeholder="Filtruj presety..."
            className="w-44"
          />
          <FileUploadButton
            accept="image/png,image/webp,image/svg+xml"
            label="Wgraj PNG"
            icon={<Upload size={13} />}
            variant="secondary"
            size="sm"
            className="whitespace-nowrap shrink-0"
            onFileSelect={onUploadImage}
          />
          <FileUploadButton
            accept="application/json,.json"
            label="Wgraj meta.json"
            icon={<Upload size={13} />}
            variant="outline"
            size="sm"
            className="whitespace-nowrap shrink-0"
            onFileSelect={onUploadMeta}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {filteredPresets.map((preset) => (
          <Button
            key={preset.id}
            size="sm"
            variant={
              !hasCustomImage && preset.id === activePresetId ? "primary" : "ghost"
            }
            onClick={() => onSelectPreset(preset.id)}
            className="whitespace-nowrap shrink-0 px-3"
          >
            {preset.name}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);
