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
  IPortraitMetaDocument,
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
  SlicingParser,
  defaultSlicingParser,
  BackgroundParser,
  defaultBackgroundParser,
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
  slicingParser?: SlicingParser;
  backgroundParser?: BackgroundParser;
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
  private readonly slicingParser: SlicingParser;
  private readonly backgroundParser: BackgroundParser;

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
    this.slicingParser = deps.slicingParser || defaultSlicingParser;
    this.backgroundParser = deps.backgroundParser || defaultBackgroundParser;
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
      slicing: this.slicingParser.parse(raw),
      backgroundConfig: this.backgroundParser.parse(raw),
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
      slicing: this.slicingParser.parse(raw),
      backgroundConfig: this.backgroundParser.parse(raw),
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
      slicing: this.slicingParser.parse(raw),
      backgroundConfig: this.backgroundParser.parse(raw),
    };
  }

  /**
   * Parses a portrait matrix document (e.g. Valen Portraits, Aurelia Portraits).
   */
  public parsePortrait(raw: unknown): IPortraitMetaDocument {
    const parsedPortraits = this.portraitParser.parse(raw);
    const atlas = this.atlasParser.parse(raw);

    return {
      info: this.infoParser.parse(raw),
      atlas,
      portraits: parsedPortraits || {
        columns: atlas.columns || 5,
        rows: atlas.rows || 5,
        cellWidth: atlas.cellWidth || 232,
        cellHeight: atlas.cellHeight || 270,
        spacing: atlas.spacing || 0,
        map: [],
      },
      animations: this.animationsParser.parse(raw),
      layout: this.layoutParser.parse(raw),
      constraints: this.constraintsParser.parse(raw),
      slicing: this.slicingParser.parse(raw),
      backgroundConfig: this.backgroundParser.parse(raw),
    };
  }

  /**
   * Automatically inspects entityType and dispatches to the specialized role parser (OCP & ISP).
   */
  public parseAuto(raw: unknown): IUniversalMetaDocument | ICharacterMetaDocument | ICreatureMetaDocument | IStructureMetaDocument | IPortraitMetaDocument {
    if (typeof raw !== "object" || raw === null) {
      return this.parseUniversal(raw);
    }
    const doc = raw as Record<string, any>;
    const entityType = doc.entityType || doc.info?.entityType;

    if (entityType === "portrait") {
      return this.parsePortrait(raw);
    }
    if (entityType === "humanoid" || entityType === "character") {
      return this.parseCharacter(raw);
    }
    if (entityType === "creature" || entityType === "monster" || entityType === "boss") {
      return this.parseCreature(raw);
    }
    if (entityType === "structure" || entityType === "interactive_object" || entityType === "prop") {
      return this.parseStructure(raw);
    }
    return this.parseUniversal(raw);
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
      slicing: this.slicingParser.parse(raw),
      backgroundConfig: this.backgroundParser.parse(raw),
    };
  }
}

export const defaultMetaParser = new MetaParser();
