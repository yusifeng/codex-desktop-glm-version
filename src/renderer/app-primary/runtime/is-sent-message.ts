/** Whether a message payload has completed its send operation. */
export function isSentMessage(message: { isSent?: unknown } | null | undefined): boolean {
  return message?.isSent === true;
}
