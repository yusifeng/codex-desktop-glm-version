import "@rchunk/rolldown-runtime";
import {
  a as selectedFontAliasExport,
  n as escapeFontFamilyExport,
  t as fontFamilyMatchesExport,
} from "@rchunk/theme-font-family";
import type { ThemeFontFace } from "@rchunk/theme-font-family";

const selectedFontAlias = selectedFontAliasExport;
const escapeFontFamily = escapeFontFamilyExport;
const fontFamilyMatches = fontFamilyMatchesExport;

interface ThemeFontSelection {
  code?: string | null;
  codeFace?: ThemeFontFace | null;
  content?: string | null;
  contentFace?: ThemeFontFace | null;
  ui?: string | null;
  uiFace?: ThemeFontFace | null;
}

interface FontLoadState {
  loadedAliases: Set<string>;
  loadingByAlias: Map<string, Promise<boolean>>;
}

let loadStates = new WeakMap<FontFaceSet, FontLoadState>();

function stateFor(fonts: FontFaceSet): FontLoadState {
  let state = loadStates.get(fonts);
  if (state == null) {
    state = { loadedAliases: new Set(), loadingByAlias: new Map() };
    loadStates.set(fonts, state);
  }
  return state;
}

async function loadThemeFontFace(fontFace: ThemeFontFace): Promise<boolean> {
  if (typeof FontFace === "undefined" || document.fonts == null) return false;
  const fonts = document.fonts;
  const alias = selectedFontAlias(fontFace);
  const state = stateFor(fonts);
  if (state.loadedAliases.has(alias)) return true;
  const existing = state.loadingByAlias.get(alias);
  if (existing != null) return existing;
  let loading: Promise<boolean>;
  try {
    loading = new FontFace(
      alias,
      `local("${escapeFontFamily(fontFace.postscriptName)}"), local("${escapeFontFamily(fontFace.fullName)}")`,
    )
      .load()
      .then((loaded) => {
        fonts.add(loaded);
        state.loadedAliases.add(alias);
        return true;
      })
      .catch(() => false)
      .finally(() => state.loadingByAlias.delete(alias));
  } catch {
    return false;
  }
  state.loadingByAlias.set(alias, loading);
  return loading;
}

async function loadSelectedThemeFonts(
  selections: readonly ThemeFontSelection[],
): Promise<void> {
  const selected = new Map<string, ThemeFontFace>();
  for (const selection of selections) {
    if (
      selection.codeFace != null &&
      fontFamilyMatches(selection.code, selection.codeFace)
    )
      selected.set(selectedFontAlias(selection.codeFace), selection.codeFace);
    if (
      selection.contentFace != null &&
      fontFamilyMatches(selection.content ?? null, selection.contentFace)
    )
      selected.set(
        selectedFontAlias(selection.contentFace),
        selection.contentFace,
      );
    if (
      selection.uiFace != null &&
      fontFamilyMatches(selection.ui, selection.uiFace)
    )
      selected.set(selectedFontAlias(selection.uiFace), selection.uiFace);
  }
  await Promise.all([...selected.values()].map(loadThemeFontFace));
}

function initializeThemeFontFaceLoader(): void {
  loadStates = new WeakMap();
}

export {
  loadThemeFontFace as n,
  loadSelectedThemeFonts as r,
  initializeThemeFontFaceLoader as t,
};
