/**
 * Safely serializes an arbitrary object to a JSON string.
 * Handles circular references, BigInt values, and serialization failures gracefully.
 *
 * @param value The value to serialize.
 * @param indent Optional indentation space count.
 * @returns Safe JSON string or a fallback placeholder on failure.
 */
export function safeStringify(value: unknown, indent?: number): string {
  if (value === undefined) {
    return "";
  }
  if (value === null) {
    return "null";
  }

  const seen = new WeakSet<object>();

  try {
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === "bigint") {
          return val.toString();
        }
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) {
            return "[Circular]";
          }
          seen.add(val);
        }
        return val;
      },
      indent
    );
  } catch {
    return "[Unserializable]";
  }
}
