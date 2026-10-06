import { useState, useMemo, useCallback } from "react";
import { ValidationResult, ValidationErrorDetail } from "@lib/schemas/commonSchema";
import { cloneEntityDraft } from "../services/entityDraftFactory";

export interface UseEntityDraftOptions<T extends { id: string }> {
  /** Array of existing domain entities */
  readonly initialItems: readonly T[];
  /** Factory producing a valid empty/default draft */
  readonly createDefaultDraft: () => Partial<T>;
  /** Validator returning schema compliance outcome */
  readonly validate: (draft: Partial<T>) => ValidationResult<T>;
  /** Optional initial selected entity ID */
  readonly initialSelectedId?: string;
}

export interface UseEntityDraftReturn<T extends { id: string }> {
  readonly selectedId: string;
  readonly setSelectedId: (id: string) => void;
  readonly draft: Partial<T>;
  readonly setDraft: React.Dispatch<React.SetStateAction<Partial<T>>>;
  readonly updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  readonly validationResult: ValidationResult<T>;
  readonly validationErrors: ValidationErrorDetail[];
  readonly isValid: boolean;
  readonly handleSelectPreset: (id: string) => void;
  readonly handleCreateNew: () => void;
  readonly resetToPreset: () => void;
}

/**
 * Universal hook managing entity draft editing, deep-clone isolation from static JSON,
 * preset switching, and real-time schema validation.
 */
export function useEntityDraft<T extends { id: string }>({
  initialItems,
  createDefaultDraft,
  validate,
  initialSelectedId,
}: UseEntityDraftOptions<T>): UseEntityDraftReturn<T> {
  const [selectedId, setSelectedId] = useState<string>(
    () => initialSelectedId ?? initialItems[0]?.id ?? ""
  );

  const initialItem = useMemo(() => {
    return initialItems.find((item) => item.id === selectedId) ?? initialItems[0];
  }, [initialItems, selectedId]);

  const [draft, setDraft] = useState<Partial<T>>(() => {
    return initialItem ? cloneEntityDraft(initialItem) : createDefaultDraft();
  });

  const handleSelectPreset = useCallback(
    (id: string) => {
      setSelectedId(id);
      const found = initialItems.find((item) => item.id === id);
      if (found) {
        setDraft(cloneEntityDraft(found));
      }
    },
    [initialItems]
  );

  const handleCreateNew = useCallback(() => {
    const newDraft = createDefaultDraft();
    setSelectedId(newDraft.id ?? "");
    setDraft(newDraft);
  }, [createDefaultDraft]);

  const resetToPreset = useCallback(() => {
    if (initialItem) {
      setDraft(cloneEntityDraft(initialItem));
    }
  }, [initialItem]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const validationResult = useMemo(() => {
    return validate(draft);
  }, [validate, draft]);

  const validationErrors = useMemo(() => {
    return validationResult.success ? [] : validationResult.errors;
  }, [validationResult]);

  return {
    selectedId,
    setSelectedId,
    draft,
    setDraft,
    updateField,
    validationResult,
    validationErrors,
    isValid: validationResult.success,
    handleSelectPreset,
    handleCreateNew,
    resetToPreset,
  };
}
