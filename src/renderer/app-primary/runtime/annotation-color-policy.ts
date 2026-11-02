interface RgbaColor { r: number; g: number; b: number; a: number }

const MUTED_ALPHA = 0.18;
const FALLBACK_RED = 51;
const FALLBACK_GREEN = 156;
const FALLBACK_BLUE = 255;
const ACCENT_FALLBACK = `rgb(${FALLBACK_RED}, ${FALLBACK_GREEN}, ${FALLBACK_BLUE})`;
const MUTED_FALLBACK = `rgba(${FALLBACK_RED}, ${FALLBACK_GREEN}, ${FALLBACK_BLUE}, ${MUTED_ALPHA})`;

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

function parseHexColor(value: string): RgbaColor | null {
  if (!/^#[0-9a-f]+$/iu.test(value)) return null;
  if (value.length === 4 || value.length === 5) {
    const [red, green, blue] = [value[1], value[2], value[3]];
    if (red == null || green == null || blue == null) return null;
    return {
      r: Number.parseInt(red + red, 16),
      g: Number.parseInt(green + green, 16),
      b: Number.parseInt(blue + blue, 16),
      a: value.length === 5 ? Number.parseInt(`${value[4]}${value[4]}`, 16) / 255 : 1,
    };
  }
  if (value.length !== 7 && value.length !== 9) return null;
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
    a: value.length === 9 ? Number.parseInt(value.slice(7, 9), 16) / 255 : 1,
  };
}

function parseCssColor(value: string): RgbaColor | null {
  const normalized = value.trim();
  if (normalized.toLowerCase() === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (normalized.toLowerCase() === "black") return { r: 0, g: 0, b: 0, a: 1 };
  if (normalized.toLowerCase() === "white") return { r: 255, g: 255, b: 255, a: 1 };
  if (normalized.startsWith("#")) return parseHexColor(normalized);
  const match = /^rgba?\(\s*([+-]?[\d.]+%?)(?:\s*,\s*|\s+)([+-]?[\d.]+%?)(?:\s*,\s*|\s+)([+-]?[\d.]+%?)(?:\s*(?:,|\/)\s*([+-]?[\d.]+%?))?\s*\)$/iu.exec(normalized);
  if (match == null || match[1] == null || match[2] == null || match[3] == null) return null;
  const channel = (part: string) => part.endsWith("%") ? Number(part.slice(0, -1)) / 100 * 255 : Number(part);
  const alpha = match[4]?.endsWith("%") ? Number(match[4].slice(0, -1)) / 100 : match[4] == null ? 1 : Number(match[4]);
  const values = [channel(match[1]), channel(match[2]), channel(match[3]), alpha];
  if (!values.every(Number.isFinite)) return null;
  return { r: clamp(values[0], 0, 255), g: clamp(values[1], 0, 255), b: clamp(values[2], 0, 255), a: clamp(alpha, 0, 1) };
}

/** Resolve the annotation accent from CSS variables with the release blue fallback. */
export function getAnnotationAccentColor(element: Element | null | undefined): string {
  const view = element?.ownerDocument.defaultView;
  if (element == null || view == null) return ACCENT_FALLBACK;
  const style = view.getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim() || null;
  return read("--color-text-accent") ?? read("--color-accent-blue") ?? ACCENT_FALLBACK;
}

/** Normalize parseable CSS colors to the release rgb token. */
export function formatAnnotationRgbColor(value: string): string {
  const color = parseCssColor(value);
  return color == null ? value : `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/** Normalize parseable CSS colors to the release muted rgba token. */
export function formatAnnotationMutedColor(value: string): string {
  const color = parseCssColor(value);
  return color == null ? MUTED_FALLBACK : `rgba(${color.r}, ${color.g}, ${color.b}, ${MUTED_ALPHA})`;
}

