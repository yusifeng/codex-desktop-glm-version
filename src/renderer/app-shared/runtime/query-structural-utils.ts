export type QueryKey = readonly unknown[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const candidate = value as { constructor?: { prototype?: unknown } };
  const constructor = candidate.constructor;
  if (constructor === undefined) return true;
  const prototype = constructor.prototype;
  return !(
    typeof prototype !== "object" ||
    prototype == null ||
    !Object.prototype.hasOwnProperty.call(prototype, "isPrototypeOf") ||
    Object.getPrototypeOf(value) !== Object.prototype
  );
}

function isPlainArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length === Object.keys(value).length;
}

/**
 * Produces the stable JSON hash used by the query cache.
 *
 * Object keys are sorted recursively while array order remains significant.
 * This is the semantic source for app-shared's compressed `AZ` export.
 */
export function hashQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey, (_key, value: unknown) => {
    if (!isPlainObject(value)) return value;
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = value[key];
        return sorted;
      }, {});
  });
}

function replaceEqualDeepValue(
  previous: unknown,
  next: unknown,
  depth: number,
): unknown {
  if (previous === next) return previous;
  if (depth > 500) return next;

  const array = isPlainArray(previous) && isPlainArray(next);
  if (!array && !(isPlainObject(previous) && isPlainObject(next))) return next;

  const previousContainer = previous as Record<string, unknown>;
  const nextContainer = next as Record<string, unknown>;
  const previousSize = array
    ? (previous as unknown[]).length
    : Object.keys(previous).length;
  const nextKeys = array
    ? Array.from({ length: (next as unknown[]).length }, (_value, index) =>
        String(index),
      )
    : Object.keys(next);
  const result: Record<string, unknown> | unknown[] = array
    ? Array(nextKeys.length)
    : {};
  let equalItems = 0;

  for (const key of nextKeys) {
    const previousValue = previousContainer[key];
    const nextValue = nextContainer[key];
    if (previousValue === nextValue) {
      result[key] = previousValue;
      if (array || Object.prototype.hasOwnProperty.call(previous, key))
        equalItems += 1;
      continue;
    }
    if (
      previousValue === null ||
      nextValue === null ||
      typeof previousValue !== "object" ||
      typeof nextValue !== "object"
    ) {
      result[key] = nextValue;
      continue;
    }
    const replacement = replaceEqualDeepValue(
      previousValue,
      nextValue,
      depth + 1,
    );
    result[key] = replacement;
    if (replacement === previousValue) equalItems += 1;
  }

  return previousSize === nextKeys.length && equalItems === previousSize
    ? previous
    : result;
}

/**
 * Reuses deeply equal branches from a previous query result.
 *
 * This mirrors TanStack Query's structural-sharing helper and is the semantic
 * source for app-shared's compressed `PZ` export.
 */
export function replaceEqualDeep<T>(previous: unknown, next: T): T {
  return replaceEqualDeepValue(previous, next, 0) as T;
}
