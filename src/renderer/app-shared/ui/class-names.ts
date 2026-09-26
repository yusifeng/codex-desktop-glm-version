/** Object form accepted by the app-shared class-name combiner. */
export type ClassDictionary = Record<string, unknown>;

/** Recursive array form accepted by the app-shared class-name combiner. */
export interface ClassArray extends Array<ClassValue> {}

/** Values supported by the original app-shared `m4` export. */
export type ClassValue =
  | ClassArray
  | ClassDictionary
  | bigint
  | boolean
  | null
  | number
  | string
  | undefined;

function normalizeClassValue(value: ClassValue): string {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value !== "object" || value == null) return "";

  if (Array.isArray(value)) {
    let result = "";
    for (const item of value) {
      if (!item) continue;
      const normalized = normalizeClassValue(item);
      if (!normalized) continue;
      if (result) result += " ";
      result += normalized;
    }
    return result;
  }

  let result = "";
  for (const name in value) {
    if (!value[name]) continue;
    if (result) result += " ";
    result += name;
  }
  return result;
}

/**
 * Joins conditional class names.
 *
 * This is the semantic source for app-shared's compressed `m4` export (the
 * bundled `J` helper), including its recursive array and object-map behavior.
 */
export function classNames(...values: ClassValue[]): string {
  let result = "";
  for (const value of values) {
    if (!value) continue;
    const normalized = normalizeClassValue(value);
    if (!normalized) continue;
    if (result) result += " ";
    result += normalized;
  }
  return result;
}
