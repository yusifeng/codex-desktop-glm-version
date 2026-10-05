/**
 * Returns whether an outbound message is still being sent or finalized.
 * The generated composer surface uses these two transient kinds to suppress
 * duplicate actions while transport is in flight.
 */
export function isMessageSendingOrPolling(message: { kind?: unknown } | null | undefined): boolean {
  return message?.kind === "sending_in_progress" || message?.kind === "polling_final";
}
