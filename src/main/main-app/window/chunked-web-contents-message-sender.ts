interface WebContentsLike {
  id: number;
  isDestroyed(): boolean;
  isLoading?(): boolean;
  send(channel: string, payload: unknown): void;
  once?(event: string, listener: () => void): void;
  on?(event: string, listener: () => void): void;
  removeListener?(event: string, listener: () => void): void;
}

interface ChunkedSenderLike {
  send(target: WebContentsLike, message: { channel: string; payload: unknown }): void;
  sendInline(target: WebContentsLike, message: { channel: string; payload: unknown }): void;
  sendCritical(target: WebContentsLike, message: { channel: string; payload: unknown }): void;
  acknowledge(target: WebContentsLike, messageId: string, chunkIndex: number): void;
}

interface ChunkedSenderConstructor {
  new(options: Record<string, unknown>): ChunkedSenderLike;
}

export function createChunkedWebContentsMessageSenderClass({
  ChunkedMessageSenderBase,
  createLogger,
  inlineMessageChannel,
  retryDelayMs = 1_000,
}: {
  ChunkedMessageSenderBase: ChunkedSenderConstructor;
  createLogger: (tag: string) => () => { warning(message: string, metadata: unknown): void };
  inlineMessageChannel: string;
  retryDelayMs?: number;
}) {
  return class ChunkedWebContentsMessageSender {
    private readonly logger = createLogger("ChunkedMessageSender");
    private readonly sender: ChunkedSenderLike;

    constructor(options: Record<string, unknown> = {}) {
      this.sender = new ChunkedMessageSenderBase({
        ...options,
        deliver: (target: WebContentsLike, message: { channel: string; payload: unknown }, chunk?: unknown) => {
          target.send(message.channel, chunk ?? message.payload);
        },
        getPayload: (message: { payload: unknown }) => message.payload,
        isAvailable: (target: WebContentsLike) => !target.isDestroyed(),
        isLoading: (target: WebContentsLike) => target.isLoading?.() === true,
        onSendError: (target: WebContentsLike, error: unknown) => {
          this.logger().warning("chunked_message_send_failed", {
            safe: { webContentsId: target.id },
            sensitive: { error },
          });
        },
        retryDelayMs,
        subscribe: (target: WebContentsLike, listeners: { onDestroyed(): void; onLoading(): void; onLoaded(): void }) => {
          target.once?.("destroyed", listeners.onDestroyed);
          target.on?.("did-start-loading", listeners.onLoading);
          target.on?.("did-stop-loading", listeners.onLoaded);
          return () => {
            target.removeListener?.("destroyed", listeners.onDestroyed);
            target.removeListener?.("did-start-loading", listeners.onLoading);
            target.removeListener?.("did-stop-loading", listeners.onLoaded);
          };
        },
      });
    }

    send(target: WebContentsLike, channel: string, payload: unknown): void {
      if (!target.isDestroyed()) this.sender.send(target, { channel, payload });
    }

    sendInline(target: WebContentsLike, channel: string, payload: unknown): void {
      if (!target.isDestroyed()) this.sender.sendInline(target, { channel, payload });
    }

    sendCritical(target: WebContentsLike, channel: string, payload: unknown): void {
      if (!target.isDestroyed()) this.sender.sendCritical(target, { channel, payload });
    }

    sendInlineMessageForView(target: WebContentsLike, message: unknown): void {
      this.sendInline(target, inlineMessageChannel, message);
    }

    acknowledge(target: WebContentsLike, messageId: string, chunkIndex: number): void {
      this.sender.acknowledge(target, messageId, chunkIndex);
    }
  };
}

/** Installs the trusted renderer acknowledgement boundary for chunked messages. */
export function installChunkedMessageAcknowledgement({
  acknowledgementChannel,
  chunkedMessageSender,
  ipcMain,
  isTrustedIpcEvent,
}: {
  acknowledgementChannel: string;
  chunkedMessageSender: { acknowledge(target: WebContentsLike, messageId: string, chunkIndex: number): void };
  ipcMain: { on(channel: string, listener: (event: any, messageId: unknown, chunkIndex: unknown) => void): void };
  isTrustedIpcEvent(event: any): boolean;
}): void {
  ipcMain.on(acknowledgementChannel, (event, messageId, chunkIndex) => {
    if (!isTrustedIpcEvent(event)) return;
    if (typeof messageId !== "string" || !Number.isInteger(chunkIndex)) return;
    chunkedMessageSender.acknowledge(event.sender, messageId, chunkIndex as number);
  });
}
