import { cloneRecord, createAnnotationResponseDetail, isValidAnnotationHitTestRequest, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls } from "./annotation-control-payload";
import { createAnnotationOpenRequestDetail, createAnnotationRangeDetail, readAnnotationEventDetail, readAnnotationEventField } from "./annotation-event-details";
import { isValidAnnotationSurfaceElement, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection } from "./annotation-surface-policies";

function normalizeAnnotationControlTargets(value: unknown, elementConstructor: { new (...args: any[]): any }, documentRef: object, maxTargets: number): unknown[] {
  if (!(value instanceof elementConstructor) && (value == null || typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] !== `function`)) throw new TypeError(`Annotation controls require element targets`);
  const targets = value instanceof elementConstructor ? [value] : value as Iterable<unknown>;
  const result = new Set<unknown>();
  let count = 0;
  for (const target of targets) {
    count += 1;
    if (count > maxTargets) throw new RangeError(`Too many annotation control targets`);
    if (!(target instanceof elementConstructor) || (target as { ownerDocument?: object }).ownerDocument !== documentRef) throw new TypeError(`Annotation control targets must belong to this document`);
    result.add(target);
  }
  return Array.from(result);
}

function createAnnotationControlHandle(id: string, serialize: (value: unknown) => string, normalizeTargets: (value: unknown) => unknown[], emit: (type: `update` | `dispose`, detail: Record<string, unknown>) => boolean): Readonly<{ update(value: { targets?: unknown }): void; dispose(): void }> {
  let disposed = false;
  return Object.freeze({
    update(value: { targets?: unknown }) {
      if (disposed) throw new TypeError(`Annotation controls have been disposed`);
      const payload = serialize(value);
      const targets = value.targets === undefined ? undefined : normalizeTargets(value.targets);
      if (!emit(`update`, { id, payload, targets })) throw new TypeError(`Invalid annotation controls update`);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      emit(`dispose`, { id });
    },
  });
}

function parseAnnotationControlsPayload(serialized: unknown, fullParse: (value: unknown) => { success: boolean; data?: unknown }, patchParse: (value: unknown) => { success: boolean; data?: unknown }, current?: Record<string, unknown>, maxLength = 16384): Record<string, unknown> | undefined {
  if (typeof serialized !== `string` || serialized.length > maxLength) return undefined;
  try {
    let value: unknown = JSON.parse(serialized);
    if (current != null) {
      const patch = patchParse(value);
      if (!patch.success) return undefined;
      value = { ...current, ...(patch.data as Record<string, unknown>) };
    }
    const parsed = fullParse(value);
    return parsed.success ? parsed.data as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function parseAnnotationControlTargetList(value: unknown, documentRef: object, elementConstructor: { new (...args: any[]): any }, isForbidden: (element: any) => boolean, maxTargets: number): Set<any> | undefined {
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

function attachAnnotationControlTargets(record: { targets: WeakRef<object>[] }, targets: Set<object>, targetIndex: WeakMap<object, Array<{ order: number; targets: WeakRef<object>[] }>>, order: number): number {
  record.targets = Array.from(targets, (target) => new WeakRef(target));
  for (const target of targets) {
    const records = targetIndex.get(target);
    if (records == null) targetIndex.set(target, [record as { order: number; targets: WeakRef<object>[] }]);
    else { records.push(record as { order: number; targets: WeakRef<object>[] }); records.sort((left, right) => left.order - right.order); }
  }
  return targets.size;
}

function detachAnnotationControlTargets(record: { targets: WeakRef<object>[] }, targetIndex: WeakMap<object, Array<{ order: number; targets: WeakRef<object>[] }>>): number {
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

function collectAnnotationControlTargets(records: Iterable<{ targets: WeakRef<object>[] }>, isValidTarget: (target: object) => boolean): object[] {
  const targets = new Set<object>();
  for (const record of records) for (const reference of record.targets) {
    const target = reference.deref();
    if (target != null && isValidTarget(target)) targets.add(target);
  }
  return [...targets];
}

function getAnnotationControlsForTarget<T extends object, C>(target: T, documentRef: object, targetIndex: WeakMap<T, Array<{ controls: C }>>): C | undefined {
  if ((target as { ownerDocument?: object }).ownerDocument !== documentRef) return undefined;
  return targetIndex.get(target)?.at(-1)?.controls;
}

export { attachAnnotationControlTargets, cloneRecord, collectAnnotationControlTargets, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, detachAnnotationControlTargets, getAnnotationControlsForTarget, isValidAnnotationHitTestRequest, isValidAnnotationSurfaceElement, normalizeAnnotationControlTargets, parseAnnotationControlTargetList, parseAnnotationControlsPayload, readAnnotationEventDetail, readAnnotationEventField, sanitizeAnnotationHit, sanitizeAnnotationControlMetadata, serializeAnnotationControls, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection };
if (typeof module !== `undefined`) module.exports = { attachAnnotationControlTargets, cloneRecord, collectAnnotationControlTargets, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, detachAnnotationControlTargets, getAnnotationControlsForTarget, isValidAnnotationHitTestRequest, isValidAnnotationSurfaceElement, normalizeAnnotationControlTargets, parseAnnotationControlTargetList, parseAnnotationControlsPayload, readAnnotationEventDetail, readAnnotationEventField, sanitizeAnnotationHit, sanitizeAnnotationControlMetadata, serializeAnnotationControls, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection };
