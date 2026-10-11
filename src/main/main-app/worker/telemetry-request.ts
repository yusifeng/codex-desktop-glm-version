export interface TelemetryResponse {
  ok: boolean;
  status: number;
  body?: { cancel(): Promise<void> } | null;
  text(): Promise<string>;
}

export interface TelemetryNetwork {
  fetch(url: string, init: { method: `POST`; headers: Record<string, string>; body: string; signal: AbortSignal }): Promise<TelemetryResponse>;
}

export async function sendTelemetryRequest(
  network: TelemetryNetwork,
  request: { payload: string; requestId: string },
  signal: AbortSignal,
  requestUrl: (requestId: string) => string,
) {
  const response = await network.fetch(requestUrl(request.requestId), {
    method: `POST`,
    headers: { "content-type": `text/plain`, "x-request-id": request.requestId },
    body: request.payload,
    signal,
  });
  if (response.ok) {
    await response.body?.cancel().catch(() => {});
    return { status: response.status, body: null };
  }
  return { status: response.status, body: await response.text() };
}

if (typeof module !== `undefined`) module.exports = { sendTelemetryRequest };
