import {
  ValidationErrorDetail,
  ValidationResult,
  failureResult,
  successResult,
  validateArray,
  validateNonEmptyString,
  validateObject
} from "./commonSchema";

/**
 * Validates a dictionary (map) of items where keys match an item identifier if getId is provided.
 */
export function validateDictionary<T>(
  raw: unknown,
  path: string,
  errors: ValidationErrorDetail[],
  itemValidator: (item: unknown, itemPath: string) => ValidationResult<T>,
  getId?: (item: T) => string
): Record<string, T> | null {
  if (!validateObject(raw, path, errors)) {
    return null;
  }

  const result: Record<string, T> = {};
  for (const [key, val] of Object.entries(raw)) {
    const itemPath = `${path}.${key}`;
    const itemRes = itemValidator(val, itemPath);
    if (!itemRes.success) {
      errors.push(...itemRes.errors);
      continue;
    }

    if (getId) {
      const id = getId(itemRes.data);
      if (id !== key) {
        errors.push({
          path: `${itemPath}.id`,
          message: `Dictionary key '${key}' does not match item id '${id}'`,
          received: id
        });
      }
    }
    result[key] = itemRes.data;
  }

  return result;
}

export interface ValidateListOptions<T> {
  getId?: (item: T) => string;
  duplicateErrorMessage?: (id: string, index: number) => string;
}

/**
 * Generic list validator checking for array structure, item validation, and duplicate IDs.
 */
export function validateList<T>(
  raw: unknown,
  path: string,
  errors: ValidationErrorDetail[],
  itemValidator: (item: unknown, itemPath: string) => ValidationResult<T>,
  options?: ValidateListOptions<T>
): T[] | null {
  if (!validateArray(raw, path, errors)) {
    return null;
  }

  const items: T[] = [];
  const seenIds = new Set<string>();

  raw.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    const itemRes = itemValidator(item, itemPath);
    if (!itemRes.success) {
      errors.push(...itemRes.errors);
      return;
    }

    if (options?.getId) {
      const id = options.getId(itemRes.data);
      if (seenIds.has(id)) {
        const message = options.duplicateErrorMessage
          ? options.duplicateErrorMessage(id, index)
          : `Duplicate identifier '${id}' found in '${path}'`;
        errors.push({
          path: `${itemPath}.id`,
          message,
          received: id
        });
      } else {
        seenIds.add(id);
        items.push(itemRes.data);
      }
    } else {
      items.push(itemRes.data);
    }
  });

  return items;
}

/**
 * Validates a document wrapper containing a version string and a keyed dictionary.
 */
export function validateDocumentWrapper<T>(
  raw: unknown,
  docName: string,
  itemsKey: string,
  itemValidator: (item: unknown, itemPath: string) => ValidationResult<T>,
  getId?: (item: T) => string
): ValidationResult<{ version: string; items: Record<string, T> }> {
  const errors: ValidationErrorDetail[] = [];

  if (!validateObject(raw, docName, errors)) {
    return failureResult(errors);
  }

  validateNonEmptyString(raw.version, `${docName}.version`, errors);

  const rawRecord = raw as Record<string, unknown>;
  const items = validateDictionary(
    rawRecord[itemsKey],
    `${docName}.${itemsKey}`,
    errors,
    itemValidator,
    getId
  );

  if (errors.length > 0 || !items) {
    return failureResult(errors);
  }

  return successResult({
    version: rawRecord.version as string,
    items
  });
}

export interface ValidateFlexibleCollectionOptions<T> {
  collectionName: string;
  itemsKey: string;
  itemValidator: (item: unknown, itemPath: string) => ValidationResult<T>;
  getId: (item: T) => string;
  duplicateErrorMessage?: (id: string, index: number) => string;
  expectedTypeMessage?: string;
}

/**
 * Validates polymorphic JSON payloads that may arrive as a document wrapper, array, or ID-keyed map.
 */
export function validateFlexibleCollection<T>(
  raw: unknown,
  options: ValidateFlexibleCollectionOptions<T>
): ValidationResult<T[]> {
  const errors: ValidationErrorDetail[] = [];

  // Case 1: Document wrapper { version: "...", [itemsKey]: { ... } }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && options.itemsKey in raw) {
    const rawRecord = raw as Record<string, unknown>;
    validateNonEmptyString(rawRecord.version, `${options.collectionName}Document.version`, errors);
    const dict = validateDictionary(
      rawRecord[options.itemsKey],
      `${options.collectionName}Document.${options.itemsKey}`,
      errors,
      options.itemValidator,
      options.getId
    );
    if (errors.length > 0 || !dict) {
      return failureResult(errors);
    }
    return successResult(Object.values(dict));
  }

  // Case 2: Array of items
  if (Array.isArray(raw)) {
    const list = validateList(
      raw,
      options.collectionName,
      errors,
      options.itemValidator,
      {
        getId: options.getId,
        duplicateErrorMessage: options.duplicateErrorMessage
      }
    );
    if (errors.length > 0 || !list) {
      return failureResult(errors);
    }
    return successResult(list);
  }

  // Case 3: Direct dictionary of items
  if (typeof raw === "object" && raw !== null) {
    const dict = validateDictionary(
      raw,
      options.collectionName,
      errors,
      options.itemValidator
    );
    if (errors.length > 0 || !dict) {
      return failureResult(errors);
    }
    return successResult(Object.values(dict));
  }

  return failureResult([
    {
      path: options.collectionName,
      message: options.expectedTypeMessage || `Expected ${options.collectionName} document, dictionary or array`,
      received: raw
    }
  ]);
}
