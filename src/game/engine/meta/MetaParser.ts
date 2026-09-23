/**
 * MetaParser.ts
 *
 * Universal Orchestrator & Factory for Entity and Atlas Metadata Documents.
 * Adheres strictly to SOLID:
 * - OCP: Open for extension via pluggable sub-parsers without modifying core orchestration.
 * - DIP: Injects domain section parsers with robust defaults.
 * - ISP: Exposes role-specialized parsing methods (parseCharacter, parseCreature, parseStructure, parseUniversal).
 */

import {
  ICharacterMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
  IUniversalMetaDocument,
} from "./types";

import {
  MetaInfoParser,
  defaultMetaInfoParser,
  AtlasGridParser,
  defaultAtlasGridParser,
  VariantsParser,
  defaultVariantsParser,
  AnimationTracksParser,
  defaultAnimationTracksParser,
  SpatialLayoutParser,
  defaultSpatialLayoutParser,
  PortraitMatrixParser,
  defaultPortraitMatrixParser,
  StateMappingParser,
  defaultStateMappingParser,
  InfoFramesParser,
  defaultInfoFramesParser,
  InteractionParser,
  defaultInteractionParser,
  RenderDirectivesParser,
  defaultRenderDirectivesParser,
  ConstraintsParser,
  defaultConstraintsParser,
} from "./parsers";

export interface IMetaParserDependencies {
  infoParser?: MetaInfoParser;
  atlasParser?: AtlasGridParser;
  variantsParser?: VariantsParser;
  animationsParser?: AnimationTracksParser;
  layoutParser?: SpatialLayoutParser;
  portraitParser?: PortraitMatrixParser;
  stateParser?: StateMappingParser;
  infoFramesParser?: InfoFramesParser;
  interactionParser?: InteractionParser;
  renderParser?: RenderDirectivesParser;
  constraintsParser?: ConstraintsParser;
}

export class MetaParser {
  private readonly infoParser: MetaInfoParser;
  private readonly atlasParser: AtlasGridParser;
  private readonly variantsParser: VariantsParser;
  private readonly animationsParser: AnimationTracksParser;
  private readonly layoutParser: SpatialLayoutParser;
  private readonly portraitParser: PortraitMatrixParser;
  private readonly stateParser: StateMappingParser;
  private readonly infoFramesParser: InfoFramesParser;
  private readonly interactionParser: InteractionParser;
  private readonly renderParser: RenderDirectivesParser;
  private readonly constraintsParser: ConstraintsParser;

  constructor(deps: IMetaParserDependencies = {}) {
    this.infoParser = deps.infoParser || defaultMetaInfoParser;
    this.atlasParser = deps.atlasParser || defaultAtlasGridParser;
    this.variantsParser = deps.variantsParser || defaultVariantsParser;
    this.animationsParser = deps.animationsParser || defaultAnimationTracksParser;
    this.layoutParser = deps.layoutParser || defaultSpatialLayoutParser;
    this.portraitParser = deps.portraitParser || defaultPortraitMatrixParser;
    this.stateParser = deps.stateParser || defaultStateMappingParser;
    this.infoFramesParser = deps.infoFramesParser || defaultInfoFramesParser;
    this.interactionParser = deps.interactionParser || defaultInteractionParser;
    this.renderParser = deps.renderParser || defaultRenderDirectivesParser;
    this.constraintsParser = deps.constraintsParser || defaultConstraintsParser;
  }

  /**
   * Parses a humanoid player character document (e.g. Valen, Aurelia).
   */
  public parseCharacter(raw: unknown): ICharacterMetaDocument {
    return {
      info: this.infoParser.parse(raw),
      atlas: this.atlasParser.parse(raw),
      variants: this.variantsParser.parse(raw),
      animations: this.animationsParser.parse(raw),
      layout: this.layoutParser.parse(raw),
      portraits: this.portraitParser.parse(raw),
      constraints: this.constraintsParser.parse(raw),
    };
  }

  /**
   * Parses a creature or enemy monster document (e.g. Clockwork Owl Gargoyle, Training Dummy).
   */
  public parseCreature(raw: unknown): ICreatureMetaDocument {
    return {
      info: this.infoParser.parse(raw),
      atlas: this.atlasParser.parse(raw),
      variants: this.variantsParser.parse(raw),
      animations: this.animationsParser.parse(raw),
      layout: this.layoutParser.parse(raw),
      states: this.stateParser.parse(raw),
      infoFrames: this.infoFramesParser.parse(raw),
      constraints: this.constraintsParser.parse(raw),
    };
  }

  /**
   * Parses an interactive structure, portal, or gateway document (e.g. Aether Gate, Chrono Lever).
   */
  public parseStructure(raw: unknown): IStructureMetaDocument {
    return {
      info: this.infoParser.parse(raw),
      atlas: this.atlasParser.parse(raw),
      variants: this.variantsParser.parse(raw),
      animations: this.animationsParser.parse(raw),
      layout: this.layoutParser.parse(raw),
      states: this.stateParser.parse(raw),
      infoFrames: this.infoFramesParser.parse(raw),
      interaction: this.interactionParser.parse(raw),
      render: this.renderParser.parse(raw),
      constraints: this.constraintsParser.parse(raw),
    };
  }

  /**
   * Parses any entity document into a universal composite format.
   * Dynamically auto-detects or includes all present sections.
   */
  public parseUniversal(raw: unknown): IUniversalMetaDocument {
    return {
      info: this.infoParser.parse(raw),
      atlas: this.atlasParser.parse(raw),
      variants: this.variantsParser.parse(raw),
      animations: this.animationsParser.parse(raw),
      layout: this.layoutParser.parse(raw),
      portraits: this.portraitParser.parse(raw),
      states: this.stateParser.parse(raw),
      infoFrames: this.infoFramesParser.parse(raw),
      interaction: this.interactionParser.parse(raw),
      render: this.renderParser.parse(raw),
      constraints: this.constraintsParser.parse(raw),
    };
  }
}

export const defaultMetaParser = new MetaParser();
