import { isSafeAnnotationText } from "./annotation-safe-text-policy";

function isSafeAnnotationMetadataValue(value: unknown, maxStringLength: number): boolean {
  return value === null || typeof value === `boolean` || (typeof value === `number` && Number.isFinite(value)) || (typeof value === `string` && value.length <= maxStringLength && isSafeAnnotationText(value));
}

export { isSafeAnnotationMetadataValue };
if (typeof module !== `undefined`) module.exports = { isSafeAnnotationMetadataValue };
