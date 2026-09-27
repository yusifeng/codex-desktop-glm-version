import {
  B4t as initializeImagePreviewSource,
  U3t as initializeImageOutputVisibility,
  V3t as getImagePreview,
  Y9t as initializeOutputVisibility,
  q9t as getImageOutputVisibility,
  z4t as getImagePreviewSource,
} from "@rchunk/app-initial";

function getSummaryPanelImagePreview(value: unknown): unknown | null {
  return getImageOutputVisibility(value) !== "always" || getImagePreview(value) == null
    ? null
    : getImagePreviewSource(value);
}

function initializeSummaryPanelImagePreview(): void {
  initializeOutputVisibility();
  initializeImageOutputVisibility();
  initializeImagePreviewSource();
}

export {
  initializeSummaryPanelImagePreview as n,
  getSummaryPanelImagePreview as t,
};
