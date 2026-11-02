export interface MessageSendStatus {
  kind: string;
}

/** Return whether a send has reached an active or successful terminal presentation state. */
export function isMessageSendPresented(status: MessageSendStatus): boolean {
  return status.kind === "sending_in_progress" ||
    status.kind === "polling_final" ||
    status.kind === "success_sent";
}

/** Read the optional sender link id stored in message metadata. */
export function getSenderLinkId(metadata: Record<string, unknown> | null | undefined): string | undefined {
  const value = metadata?.senderLinkId;
  return typeof value === "string" ? value : undefined;
}
