/** Validates and normalizes DOM targets supplied to annotation controls. */
export function normalizeAnnotationControlTargets(
  value: unknown,
  elementConstructor: { new (...args: any[]): any },
  documentRef: object,
  maxTargets: number,
): unknown[] {
  if (!(value instanceof elementConstructor) && (value == null || typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] !== `function`)) {
    throw new TypeError(`Annotation controls require element targets`);
  }
  const targets = value instanceof elementConstructor ? [value] : value as Iterable<unknown>;
  const result = new Set<unknown>();
  let count = 0;
  for (const target of targets) {
    count += 1;
    if (count > maxTargets) throw new RangeError(`Too many annotation control targets`);
    if (!(target instanceof elementConstructor) || (target as { ownerDocument?: object }).ownerDocument !== documentRef) {
      throw new TypeError(`Annotation control targets must belong to this document`);
    }
    result.add(target);
  }
  return Array.from(result);
}

if (typeof module !== `undefined`) module.exports = { normalizeAnnotationControlTargets };
