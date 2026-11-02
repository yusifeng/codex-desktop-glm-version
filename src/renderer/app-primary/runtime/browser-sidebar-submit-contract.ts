const SUBMIT_REQUEST_EVENT = "codex-browser-sidebar-tweaks-submit-request";

interface SubmitRequestDetail {
  conversationId: string;
  submissionKind?: string;
  availabilityChanged?: boolean;
  onSubmitStarted?: (result: unknown) => void;
  onSubmitAvailability?: (available: boolean) => void;
}

type SubmitRequestEvent = CustomEvent<SubmitRequestDetail>;

/** Ask the active Browser sidebar submission owner for its synchronous start result. */
export function getBrowserSidebarSubmitStarted(conversationId: string): unknown {
  let result: unknown;
  window.dispatchEvent(new CustomEvent<SubmitRequestDetail>(SUBMIT_REQUEST_EVENT, {
    detail: {
      conversationId,
      onSubmitStarted(value) {
        result = value;
      },
    },
  }));
  return result;
}

/** Combine the synchronous availability answers supplied by every registered owner. */
export function getBrowserSidebarSubmitAvailability(
  conversationId: string,
  submissionKind?: string,
): boolean | undefined {
  let result: boolean | undefined;
  window.dispatchEvent(new CustomEvent<SubmitRequestDetail>(SUBMIT_REQUEST_EVENT, {
    detail: {
      conversationId,
      submissionKind,
      onSubmitAvailability(available) {
        result = (result == null || result) && available;
      },
    },
  }));
  return result;
}

/** Subscribe to availability invalidations for one conversation. */
export function subscribeBrowserSidebarSubmitAvailability(
  conversationId: string,
  onAvailabilityChanged: () => void,
): () => void {
  const listener = (event: Event) => {
    const submitEvent = event as SubmitRequestEvent;
    if (
      submitEvent.detail.conversationId === conversationId &&
      submitEvent.detail.availabilityChanged
    ) {
      onAvailabilityChanged();
    }
  };
  window.addEventListener(SUBMIT_REQUEST_EVENT, listener);
  return () => window.removeEventListener(SUBMIT_REQUEST_EVENT, listener);
}

