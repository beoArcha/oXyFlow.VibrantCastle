/**
 * Deterministic engine for evaluating and traversing Visual Novel dialogue scenes,
 * branching choice conditions, and history tracking.
 */

import { Result, ok, err, GameplayError, ErrorCode } from "@lib/errors";
import {
  VisualNovelSceneJsonSchema,
  VisualNovelNodeSchema,
  VnChoiceSchema
} from "@lib/schemas/visualNovelSchema";

export interface DialogueSessionContext {
  playerLevel?: number;
  storyFlags?: Set<string>;
  inventoryItems?: Set<string>;
}

export class DialogueGraphRunner {
  private readonly scene: VisualNovelSceneJsonSchema;
  private context: DialogueSessionContext;
  private currentNodeId: string | null = null;
  private readonly history: string[] = [];
  private finished = false;

  constructor(scene: VisualNovelSceneJsonSchema, context: DialogueSessionContext = {}) {
    this.scene = scene;
    this.context = {
      playerLevel: context.playerLevel ?? 1,
      storyFlags: context.storyFlags ? new Set(context.storyFlags) : new Set(),
      inventoryItems: context.inventoryItems ? new Set(context.inventoryItems) : new Set()
    };
  }

  public updateContext(partialContext: Partial<DialogueSessionContext>): void {
    if (partialContext.playerLevel !== undefined) {
      this.context.playerLevel = partialContext.playerLevel;
    }
    if (partialContext.storyFlags) {
      this.context.storyFlags = new Set(partialContext.storyFlags);
    }
    if (partialContext.inventoryItems) {
      this.context.inventoryItems = new Set(partialContext.inventoryItems);
    }
  }

  public start(): VisualNovelNodeSchema | null {
    this.history.length = 0;
    this.finished = false;
    const initialNode = this.scene.nodes[this.scene.initialNodeId];
    if (!initialNode) {
      this.currentNodeId = null;
      this.finished = true;
      return null;
    }

    this.currentNodeId = initialNode.id;
    this.history.push(initialNode.id);
    return initialNode;
  }

  public getCurrentNode(): VisualNovelNodeSchema | null {
    if (!this.currentNodeId) return null;
    return this.scene.nodes[this.currentNodeId] ?? null;
  }

  public getAvailableChoices(): VnChoiceSchema[] {
    const node = this.getCurrentNode();
    if (!node || !node.choices || node.choices.length === 0) {
      return [];
    }

    return node.choices.filter((choice) => this.isChoiceAvailable(choice));
  }

  public isChoiceAvailable(choice: VnChoiceSchema): boolean {
    const cond = choice.conditions;
    if (!cond) return true;

    if (cond.minPlayerLevel !== undefined) {
      const level = this.context.playerLevel ?? 1;
      if (level < cond.minPlayerLevel) return false;
    }

    if (cond.requiredStoryFlag) {
      if (!this.context.storyFlags?.has(cond.requiredStoryFlag)) {
        return false;
      }
    }

    if (cond.requiredItem) {
      if (!this.context.inventoryItems?.has(cond.requiredItem)) {
        return false;
      }
    }

    return true;
  }

  public choose(choiceId: string): Result<VisualNovelNodeSchema, GameplayError> {
    const node = this.getCurrentNode();
    if (!node) {
      return err(
        new GameplayError(
          "Cannot choose: no active dialogue node",
          ErrorCode.GAMEPLAY_INVALID_ACTION
        )
      );
    }

    const choice = node.choices?.find((c) => c.choiceId === choiceId);
    if (!choice) {
      return err(
        new GameplayError(
          `Choice '${choiceId}' not found on node '${node.id}'`,
          ErrorCode.GAMEPLAY_INVALID_ACTION
        )
      );
    }

    if (!this.isChoiceAvailable(choice)) {
      return err(
        new GameplayError(
          `Choice '${choiceId}' requirements not satisfied`,
          ErrorCode.GAMEPLAY_INVALID_ACTION
        )
      );
    }

    const nextNode = this.scene.nodes[choice.targetNodeId];
    if (!nextNode) {
      return err(
        new GameplayError(
          `Target node '${choice.targetNodeId}' not found in scene`,
          ErrorCode.GAMEPLAY_INVALID_ACTION
        )
      );
    }

    this.currentNodeId = nextNode.id;
    this.history.push(nextNode.id);

    return ok(nextNode);
  }

  public advance(): Result<VisualNovelNodeSchema | null, GameplayError> {
    const node = this.getCurrentNode();
    if (!node) {
      return ok(null);
    }

    // If node requires a choice and has no direct nextNodeId
    if (node.choices && node.choices.length > 0 && !node.nextNodeId) {
      return err(
        new GameplayError(
          `Node '${node.id}' requires player choice selection before advancing`,
          ErrorCode.GAMEPLAY_INVALID_ACTION
        )
      );
    }

    if (!node.nextNodeId) {
      this.currentNodeId = null;
      this.finished = true;
      return ok(null);
    }

    const nextNode = this.scene.nodes[node.nextNodeId];
    if (!nextNode) {
      this.currentNodeId = null;
      this.finished = true;
      return err(
        new GameplayError(
          `Next node '${node.nextNodeId}' does not exist in scene`,
          ErrorCode.GAMEPLAY_INVALID_ACTION
        )
      );
    }

    this.currentNodeId = nextNode.id;
    this.history.push(nextNode.id);

    return ok(nextNode);
  }

  public isFinished(): boolean {
    if (this.finished || this.currentNodeId === null) return true;
    const node = this.getCurrentNode();
    if (!node) return true;
    const hasNext = Boolean(node.nextNodeId);
    const hasChoices = Boolean(node.choices && node.choices.length > 0);
    return !hasNext && !hasChoices;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public reset(): void {
    this.currentNodeId = null;
    this.history.length = 0;
    this.finished = false;
  }
}
