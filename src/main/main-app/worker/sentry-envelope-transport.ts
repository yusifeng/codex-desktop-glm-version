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

/** Builds the worker-facing RPC adapter without retaining a main-chunk subclass. */
export function createSentryRpcHandlerClass({
  RpcHandlerBase,
  getClient,
}: {
  RpcHandlerBase: new (...args: any[]) => any;
  getClient: () => SentryClientLike | null | undefined;
}) {
  return class SentryRpcHandler extends RpcHandlerBase {
    async sendEnvelope(envelope: unknown) {
      return sendSentryEnvelope(getClient, envelope);
    }
  };
}

if (typeof module !== `undefined`) module.exports = { sendSentryEnvelope, createSentryRpcHandlerClass };
