function projectAnnotationElementMetadata(element: { tagName: string }, deps: { getRect: (value: any) => any; getComputedStyle: (value: any) => any; normalizeColor: (value: string) => string; collectStyles: (style: any, properties: string[]) => any[]; flexProperties: string[]; baseProperties: string[] }): any {
  const rect = deps.getRect(element); if (rect == null) return null; const style = deps.getComputedStyle(element); const styles = deps.collectStyles(style, style.display === `flex` || style.display === `inline-flex` ? [...deps.baseProperties, ...deps.flexProperties] : deps.baseProperties); const borderRadius = style.borderRadius.length === 0 ? `0px` : style.borderRadius;
  return { borderRadius, color: deps.normalizeColor(style.color), font: `${style.fontSize} ${style.fontFamily}`.trim(), styles, rect, size: `${Math.round(rect.width)}x${Math.round(rect.height)}`, tagName: element.tagName.toLowerCase() };
}
export { projectAnnotationElementMetadata };
if (typeof module !== `undefined`) module.exports = { projectAnnotationElementMetadata };
