export interface AnnotationPoint {
  x: number;
  y: number;
}

/** Resolve the explicit edit anchor or the top-center point of its rectangle. */
export function getAnnotationAnchorPoint(value: {
  askForEditAnchor?: { point: AnnotationPoint } | null;
  rect: { x: number; y: number; width: number };
}): AnnotationPoint {
  return value.askForEditAnchor?.point ?? {
    x: value.rect.x + value.rect.width / 2,
    y: value.rect.y,
  };
}
