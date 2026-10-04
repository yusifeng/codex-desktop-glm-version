/** Pure predicates used by the main-process worker bus.
 *
 * These correspond to the small helpers adjacent to the worker-bus assembly
 * in main-C-Mhak1n.ts (原 Sst/Cst/wst). Keeping them here makes the event
 * protocol checks independently testable without constructing Electron or a
 * worker host.
 */

export function isWorkerStartResult(value: unknown): boolean {
  return typeof value === `object` && value !== null && `result` in value && value.result === `started`;
}

export function isWorkerEventType(value: { type?: unknown }, type: unknown): boolean {
  return value.type === type;
}

export function isWorkerNotificationType(value: { type?: unknown }, type: unknown): boolean {
  return value.type === type;
}

if (typeof module !== `undefined`) {
  module.exports = { isWorkerStartResult, isWorkerEventType, isWorkerNotificationType };
}
