/** Whether a path points at a supported document preview file (without a line anchor). */
export function isDocumentPreviewPath(input: { startLine?: unknown; fsPath?: string; path?: string }): boolean {
  return input.startLine == null && /\.(csv|docx|ipynb|pdf|pptx|tex|tsv|xlsm|xlsx)$/i.test(input.fsPath || input.path || "");
}
