const DEFAULT_TEXT_INPUT_TYPES = new Set([`email`, `search`, `tel`, `text`, `url`]);
function isAnnotationTextInput(element: any, windowLike: any, textInputTypes = DEFAULT_TEXT_INPUT_TYPES): boolean {
  if (element == null || windowLike == null) return false;
  const inputConstructor = windowLike.HTMLInputElement;
  const textareaConstructor = windowLike.HTMLTextAreaElement;
  return (typeof textareaConstructor === `function` && element instanceof textareaConstructor) ||
    (typeof inputConstructor === `function` && element instanceof inputConstructor && textInputTypes.has(element.type));
}
export { DEFAULT_TEXT_INPUT_TYPES, isAnnotationTextInput };
if (typeof module !== `undefined`) module.exports = { DEFAULT_TEXT_INPUT_TYPES, isAnnotationTextInput };
