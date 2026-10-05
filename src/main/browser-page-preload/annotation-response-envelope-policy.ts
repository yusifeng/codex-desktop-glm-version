function createAnnotationResponseEnvelope(input: { type: string; registrationId: string; customRendering: boolean; requestId?: string; hit?: Record<string, unknown> | null }): Record<string, unknown> {
  return { type: input.type, registrationId: input.registrationId, customRendering: input.customRendering, requestId: input.requestId, hit: input.hit };
}
export { createAnnotationResponseEnvelope };
if (typeof module !== `undefined`) module.exports = { createAnnotationResponseEnvelope };
