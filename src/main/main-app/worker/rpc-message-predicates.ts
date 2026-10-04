type UnknownRecord = Record<string, unknown>;

const MAIN_RPC_METHODS = new Set([
  `ces-telemetry`,
  `otel-export`,
  `computer-use-invalidate-service-pid`,
  `computer-use-service-pid`,
  `read-shortcut-link`,
]);

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === `object` && value !== null;
}

export function isAllowedMainRpcMethod(method: unknown): boolean {
  return typeof method === `string` && MAIN_RPC_METHODS.has(method);
}

export function isWorkerMainRpcCancel(value: unknown): boolean {
  return isObject(value) && value.type === `worker-main-rpc-cancel` && typeof value.workerId === `string` && typeof value.requestId === `string`;
}

export function isWorkerMainRpcRequest(value: unknown): boolean {
  return isObject(value) && value.type === `worker-main-rpc-request` && typeof value.workerId === `string` && typeof value.requestId === `string` && isAllowedMainRpcMethod(value.method);
}

if (typeof module !== `undefined`) module.exports = { isAllowedMainRpcMethod, isWorkerMainRpcCancel, isWorkerMainRpcRequest };
