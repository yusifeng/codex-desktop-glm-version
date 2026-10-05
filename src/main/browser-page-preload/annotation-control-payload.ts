const unsafeText = /^[^\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]*$/u;
const metadataKey = /^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)*$/;

const cloneRecord = cloneAnnotationRecord;

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

import { createAnnotationResponseEnvelope } from "./annotation-response-envelope-policy";
import { sanitizeAnnotationControlMetadata as sanitizeControlMetadata } from "./annotation-control-metadata-policy";

const createAnnotationResponseDetail = createAnnotationResponseEnvelope;

function serializeAnnotationControls(value: unknown, maxBytes: number): string {
  if (typeof value !== `object` || !value) throw new TypeError(`Invalid annotation controls`);
  const serialized = JSON.stringify({ controls: (value as Record<string, unknown>).controls, controlsHeading: (value as Record<string, unknown>).controlsHeading, controlsMode: (value as Record<string, unknown>).controlsMode }, (_key, item) => {
    if (typeof item === `function` || typeof item === `symbol` || typeof item === `bigint`) throw new TypeError(`Annotation controls must contain only data`);
    return item;
  });
  if (new TextEncoder().encode(serialized).byteLength > maxBytes) throw new RangeError(`Annotation controls exceed the maximum size`);
  return serialized;
}

const sanitizeAnnotationControlMetadata = sanitizeControlMetadata;

export { cloneRecord, isValidAnnotationHitTestRequest, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls, createAnnotationResponseDetail };
if (typeof module !== `undefined`) module.exports = { cloneRecord, isValidAnnotationHitTestRequest, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls, createAnnotationResponseDetail };
import { isValidAnnotationHitTestRequest } from "./annotation-hit-test-request-policy";
import { cloneAnnotationRecord } from "./annotation-record-clone-policy";
