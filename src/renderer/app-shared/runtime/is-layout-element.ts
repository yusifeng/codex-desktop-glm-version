/** Check whether a value is an element-like layout node with offsetHeight. */
export function isLayoutElement(value: unknown): value is { offsetHeight: number } {
  return value != null && typeof value === "object" && "offsetHeight" in value && !("ownerSVGElement" in value);
}
