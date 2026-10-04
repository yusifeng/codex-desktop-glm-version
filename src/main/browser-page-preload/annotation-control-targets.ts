/** Target indexing and weak-reference lifecycle for annotation controls. */

export function attachAnnotationControlTargets(
  record: { targets: WeakRef<object>[] },
  targets: Set<object>,
  targetIndex: WeakMap<object, Array<{ order: number; targets: WeakRef<object>[] }>>,
  order: number,
): number {
  record.targets = Array.from(targets, (target) => new WeakRef(target));
  for (const target of targets) {
    const records = targetIndex.get(target);
    if (records == null) targetIndex.set(target, [record as { order: number; targets: WeakRef<object>[] }]);
    else {
      records.push(record as { order: number; targets: WeakRef<object>[] });
      records.sort((left, right) => left.order - right.order);
    }
  }
  return targets.size;
}

export function detachAnnotationControlTargets(
  record: { targets: WeakRef<object>[] },
  targetIndex: WeakMap<object, Array<{ order: number; targets: WeakRef<object>[] }>>,
): number {
  let removed = record.targets.length;
  for (const reference of record.targets) {
    const target = reference.deref();
    if (target == null) continue;
    const records = targetIndex.get(target);
    if (records == null) continue;
    const index = records.indexOf(record as { order: number; targets: WeakRef<object>[] });
    if (index !== -1) records.splice(index, 1);
    if (records.length === 0) targetIndex.delete(target);
  }
  return removed;
}

export function collectAnnotationControlTargets(
  records: Iterable<{ targets: WeakRef<object>[] }>,
  isValidTarget: (target: object) => boolean,
): object[] {
  const targets = new Set<object>();
  for (const record of records) for (const reference of record.targets) {
    const target = reference.deref();
    if (target != null && isValidTarget(target)) targets.add(target);
  }
  return [...targets];
}

export function getAnnotationControlsForTarget<T extends object, C>(
  target: T,
  documentRef: object,
  targetIndex: WeakMap<T, Array<{ controls: C }>>,
): C | undefined {
  if ((target as { ownerDocument?: object }).ownerDocument !== documentRef) return undefined;
  return targetIndex.get(target)?.at(-1)?.controls;
}

if (typeof module !== `undefined`) module.exports = {
  attachAnnotationControlTargets,
  detachAnnotationControlTargets,
  collectAnnotationControlTargets,
  getAnnotationControlsForTarget,
};
