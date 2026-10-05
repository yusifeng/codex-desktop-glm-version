type LabelElement = { tagName: string };
function projectAnnotationTargetLabel(element: LabelElement, readAccessibleLabel: (element: LabelElement) => string | null): string {
  const tagName = element.tagName.toLowerCase();
  const label = readAccessibleLabel(element);
  return label == null ? tagName : `${tagName}: ${label}`;
}
export { projectAnnotationTargetLabel };
if (typeof module !== `undefined`) module.exports = { projectAnnotationTargetLabel };
