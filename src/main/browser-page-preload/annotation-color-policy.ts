type ParsedAnnotationColor = { red: number; green: number; blue: number; alpha: number | null };
function parseRgbAlpha(value: string): number { return value.endsWith(`%`) ? (Number.parseFloat(value) / 100) * 255 : Number.parseFloat(value) * 255; }
function channel(value: number): string { return Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, `0`).toUpperCase(); }
function parseAnnotationColor(value: string): ParsedAnnotationColor | null {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1];
  if (hex != null) { const expanded = hex.length === 3 || hex.length === 4 ? Array.from(hex).map((part) => part + part).join(``) : hex; const values = expanded.match(/.{2}/g)!.map((part) => Number.parseInt(part, 16)); return { red: values[0], green: values[1], blue: values[2], alpha: values[3] ?? null }; }
  const body = value.match(/^rgba?\((.*)\)$/i)?.[1]; if (body == null) return null;
  const [text, alphaText] = body.split(`/`).map((part) => part.trim()); const parts = text.includes(`,`) ? text.split(`,`).map((part) => part.trim()) : text.split(/\s+/); const alpha = alphaText ?? parts[3];
  const [red, green, blue] = [parts[0], parts[1], parts[2]].map((part) => Number.parseFloat(part ?? ``)); if ([red, green, blue].some(Number.isNaN)) return null;
  return { red, green, blue, alpha: alpha == null ? null : parseRgbAlpha(alpha) };
}
function normalizeAnnotationColor(value: string): string { const trimmed = value.trim(); const parsed = parseAnnotationColor(trimmed); if (parsed == null) return trimmed; return `#${channel(parsed.red)}${channel(parsed.green)}${channel(parsed.blue)}${parsed.alpha == null ? `` : channel(parsed.alpha)}`; }
export { normalizeAnnotationColor, parseAnnotationColor };
if (typeof module !== `undefined`) module.exports = { normalizeAnnotationColor, parseAnnotationColor };
