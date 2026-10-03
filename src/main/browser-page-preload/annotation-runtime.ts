const unsafeText = /^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u;
const metadataKey = /^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)*$/;

function cloneRecord(value: unknown, maxKeys: number): Record<string, unknown> | null {
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

function sanitizeAnnotationHit(value: unknown, limits: { maxIdLength: number; maxRoleLength: number; rolePattern: string; metadataLimits: { maxKeys: number; maxKeyLength: number; maxStringValueLength: number; maxSerializedBytes: number } }): Record<string, unknown> | null | undefined {
  if (value === null) return null;
  try {
    const raw = cloneRecord(value, 5);
    if (raw == null || typeof raw.id !== `string` || raw.id.length === 0 || raw.id.length > limits.maxIdLength || !unsafeText.test(raw.id)) return undefined;
    const result: Record<string, unknown> = { id: raw.id };
    if (typeof raw.name === `string` && raw.name.trim().length > 0 && raw.name.length <= 128 && unsafeText.test(raw.name)) result.name = raw.name;
    if (typeof raw.role === `string` && raw.role.length <= limits.maxRoleLength && new RegExp(limits.rolePattern).test(raw.role)) result.role = raw.role;
    if (raw.rect !== undefined) {
      const rect = cloneRecord(raw.rect, 4);
      if (rect == null || typeof rect.x !== `number` || !Number.isFinite(rect.x) || typeof rect.y !== `number` || !Number.isFinite(rect.y) || typeof rect.width !== `number` || !Number.isFinite(rect.width) || rect.width <= 0 || typeof rect.height !== `number` || !Number.isFinite(rect.height) || rect.height <= 0) return undefined;
      result.rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }
    const metadata = cloneRecord(raw.metadata, limits.metadataLimits.maxKeys);
    if (metadata != null && Object.entries(metadata).every(([key, item]) => key.length <= limits.metadataLimits.maxKeyLength && metadataKey.test(key) && (item === null || typeof item === `boolean` || (typeof item === `number` && Number.isFinite(item)) || (typeof item === `string` && item.length <= limits.metadataLimits.maxStringValueLength && unsafeText.test(item))))) {
      const serialized = JSON.stringify(metadata);
      if (new TextEncoder().encode(serialized).byteLength <= limits.metadataLimits.maxSerializedBytes) result.metadata = JSON.parse(serialized);
    }
    return result;
  } catch {
    return undefined;
  }
}

export { cloneRecord, sanitizeAnnotationHit };
if (typeof module !== `undefined`) module.exports = { cloneRecord, sanitizeAnnotationHit };
