/** Returns whether a scroll delta can advance a scroll container. */
function canScrollAnnotationAxis(delta: number, offset: number, viewport: number, extent: number): boolean {
  return delta < 0 ? offset > 0 : delta > 0 && offset < extent - viewport;
}

export { canScrollAnnotationAxis };
if (typeof module !== `undefined`) module.exports = { canScrollAnnotationAxis };
