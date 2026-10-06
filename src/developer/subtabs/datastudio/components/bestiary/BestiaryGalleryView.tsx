import React from "react";
import { Skull } from "lucide-react";
import { EmptyState } from "@ui";
import { useI18n } from "@context/I18nContext";
import { EnemyJsonSchema } from "@lib/schemas/enemySchema";
import { BestiaryCardItem } from "./BestiaryCardItem";

export interface BestiaryGalleryViewProps {
  enemies: EnemyJsonSchema[];
  selectedEnemyId?: string;
  onSelectEnemy: (enemy: EnemyJsonSchema) => void;
}

export const BestiaryGalleryView: React.FC<BestiaryGalleryViewProps> = React.memo(
  ({ enemies, selectedEnemyId, onSelectEnemy }) => {
    const { t } = useI18n();

    if (enemies.length === 0) {
      return (
        <EmptyState
          icon={<Skull className="w-10 h-10 text-stone-600" />}
          title={t("dataStudioBestiaryEmptyTitle")}
          description={t("dataStudioBestiaryEmptyDesc")}
          className="min-h-[260px]"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {enemies.map((enemy) => (
          <BestiaryCardItem
            key={enemy.id}
            enemy={enemy}
            isSelected={enemy.id === selectedEnemyId}
            onSelect={onSelectEnemy}
          />
        ))}
      </div>
    );
  }
);
BestiaryGalleryView.displayName = "BestiaryGalleryView";
