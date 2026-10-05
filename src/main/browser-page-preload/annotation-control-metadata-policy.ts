function sanitizeAnnotationControlMetadata(value: unknown, limits: { maxKeys: number; maxKeyLength: number; maxStringValueLength: number }): Record<string, unknown> | undefined {
  if (typeof value !== `object` || !value) return undefined;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype != null) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.length > limits.maxKeys) return undefined;
    const entries: [string, unknown][] = [];
    for (const key of keys) {
      if (typeof key !== `string` || key.length > limits.maxKeyLength) return undefined;
      const descriptor = descriptors[key];
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, `value`)) return undefined;
      const item = descriptor.value;
      if (item === undefined || (item != null && typeof item !== `string` && typeof item !== `boolean` && (typeof item !== `number` || !Number.isFinite(item))) || (typeof item === `string` && item.length > limits.maxStringValueLength)) return undefined;
      entries.push([key, item]);
    }
    return entries.length === 0 ? undefined : Object.fromEntries(entries);
  } catch { return undefined; }
}
export { sanitizeAnnotationControlMetadata };
if (typeof module !== `undefined`) module.exports = { sanitizeAnnotationControlMetadata };
