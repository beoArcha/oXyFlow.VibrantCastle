export interface MockStorageProvider {
  store: Record<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, val: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

export function createMockStorageProvider(
  initialData: Record<string, string> = {}
): MockStorageProvider {
  const store: Record<string, string> = { ...initialData };

  return {
    store,
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
  };
}
