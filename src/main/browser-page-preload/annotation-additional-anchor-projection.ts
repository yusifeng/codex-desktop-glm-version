/** Projects secondary annotation anchors with a shared viewport contract. */
export function projectAnnotationAdditionalAnchors(
  selections: unknown,
  viewportSize: unknown,
  project: ((selection: any, viewportSize: any) => unknown) | undefined,
): unknown[] | undefined {
  if (!Array.isArray(selections) || selections.length === 0) return undefined;
  return selections.map((selection) => project?.(selection, viewportSize) ?? selection);
}

if (typeof module !== `undefined`) module.exports = { projectAnnotationAdditionalAnchors };
