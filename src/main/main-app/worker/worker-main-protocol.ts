/** Strictly parses worker requests that forward a CES telemetry payload. */
export function createWorkerMainProtocol(schema: any) {
  const cesRequestSchema = schema.wf({ payload: schema.Of(), requestId: schema.Of() });
  return {
    parseCesPayload(value: unknown) {
      return cesRequestSchema.parse(value);
    },
  };
}

if (typeof module !== "undefined") module.exports = { createWorkerMainProtocol };
