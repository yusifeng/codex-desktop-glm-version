import "@rchunk/rolldown-runtime";
import { i as installPortableFontFaces, r as initializePortableFontFaceSources, t as getCarlitoFontFaceSourcesFromDocument } from "@rchunk/portable-thumbnail-font-face-source-runtime";

let fontLoadPromise: Promise<void> | null = null;
let fontsLoaded = false;

function ensurePortableThumbnailFontsLoaded(): Promise<void> {
  fontLoadPromise ??= Promise.resolve().then(async () => {
    if (typeof document !== "undefined" && document.fonts?.load != null) {
      await Promise.all(["400", "700"].map((weight) => document.fonts.load(`${weight} 16px Carlito`)));
      await installPortableFontFaces(getCarlitoFontFaceSourcesFromDocument());
    }
  }).catch(() => {}).then(() => { fontsLoaded = true; });
  return fontLoadPromise;
}
function arePortableThumbnailFontsLoaded(): boolean { return fontsLoaded; }
function initializePortableThumbnailFontRuntime(): void { initializePortableFontFaceSources(); }
function initializePortableThumbnailFontPreload(): void {}
function initializePortableThumbnailFontStatus(): void {}

export { initializePortableThumbnailFontPreload as a, initializePortableThumbnailFontStatus as i, ensurePortableThumbnailFontsLoaded as n, initializePortableThumbnailFontRuntime as r, arePortableThumbnailFontsLoaded as t };
