function getAnnotationInverseViewportScale(value: number | null | undefined): number { return value == null || value <= 0 ? 1 : 1 / value; }
export { getAnnotationInverseViewportScale };
if (typeof module !== `undefined`) module.exports = { getAnnotationInverseViewportScale };
