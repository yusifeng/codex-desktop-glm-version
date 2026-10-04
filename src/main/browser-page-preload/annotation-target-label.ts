type LabelElement = { tagName: string };
type LabelDependencies = { readAccessibleLabel: (element: LabelElement) => string | null };

function getAnnotationTargetLabel(element: LabelElement, dependencies: LabelDependencies): string {
  const tagName = element.tagName.toLowerCase();
  const label = dependencies.readAccessibleLabel(element);
  return label == null ? tagName : `${tagName}: ${label}`;
}

export { getAnnotationTargetLabel };
if (typeof module !== `undefined`) module.exports = { getAnnotationTargetLabel };
