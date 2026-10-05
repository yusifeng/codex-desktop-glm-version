/** Serialize query-like values with deterministic key ordering for cache hashes. */
export function stableJsonStringify(value: unknown, isSortableObject: (value: unknown) => value is Record<string, unknown> = (candidate): candidate is Record<string, unknown> => candidate != null && typeof candidate === "object" && !Array.isArray(candidate)): string {
  return JSON.stringify(value, (_key, nested) => {
    if (!isSortableObject(nested)) return nested;
    return Object.keys(nested).sort().reduce<Record<string, unknown>>((result, key) => { result[key] = nested[key]; return result; }, {});
  });
}
