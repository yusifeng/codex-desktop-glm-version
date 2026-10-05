function isValidAnnotationHitTestRequest(value: unknown, maxRequestIdLength: number): value is { type: `hit-test`; requestId: string; x: number; y: number } {
  if (typeof value !== `object` || !value) return false;
  const request = value as Record<string, unknown>;
  return request.type === `hit-test` && typeof request.requestId === `string` && request.requestId.length > 0 && request.requestId.length <= maxRequestIdLength && typeof request.x === `number` && Number.isFinite(request.x) && typeof request.y === `number` && Number.isFinite(request.y);
}
export { isValidAnnotationHitTestRequest };
if (typeof module !== `undefined`) module.exports = { isValidAnnotationHitTestRequest };
