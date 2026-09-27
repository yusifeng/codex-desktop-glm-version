import { s as notifyFontMetricsChanged } from "@rchunk/thumbnail-worker-font-metrics";
import { getCarlitoFontFaceSourcesFromDocument, getFontDebugState, installFontFaces, type FontFaceSource } from "../shared/font-face-runtime";

async function installPopcornFontFaces(sources: readonly FontFaceSource[]): Promise<void> { await installFontFaces(sources, notifyFontMetricsChanged); }

export { getCarlitoFontFaceSourcesFromDocument as getPopcornCarlitoFontFaceSourcesFromDocument, getFontDebugState as getPopcornFontDebugState, installPopcornFontFaces };
