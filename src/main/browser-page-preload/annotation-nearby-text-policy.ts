function projectAnnotationNearbyText(element: any, readLabel: (value: any) => string | null, findContext: (value: any) => any, isElement: (value: any) => boolean): string | null { const direct = readLabel(element); if (direct) return direct; const context = findContext(element); return isElement(context) ? readLabel(context) : null; }
export { projectAnnotationNearbyText };
if (typeof module !== `undefined`) module.exports = { projectAnnotationNearbyText };
