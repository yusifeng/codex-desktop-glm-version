const cloneRecord = cloneAnnotationRecord;

function sanitizeAnnotationHit(value: unknown, limits: { maxIdLength: number; maxRoleLength: number; rolePattern: string; metadataLimits: { maxKeys: number; maxKeyLength: number; maxStringValueLength: number; maxSerializedBytes: number } }): Record<string, unknown> | null | undefined {
  if (value === null) return null;
  try {
    const raw = cloneRecord(value, 5);
    if (raw == null || typeof raw.id !== `string` || raw.id.length === 0 || raw.id.length > limits.maxIdLength || !isSafeAnnotationText(raw.id)) return undefined;
    const result: Record<string, unknown> = { id: raw.id };
    if (typeof raw.name === `string` && raw.name.trim().length > 0 && raw.name.length <= 128 && isSafeAnnotationText(raw.name)) result.name = raw.name;
    if (typeof raw.role === `string` && isSafeAnnotationRole(raw.role, limits.maxRoleLength, limits.rolePattern)) result.role = raw.role;
    if (raw.rect !== undefined) {
      const rect = cloneRecord(raw.rect, 4);
      if (!isValidAnnotationRect(rect)) return undefined;
      result.rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }
    const metadata = cloneRecord(raw.metadata, limits.metadataLimits.maxKeys);
    if (metadata != null && Object.entries(metadata).every(([key, item]) => key.length <= limits.metadataLimits.maxKeyLength && isSafeAnnotationMetadataKey(key) && isSafeAnnotationMetadataValue(item, limits.metadataLimits.maxStringValueLength))) {
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
import { serializeAnnotationControlsPayload } from "./annotation-controls-serialization-policy";

const createAnnotationResponseDetail = createAnnotationResponseEnvelope;

const serializeAnnotationControls = serializeAnnotationControlsPayload;

const sanitizeAnnotationControlMetadata = sanitizeControlMetadata;

export { cloneRecord, isValidAnnotationHitTestRequest, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls, createAnnotationResponseDetail };
if (typeof module !== `undefined`) module.exports = { cloneRecord, isValidAnnotationHitTestRequest, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls, createAnnotationResponseDetail };
import { isValidAnnotationHitTestRequest } from "./annotation-hit-test-request-policy";
import { cloneAnnotationRecord } from "./annotation-record-clone-policy";
import { isSafeAnnotationText } from "./annotation-safe-text-policy";
import { isSafeAnnotationMetadataKey } from "./annotation-metadata-key-policy";
import { isSafeAnnotationRole } from "./annotation-role-policy";
import { isValidAnnotationRect } from "./annotation-rect-policy";
import { isSafeAnnotationMetadataValue } from "./annotation-metadata-value-policy";
