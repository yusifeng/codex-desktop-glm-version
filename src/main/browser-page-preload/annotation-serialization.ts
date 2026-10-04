type AnnotationSerializationDependencies = {
  getLimits: () => { maxSerializedBytes: number; maxKeys: number; maxKeyLength: number; maxStringValueLength: number };
  parseName: (value: unknown) => { success: boolean; data?: string };
  parseKey: (value: unknown) => { success: boolean };
  parseValue: (value: unknown) => { success: boolean };
  parseMetadata: (value: unknown) => { success: boolean; data?: Record<string, unknown> };
  parseString: (value: unknown) => { success: boolean; data?: string };
};

function createAnnotationSerialization(deps: AnnotationSerializationDependencies) {
  const byteLength = (value: string) => new TextEncoder().encode(value).byteLength;
  const withinLimit = (value: string) => value.length <= deps.getLimits().maxSerializedBytes && byteLength(value) <= deps.getLimits().maxSerializedBytes;
  const normalizeName = (value: unknown) => {
    const parsed = deps.parseName(value);
    return parsed.success ? parsed.data : undefined;
  };
  const sanitizeMetadata = (value: unknown) => {
    const limits = deps.getLimits();
    if (typeof value !== `object` || value == null) return undefined;
    try {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype != null) return undefined;
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Reflect.ownKeys(descriptors);
      if (keys.length > limits.maxKeys || keys.some((key) => !deps.parseKey(key).success)) return undefined;
      if (Object.values(descriptors).some((descriptor) => !descriptor.enumerable || !Object.hasOwn(descriptor, `value`))) return undefined;
      const candidate = Object.fromEntries(Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value]));
      const parsed = deps.parseMetadata(candidate);
      return parsed.success && withinLimit(JSON.stringify(parsed.data)) ? parsed.data : undefined;
    } catch { return undefined; }
  };
  const parseMetadata = (value: unknown) => {
    if (typeof value !== `string` || !withinLimit(value)) return undefined;
    try { return sanitizeMetadata(JSON.parse(value)); } catch { return undefined; }
  };
  return { normalizeName, sanitizeMetadata, parseMetadata, withinLimit };
}

export { createAnnotationSerialization };
if (typeof module !== `undefined`) module.exports = { createAnnotationSerialization };
