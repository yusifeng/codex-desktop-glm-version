/** Encode SVG markup as the release-compatible UTF-8 data URL. */
export function encodeSvgDataUrl(markup: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;
}
