import "@rchunk/rolldown-runtime";
import { c as notifyFontMetricsChanged, i as initializeFontMetrics } from "@rchunk/portable-thumbnail-font-metrics";
import { getCarlitoFontFaceSourcesFromDocument, getFontDebugState, installFontFaces, type FontFaceSource } from "../shared/font-face-runtime";

async function installPortableFontFaces(sources: readonly FontFaceSource[]): Promise<void> { await installFontFaces(sources, notifyFontMetricsChanged); }
function initializePortableFontFaceSources(): void { initializeFontMetrics(); }

export { installPortableFontFaces as i, getFontDebugState as n, initializePortableFontFaceSources as r, getCarlitoFontFaceSourcesFromDocument as t };
