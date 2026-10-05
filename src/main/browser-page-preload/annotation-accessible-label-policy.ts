function projectAnnotationAccessibleLabel(element: { tagName: string }, readAriaLabel: (value: any) => string | null, readFallbackLabel: (value: any) => string | null): string { return readAriaLabel(element) || readFallbackLabel(element) || element.tagName.toLowerCase(); }
export { projectAnnotationAccessibleLabel };
if (typeof module !== `undefined`) module.exports = { projectAnnotationAccessibleLabel };
