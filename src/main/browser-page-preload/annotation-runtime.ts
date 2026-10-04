import { cloneRecord, createAnnotationResponseDetail, isValidAnnotationHitTestRequest, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls } from "./annotation-control-payload";
import { createAnnotationOpenRequestDetail, createAnnotationRangeDetail, readAnnotationEventDetail, readAnnotationEventField } from "./annotation-event-details";
import { isValidAnnotationSurfaceElement, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection } from "./annotation-surface-policies";
import { attachAnnotationControlTargets, collectAnnotationControlTargets, detachAnnotationControlTargets, getAnnotationControlsForTarget } from "./annotation-control-targets";
import { normalizeAnnotationControlTargets } from "./annotation-control-target-validation";
import { createAnnotationControlHandle } from "./annotation-control-handle";
import { parseAnnotationControlsPayload } from "./annotation-controls-parser";

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

export { attachAnnotationControlTargets, cloneRecord, collectAnnotationControlTargets, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, detachAnnotationControlTargets, getAnnotationControlsForTarget, isValidAnnotationHitTestRequest, isValidAnnotationSurfaceElement, normalizeAnnotationControlTargets, parseAnnotationControlTargetList, parseAnnotationControlsPayload, readAnnotationEventDetail, readAnnotationEventField, sanitizeAnnotationHit, sanitizeAnnotationControlMetadata, serializeAnnotationControls, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection };
if (typeof module !== `undefined`) module.exports = { attachAnnotationControlTargets, cloneRecord, collectAnnotationControlTargets, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, detachAnnotationControlTargets, getAnnotationControlsForTarget, isValidAnnotationHitTestRequest, isValidAnnotationSurfaceElement, normalizeAnnotationControlTargets, parseAnnotationControlTargetList, parseAnnotationControlsPayload, readAnnotationEventDetail, readAnnotationEventField, sanitizeAnnotationHit, sanitizeAnnotationControlMetadata, serializeAnnotationControls, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection };
