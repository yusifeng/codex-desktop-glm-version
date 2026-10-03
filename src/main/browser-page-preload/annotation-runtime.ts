const unsafeText = /^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u;
const metadataKey = /^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)*$/;

function cloneRecord(value: unknown, maxKeys: number): Record<string, unknown> | null {
  if (typeof value !== `object` || !value) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype != null) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).length > maxKeys || Reflect.ownKeys(descriptors).some((key) => typeof key !== `string`)) return null;
  const result = Object.create(null) as Record<string, unknown>;
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, `value`) || [`__proto__`, `constructor`, `prototype`].includes(key)) return null;
    result[key] = descriptor.value;
  }
  return result;
}

function sanitizeAnnotationHit(value: unknown, limits: { maxIdLength: number; maxRoleLength: number; rolePattern: string; metadataLimits: { maxKeys: number; maxKeyLength: number; maxStringValueLength: number; maxSerializedBytes: number } }): Record<string, unknown> | null | undefined {
  if (value === null) return null;
  try {
    const raw = cloneRecord(value, 5);
    if (raw == null || typeof raw.id !== `string` || raw.id.length === 0 || raw.id.length > limits.maxIdLength || !unsafeText.test(raw.id)) return undefined;
    const result: Record<string, unknown> = { id: raw.id };
    if (typeof raw.name === `string` && raw.name.trim().length > 0 && raw.name.length <= 128 && unsafeText.test(raw.name)) result.name = raw.name;
    if (typeof raw.role === `string` && raw.role.length <= limits.maxRoleLength && new RegExp(limits.rolePattern).test(raw.role)) result.role = raw.role;
    if (raw.rect !== undefined) {
      const rect = cloneRecord(raw.rect, 4);
      if (rect == null || typeof rect.x !== `number` || !Number.isFinite(rect.x) || typeof rect.y !== `number` || !Number.isFinite(rect.y) || typeof rect.width !== `number` || !Number.isFinite(rect.width) || rect.width <= 0 || typeof rect.height !== `number` || !Number.isFinite(rect.height) || rect.height <= 0) return undefined;
      result.rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }
    const metadata = cloneRecord(raw.metadata, limits.metadataLimits.maxKeys);
    if (metadata != null && Object.entries(metadata).every(([key, item]) => key.length <= limits.metadataLimits.maxKeyLength && metadataKey.test(key) && (item === null || typeof item === `boolean` || (typeof item === `number` && Number.isFinite(item)) || (typeof item === `string` && item.length <= limits.metadataLimits.maxStringValueLength && unsafeText.test(item))))) {
      const serialized = JSON.stringify(metadata);
      if (new TextEncoder().encode(serialized).byteLength <= limits.metadataLimits.maxSerializedBytes) result.metadata = JSON.parse(serialized);
    }
    return result;
  } catch {
    return undefined;
  }
}

function createAnnotationResponseDetail(input: { type: string; registrationId: string; customRendering: boolean; requestId?: string; hit?: Record<string, unknown> | null }): Record<string, unknown> {
  return {
    type: input.type,
    registrationId: input.registrationId,
    customRendering: input.customRendering,
    requestId: input.requestId,
    hit: input.hit,
  };
}

function isValidAnnotationHitTestRequest(value: unknown, maxRequestIdLength: number): value is { type: `hit-test`; requestId: string; x: number; y: number } {
  if (typeof value !== `object` || !value) return false;
  const request = value as Record<string, unknown>;
  return request.type === `hit-test` && typeof request.requestId === `string` && request.requestId.length > 0 && request.requestId.length <= maxRequestIdLength && typeof request.x === `number` && Number.isFinite(request.x) && typeof request.y === `number` && Number.isFinite(request.y);
}

function serializeAnnotationControls(value: unknown, maxBytes: number): string {
  if (typeof value !== `object` || !value) throw new TypeError(`Invalid annotation controls`);
  const serialized = JSON.stringify({
    controls: (value as Record<string, unknown>).controls,
    controlsHeading: (value as Record<string, unknown>).controlsHeading,
    controlsMode: (value as Record<string, unknown>).controlsMode,
  }, (_key, item) => {
    if (typeof item === `function` || typeof item === `symbol` || typeof item === `bigint`) throw new TypeError(`Annotation controls must contain only data`);
    return item;
  });
  if (new TextEncoder().encode(serialized).byteLength > maxBytes) throw new RangeError(`Annotation controls exceed the maximum size`);
  return serialized;
}

function sanitizeAnnotationControlMetadata(value: unknown, limits: { maxKeys: number; maxKeyLength: number; maxStringValueLength: number }): Record<string, unknown> | undefined {
  if (typeof value !== `object` || !value) return undefined;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype != null) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.length > limits.maxKeys) return undefined;
    const entries: [string, unknown][] = [];
    for (const key of keys) {
      if (typeof key !== `string` || key.length > limits.maxKeyLength) return undefined;
      const descriptor = descriptors[key];
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, `value`)) return undefined;
      const item = descriptor.value;
      if (item === undefined || (item != null && typeof item !== `string` && typeof item !== `boolean` && (typeof item !== `number` || !Number.isFinite(item))) || (typeof item === `string` && item.length > limits.maxStringValueLength)) return undefined;
      entries.push([key, item]);
    }
    return entries.length === 0 ? undefined : Object.fromEntries(entries);
  } catch {
    return undefined;
  }
}

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

function createAnnotationRangeDetail(input: { startPath: number[]; endPath: number[]; startOffset: number; endOffset: number; rangeText: string }): Record<string, unknown> {
  return {
    startPath: input.startPath,
    endPath: input.endPath,
    startOffset: input.startOffset,
    endOffset: input.endOffset,
    rangeText: input.rangeText,
  };
}

function createAnnotationOpenRequestDetail(input: { mode: string; enterAnnotationMode: boolean; metadata?: Record<string, unknown>; initialComment?: string; range?: Record<string, unknown> }): Record<string, unknown> {
  return {
    mode: input.mode,
    enterAnnotationMode: input.enterAnnotationMode,
    metadata: input.metadata,
    initialComment: input.initialComment,
    range: input.range,
  };
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

function readAnnotationEventDetail(event: unknown): Record<string, unknown> | undefined {
  if (typeof CustomEvent !== `undefined` && !(event instanceof CustomEvent)) return undefined;
  const detail = (event as { detail?: unknown } | null)?.detail;
  return typeof detail === `object` && detail !== null ? detail as Record<string, unknown> : undefined;
}

function readAnnotationEventField(detail: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(detail, key);
  return descriptor != null && `value` in descriptor ? descriptor.value : undefined;
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

function shouldDisposeAnnotationRegistryOnPagehide(event: { isTrusted?: boolean; persisted?: boolean }): boolean {
  return event.isTrusted === true && event.persisted !== true;
}

/** Accepts only connected elements owned by the top document, excluding iframes. */
function isValidAnnotationSurfaceElement(value: unknown, documentRef: object, htmlElementConstructor: { new (...args: any[]): any }, iframeConstructor: { new (...args: any[]): any }): boolean {
  return value instanceof htmlElementConstructor &&
    !(value instanceof iframeConstructor) &&
    (value as { isConnected?: boolean }).isConnected === true &&
    (value as { ownerDocument?: object }).ownerDocument === documentRef &&
    typeof (value as { getRootNode?: () => unknown }).getRootNode === `function` &&
    (value as { getRootNode: () => unknown }).getRootNode() === documentRef;
}

export { attachAnnotationControlTargets, cloneRecord, collectAnnotationControlTargets, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, detachAnnotationControlTargets, getAnnotationControlsForTarget, isValidAnnotationHitTestRequest, isValidAnnotationSurfaceElement, normalizeAnnotationControlTargets, parseAnnotationControlTargetList, parseAnnotationControlsPayload, readAnnotationEventDetail, readAnnotationEventField, sanitizeAnnotationHit, sanitizeAnnotationControlMetadata, serializeAnnotationControls, shouldDisposeAnnotationRegistryOnPagehide };
if (typeof module !== `undefined`) module.exports = { attachAnnotationControlTargets, cloneRecord, collectAnnotationControlTargets, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, detachAnnotationControlTargets, getAnnotationControlsForTarget, isValidAnnotationHitTestRequest, isValidAnnotationSurfaceElement, normalizeAnnotationControlTargets, parseAnnotationControlTargetList, parseAnnotationControlsPayload, readAnnotationEventDetail, readAnnotationEventField, sanitizeAnnotationHit, sanitizeAnnotationControlMetadata, serializeAnnotationControls, shouldDisposeAnnotationRegistryOnPagehide };
