/** Return the first non-null handler result for a value. */
export function findFirstHandlerResult<T, R>(handlers: Map<string, Array<(value: T) => R | null | undefined>>, key: string, value: T): R | null {
  for (const handler of handlers.get(key) ?? []) {
    const result = handler(value);
    if (result != null) return result;
  }
  return null;
}
