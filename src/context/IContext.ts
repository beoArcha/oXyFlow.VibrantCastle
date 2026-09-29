import React from "react";
import { Player } from "@game/types";
import { GameEngine } from "@game/loop/engine";

/**
 * Granular capability interfaces following the Interface Segregation Principle (ISP)
 * and composition over inheritance.
 */

/**
 * Base props interface for any React Context Provider in the application.
 */
export interface BaseProviderProps {
  children: React.ReactNode;
}

/**
 * Props interface for Providers that bind to an instance of the GameEngine.
 */
export interface EngineBoundProviderProps extends BaseProviderProps {
  engine: GameEngine;
}

/**
 * Capability interface for contexts supporting an asynchronous or deferred loading state.
 */
export interface ILoadableContext {
  isLoaded: boolean;
}

/**
 * Capability interface for contexts that can be restored to initial defaults.
 */
export interface IResettableContext {
  resetToDefaults: () => void;
}

/**
 * Capability interface for contexts with direct browser storage persistence.
 */
export interface IPersistentContext extends ILoadableContext, IResettableContext {
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
}

/**
 * Capability interface for contexts supporting in-memory JSON string serialization.
 */
export interface ISerializableContext {
  exportToJson: () => string;
  importFromJson: (jsonString: string) => boolean;
}

/**
 * Capability interface for contexts supporting file import and export operations on the filesystem.
 */
export interface IFilePersistenceContext {
  exportToFile: () => void;
  importFromFile: (file: File) => Promise<boolean>;
}

/**
 * Capability interface for contexts scoped to an active player/character (multi-player aware).
 */
export interface IPlayerScopedContext extends ILoadableContext, IResettableContext {
  activePlayerIndex: number;
  setActivePlayerIndex: (idx: number) => void;
  activePlayer: Player | undefined;
}

/**
 * Capability interface for contexts that manage notifications or status messages.
 */
export interface INotifiableContext {
  notification: string;
  showNotification: (msg: string, durationMs?: number) => void;
}

/**
 * Composite context interface combining storage persistence, serialization, and file I/O capabilities.
 */
export interface IContext extends IPersistentContext, ISerializableContext, IFilePersistenceContext {}
