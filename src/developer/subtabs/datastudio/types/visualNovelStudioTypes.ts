import { VnSpeakerPosition } from "@lib/schemas/visualNovelSchema";

export interface StageActor {
  readonly id: string;
  readonly displayName: string;
  readonly position: VnSpeakerPosition;
  readonly emotion: string;
  readonly isActive: boolean;
  readonly isNarrator: boolean;
  readonly isHero: boolean;
}

export interface SceneSummaryOption {
  readonly sceneId: string;
  readonly title: string;
  readonly nodeCount: number;
  readonly characterCount: number;
}
