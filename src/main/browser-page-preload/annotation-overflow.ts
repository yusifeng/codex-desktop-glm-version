function isScrollableAnnotationOverflow(value: string): boolean {
  return value === `auto` || value === `scroll` || value === `overlay`;
}

function isClippingAnnotationOverflow(value: string): boolean {
  return isScrollableAnnotationOverflow(value) || value === `clip` || value === `hidden`;
}

export { isClippingAnnotationOverflow, isScrollableAnnotationOverflow };
if (typeof module !== `undefined`)
  module.exports = { isClippingAnnotationOverflow, isScrollableAnnotationOverflow };
