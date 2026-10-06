function hasAnnotationInputSelection(element: any, deps: { isTextInput: (value: any) => boolean }): boolean {
  if (element == null || !deps.isTextInput(element)) return false;
  const start = element.selectionStart;
  const end = element.selectionEnd;
  return start != null && end != null && end > start;
}
export { hasAnnotationInputSelection };
if (typeof module !== `undefined`) module.exports = { hasAnnotationInputSelection };
