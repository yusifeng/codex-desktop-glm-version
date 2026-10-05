/** Clones a plain own-data record while rejecting prototype/key abuse. */
function cloneAnnotationRecord(value: unknown, maxKeys: number): Record<string, unknown> | null {
  if (typeof value !== `object` || !value) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype != null) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).length > maxKeys || Reflect.ownKeys(descriptors).some((key) => typeof key !== `string`)) return null;
  const result = Object.create(null) as Record<string, unknown>;
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, `value`) || [`__proto__`, `constructor`, `prototype`].includes(key)) return null;
    result[key] = descriptor.value;
  }
  return result;
}
export { cloneAnnotationRecord };
if (typeof module !== `undefined`) module.exports = { cloneAnnotationRecord };
