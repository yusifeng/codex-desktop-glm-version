export interface BoxLibraryFile {
  id: string;
  name: string;
  mimeType?: string | null;
  provider?: string | null;
}

export interface BoxFilePreview {
  previewUrl: string;
  sourceUrl: string;
}

const BOX_FILE_ID = /^external-box:(?:account:(?:[A-Za-z0-9._~-]|%[0-9A-F]{2}){1,512}:)?file:([1-9][0-9]{0,511})$/u;

/** Resolves Box library files to their preview and source URLs. */
export function resolveBoxFilePreview(file: BoxLibraryFile, enabled: boolean): BoxFilePreview | null {
  const match = BOX_FILE_ID.exec(file.id);
  if (!enabled || file.provider !== "box" || match == null || match[0] !== file.id) return null;
  const isBoxNote =
    file.name.trim().toLowerCase().endsWith(".boxnote") ||
    file.mimeType?.split(";")[0]?.trim().toLowerCase() === "application/vnd.box.note";
  return {
    previewUrl: `https://app.box.com/embed/file/${match[1]}?showParentPath=false&${isBoxNote ? "hideNavigationControls=true" : "uxLite=true"}`,
    sourceUrl: `https://app.box.com/file/${match[1]}`,
  };
}
