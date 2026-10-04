/** Parses the indexed DOM target descriptors accepted by annotation controls. */
export function parseAnnotationControlTargetList(
  value: unknown,
  documentRef: object,
  elementConstructor: { new (...args: any[]): any },
  isForbidden: (element: any) => boolean,
  maxTargets: number,
): Set<any> | undefined {
  if (!Array.isArray(value) || !Number.isSafeInteger(value.length) || value.length < 0 || value.length > maxTargets) return undefined;
  const targets = new Set<any>();
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    const target = descriptor != null && `value` in descriptor ? descriptor.value : undefined;
    if (!(target instanceof elementConstructor) || target.ownerDocument !== documentRef || isForbidden(target)) return undefined;
    targets.add(target);
  }
  return targets;
}

if (typeof module !== `undefined`) module.exports = { parseAnnotationControlTargetList };
