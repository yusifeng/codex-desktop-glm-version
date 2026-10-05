/** Reads an own data-property from untrusted annotation event detail. */
function readAnnotationEventFieldValue(detail: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(detail, key);
  return descriptor != null && `value` in descriptor ? descriptor.value : undefined;
}
export { readAnnotationEventFieldValue };
if (typeof module !== `undefined`) module.exports = { readAnnotationEventFieldValue };
