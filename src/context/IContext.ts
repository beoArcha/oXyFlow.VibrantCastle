/**
 * Granular capability interfaces following the Interface Segregation Principle (ISP)
 * and composition over inheritance.
 */

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
 * Capability interface for contexts supporting file / JSON string serialization.
 */
export interface ISerializableContext {
  exportToJson: () => string;
  importFromJson: (jsonString: string) => boolean;
}

/**
 * Composite context interface maintained for backward compatibility.
 */
export interface IContext<T = unknown> extends IPersistentContext, ISerializableContext {}
