import { isSafeAnnotationText } from "./annotation-safe-text-policy";

function isSafeAnnotationName(value: unknown, maxLength: number): value is string {
  return typeof value === `string` && value.trim().length > 0 && value.length <= maxLength && isSafeAnnotationText(value);
}

export { isSafeAnnotationName };
if (typeof module !== `undefined`) module.exports = { isSafeAnnotationName };
