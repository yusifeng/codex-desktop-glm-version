export interface FontFaceSource {
  family: string;
  format: string;
  src: string;
  style: string;
  unicodeRange?: string;
  weight: string;
}

interface FontFaceSetLike {
  add?(font: FontFace): void;
  check?(font: string): boolean;
  load?(font: string): Promise<unknown[]>;
  values?(): IterableIterator<FontFace>;
}

const installedSourceKeys = new Set<string>();
const supportedWeights = new Set(["400", "700"]);
const sampleText = "Sphinx of black quartz, judge my vow 1234567890";

function getFontFaceSet(): FontFaceSetLike | undefined {
  const globalFonts = (globalThis as { fonts?: FontFaceSetLike }).fonts;
  if (globalFonts != null) return globalFonts;
  return typeof document === "undefined" ? undefined : document.fonts;
}

function normalizeFamily(value: string): string {
  return value.replaceAll(/['"]/g, "").trim().toLowerCase();
}

function normalizeWeight(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === "normal" ? "400" : normalized === "bold" ? "700" : normalized;
}

function sourceKey(source: FontFaceSource): string {
  return [normalizeFamily(source.family), source.style.trim().toLowerCase(), normalizeWeight(source.weight), source.src, source.format, source.unicodeRange ?? ""].join("|");
}

function parseFontFaceSources(cssSource: string, baseUrl: string): FontFaceSource[] {
  const sources: FontFaceSource[] = [];
  for (const match of cssSource.matchAll(/url\((["']?)([^"')]+)\1\)\s*(?:format\((["']?)([^"')]+)\3\))?/g)) {
    const source = match[2]?.trim();
    if (source == null || source.length === 0) continue;
    sources.push({ family: "Carlito", style: "normal", weight: "400", src: new URL(source, baseUrl).toString(), format: (match[4]?.trim() || "woff2").toLowerCase() });
  }
  return sources;
}

export function getCarlitoFontFaceSourcesFromDocument(): FontFaceSource[] {
  if (typeof document === "undefined") return [];
  const sources: FontFaceSource[] = [];
  const seen = new Set<string>();
  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = styleSheet.cssRules; } catch { continue; }
    const baseUrl = styleSheet.href || document.baseURI;
    for (const rule of Array.from(rules)) {
      if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
      const fontRule = rule as CSSFontFaceRule;
      if (normalizeFamily(fontRule.style.getPropertyValue("font-family")) !== "carlito") continue;
      const weight = fontRule.style.getPropertyValue("font-weight").trim() || "400";
      if (!supportedWeights.has(weight)) continue;
      const candidates = parseFontFaceSources(fontRule.style.getPropertyValue("src"), baseUrl);
      const preferred = candidates.find(({ format }) => format === "woff2") ?? candidates[0];
      if (preferred == null) continue;
      const source = { ...preferred, style: fontRule.style.getPropertyValue("font-style").trim() || "normal", weight, unicodeRange: fontRule.style.getPropertyValue("unicode-range").trim() || undefined };
      const key = sourceKey(source);
      if (!seen.has(key)) { seen.add(key); sources.push(source); }
    }
  }
  return sources.sort((left, right) => Number(left.weight) - Number(right.weight));
}

function hasFontFace(fonts: FontFaceSetLike, source: FontFaceSource): boolean {
  const key = sourceKey(source);
  if (installedSourceKeys.has(key)) return true;
  if (typeof fonts.values !== "function") return false;
  for (const face of Array.from(fonts.values())) {
    if (normalizeFamily(face.family) === normalizeFamily(source.family) && normalizeWeight(String(face.weight || "400")) === normalizeWeight(source.weight) && (face.style || "normal").trim().toLowerCase() === source.style.trim().toLowerCase()) {
      installedSourceKeys.add(key);
      return true;
    }
  }
  return false;
}

export async function installFontFaces(sources: readonly FontFaceSource[], onInstalled: () => void): Promise<void> {
  const fonts = getFontFaceSet();
  if (fonts != null && typeof FontFace !== "undefined" && typeof fonts.add === "function") {
    await Promise.all(sources.map(async (source) => {
      if (hasFontFace(fonts, source)) return;
      const face = new FontFace(source.family, `url("${source.src}") format("${source.format}")`, { style: source.style, weight: source.weight, display: "swap", unicodeRange: source.unicodeRange });
      await face.load(); fonts.add?.(face); installedSourceKeys.add(sourceKey(source));
    })).catch(() => {});
    if (typeof fonts.load === "function") await Promise.all(sources.map((source) => fonts.load?.(`${source.weight} 16px ${source.family}`))).catch(() => {});
  }
  onInstalled();
}

function measurementContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(1, 1).getContext("2d");
  return typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
}

function measure(font: string): number | null {
  const context = measurementContext();
  if (context == null) return null;
  context.font = font;
  return Number(context.measureText(sampleText).width.toFixed(3));
}

export function getFontDebugState(): Record<string, unknown> {
  const fonts = getFontFaceSet();
  return {
    hasFontFaceCtor: typeof FontFace !== "undefined", hasFontFaceSet: fonts != null,
    check400: fonts?.check?.("400 16px Carlito") ?? null, check700: fonts?.check?.("700 16px Carlito") ?? null,
    sampleWidths: { carlito400: measure("400 16px Carlito"), carlito700: measure("700 16px Carlito"), calibri400: measure("400 16px Calibri"), arial400: measure("400 16px Arial") },
  };
}
