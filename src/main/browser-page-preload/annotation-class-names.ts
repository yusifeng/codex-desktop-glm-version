/** Values accepted by the annotation overlay's conditional class-name helper. */
export type AnnotationClassValue =
  | AnnotationClassValue[]
  | Record<string, unknown>
  | bigint
  | boolean
  | null
  | number
  | string
  | symbol
  | undefined
  | ((...args: unknown[]) => unknown);

function normalizeAnnotationClassValue(value: AnnotationClassValue): string {
  if (typeof value === `string` || typeof value === `number`) return String(value);
  if (typeof value !== `object` || value == null) return ``;

  if (Array.isArray(value)) {
    let result = ``;
    for (const item of value) {
      if (!item) continue;
      const normalized = normalizeAnnotationClassValue(item);
      if (!normalized) continue;
      if (result) result += ` `;
      result += normalized;
    }
    return result;
  }

  let result = ``;
  for (const name in value) {
    if (!value[name]) continue;
    if (result) result += ` `;
    result += name;
  }
  return result;
}

/**
 * Joins annotation overlay class names while preserving the original bundled
 * helper's recursive array, object-map, and falsey-value behavior.
 */
export function annotationClassNames(...values: AnnotationClassValue[]): string {
  let result = ``;
  for (const value of values) {
    if (!value) continue;
    const normalized = normalizeAnnotationClassValue(value);
    if (!normalized) continue;
    if (result) result += ` `;
    result += normalized;
  }
  return result;
}

if (typeof module !== `undefined`) module.exports = { annotationClassNames };
