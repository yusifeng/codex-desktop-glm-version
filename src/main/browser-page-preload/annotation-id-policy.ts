import { isSafeAnnotationText } from "./annotation-safe-text-policy";

function isSafeAnnotationId(value: unknown, maxLength: number): value is string {
  return typeof value === `string` && value.length > 0 && value.length <= maxLength && isSafeAnnotationText(value);
}

export { isSafeAnnotationId };
if (typeof module !== `undefined`) module.exports = { isSafeAnnotationId };
