import "@rchunk/rolldown-runtime";

export interface ThemeFontFace {
  family: string;
  fullName: string;
  postscriptName: string;
}

function selectedFontAlias(fontFace: ThemeFontFace): string {
  return `Codex selected ${fontFace.postscriptName}`;
}

function firstFontFamily(fontFamily: string): string {
  let quote: string | null = null;
  for (let index = 0; index < fontFamily.length; index += 1) {
    const character = fontFamily[index];
    if (character === "\\") index += 1;
    else if (quote != null) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") quote = character;
    else if (character === ",") return fontFamily.slice(0, index).trim();
  }
  return fontFamily.trim();
}

function unquoteFontFamily(fontFamily?: string | null): string | undefined {
  if (fontFamily == null) return undefined;
  return (
    firstFontFamily(fontFamily)
      .replace(/^["']|["']$/g, "")
      .replace(/\\(.)/gsu, "$1") || undefined
  );
}

function fontFamilyMatches(
  fontFamily: string | null | undefined,
  fontFace: ThemeFontFace,
): boolean {
  return (
    unquoteFontFamily(fontFamily)?.toLowerCase() ===
    fontFace.family.toLowerCase()
  );
}

function escapeFontFamily(fontFamily: string): string {
  return fontFamily.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function prependSelectedFont(
  fontFamily: string | null | undefined,
  fontFace: ThemeFontFace | null | undefined,
): string | null | undefined {
  if (
    fontFamily == null ||
    fontFace == null ||
    !fontFamilyMatches(fontFamily, fontFace)
  )
    return fontFamily;
  return `"${escapeFontFamily(selectedFontAlias(fontFace))}", ${fontFamily}`;
}

function initializeThemeFontFamily(): void {}
export {
  selectedFontAlias as a,
  firstFontFamily as i,
  escapeFontFamily as n,
  prependSelectedFont as o,
  unquoteFontFamily as r,
  initializeThemeFontFamily as s,
  fontFamilyMatches as t,
};
