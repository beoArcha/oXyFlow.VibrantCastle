/**
 * Base Context Interface.
 * Defines the standard lifecycle, storage persistence, and serialization contract.
 */
export interface IContext<T = unknown> {
  /**
   * Flag indicating if initial state has been restored from storage or defaults.
   */
  isLoaded: boolean;

  /**
   * Resets the context state to its initial default configuration.
   */
  resetToDefaults: () => void;

  /**
   * Persists the context state to browser LocalStorage.
   */
  saveToLocalStorage: () => void;

  /**
   * Restores the context state from browser LocalStorage.
   * @returns true if state was found and successfully applied, false otherwise.
   */
  loadFromLocalStorage: () => boolean;

  /**
   * Serializes current state to a formatted JSON string.
   */
  exportToJson: () => string;

  /**
   * Parses and applies a serialized JSON string.
   * @returns true if JSON was valid and applied, false otherwise.
   */
  importFromJson: (jsonString: string) => boolean;
}
