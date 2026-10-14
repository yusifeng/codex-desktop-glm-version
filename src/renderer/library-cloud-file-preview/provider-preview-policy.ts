type ProviderPreviewFile = {
  mimeType?: string | null;
  provider?: string | null;
  sourceUrl?: string | null;
};

/** Resolves provider-owned browser previews before local materialization/rendering. */
export function resolveProviderPreviewUrl(
  file: ProviderPreviewFile,
  googleWorkspaceIframePreviewEnabled: boolean,
): string | null {
  if (!googleWorkspaceIframePreviewEnabled || file.provider !== "google_drive") return null;
  const sourceUrl = file.sourceUrl?.trim();
  if (sourceUrl == null || sourceUrl === "") return null;
  const mimeType = file.mimeType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (mimeType.startsWith("application/vnd.google-apps.") || mimeType === "text/html") return sourceUrl;
  return null;
}
