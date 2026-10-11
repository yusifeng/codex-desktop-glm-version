export interface SentryClientLike {
  getOptions(): { enabled?: boolean };
  getTransport(): { send(envelope: unknown): Promise<{ statusCode: number }> } | undefined;
}

export async function sendSentryEnvelope(
  getClient: () => SentryClientLike | null | undefined,
  envelope: unknown,
): Promise<{ statusCode: number }> {
  const client = getClient();
  if (client == null || client.getOptions().enabled === false) return { statusCode: 403 };
  return (await client.getTransport()?.send(envelope)) ?? { statusCode: 403 };
}

if (typeof module !== `undefined`) module.exports = { sendSentryEnvelope };
