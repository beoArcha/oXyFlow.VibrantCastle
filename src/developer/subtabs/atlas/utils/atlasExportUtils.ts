/**
 * Utility functions for exporting and downloading Atlas artifacts (JSON metadata, baked PNG textures).
 */

/**
 * Initiates a browser download for a Blob file.
 * Handles DOM attachment and ObjectURL lifecycle safely.
 */
export function downloadBlob(filename: string, blob: Blob): void {
  if (typeof document === "undefined") {
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats a clean export filename for an atlas preset and extension.
 */
export function formatAtlasExportFileName(
  assetId?: string,
  suffix: "meta" | "cleaned" = "meta",
  extension: "json" | "png" = "json"
): string {
  const sanitizedId = (assetId || "atlas").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `${sanitizedId}_${suffix}.${extension}`;
}

/**
 * Serializes and triggers a download of JSON metadata.
 */
export function downloadJsonFile(filename: string, data: unknown): void {
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  downloadBlob(filename, blob);
}
