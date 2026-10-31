/** Serialize query-like values with deterministic key ordering for cache hashes. */
export function stableJsonStringify(value: unknown, isSortableObject: (value: unknown) => value is Record<string, unknown> = (candidate): candidate is Record<string, unknown> => {
  if (candidate == null || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const constructor = candidate.constructor;
  if (constructor === undefined) return true;
  const prototype = constructor.prototype;
  return prototype != null &&
    typeof prototype === "object" &&
    Object.prototype.hasOwnProperty.call(prototype, "isPrototypeOf") &&
    Object.getPrototypeOf(candidate) === Object.prototype;
}): string {
  return JSON.stringify(value, (_key, nested) => {
    if (!isSortableObject(nested)) return nested;
    return Object.keys(nested).sort().reduce<Record<string, unknown>>((result, key) => { result[key] = nested[key]; return result; }, {});
  });
}
