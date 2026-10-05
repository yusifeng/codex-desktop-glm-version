import { projectAnnotationTargetLabel } from "./annotation-target-label-policy";

type LabelElement = { tagName: string };
type LabelDependencies = { readAccessibleLabel: (element: LabelElement) => string | null };

function getAnnotationTargetLabel(element: LabelElement, dependencies: LabelDependencies): string {
  return projectAnnotationTargetLabel(element, dependencies.readAccessibleLabel);
}

export { getAnnotationTargetLabel };
if (typeof module !== `undefined`) module.exports = { getAnnotationTargetLabel };
