// Loads font faces required by the active theme. Release chunk: active-theme-font-face-loader-932b256c28db.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as fontFamilyChunk from "@rchunk/theme-font-family";
import * as fontFaceLoaderChunk from "@rchunk/theme-font-face-loader";

interface Fonts {
  code: unknown;
  codeFace?: unknown;
  content?: unknown;
  contentFace?: unknown;
  ui: unknown;
  uiFace?: unknown;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}
const shared = appSharedChunk as unknown as Record<string, unknown>;
let jsxRuntime: JsxRuntime;
function ActiveThemeFontFaceLoader({ fonts }: { fonts: Fonts }): unknown {
  const matches = (
    fontFamilyChunk as unknown as { t(value: unknown, face: unknown): boolean }
  ).t;
  const shouldLoad =
    (fonts.codeFace != null && matches(fonts.code, fonts.codeFace)) ||
    (fonts.contentFace != null &&
      matches(fonts.content ?? null, fonts.contentFace)) ||
    (fonts.uiFace != null && matches(fonts.ui, fonts.uiFace));
  if (!shouldLoad) return null;
  return jsxRuntime.jsx(FontFaceQuery, { fonts });
}

function FontFaceQuery({ fonts }: { fonts: Fonts }): null {
  const useQuery = shared._L as ((options: unknown) => unknown) | undefined;
  const load = (
    fontFaceLoaderChunk as unknown as { r(fonts: Fonts[]): Promise<unknown> }
  ).r;
  useQuery?.({
    queryFn: () => load([fonts]),
    queryKey: ["active-theme-font-faces", fonts],
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  return null;
}
function initializeActiveThemeFontFaceLoader(): void {
  (shared.gL as (() => void) | undefined)?.();
  (fontFaceLoaderChunk as unknown as { t?: () => void }).t?.();
  jsxRuntime = (shared.I3 as () => JsxRuntime)();
  void jsxRuntime;
}
initializeActiveThemeFontFaceLoader();

export { ActiveThemeFontFaceLoader };
