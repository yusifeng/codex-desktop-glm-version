type Notification = { method?: unknown; params?: any };

function isCompletedMcpToolCall(notification: Notification): boolean {
  const params = notification.params;
  return notification.method === "item/completed" &&
    typeof params?.threadId === "string" &&
    typeof params?.item === "object" && params.item != null &&
    params.item.type === "mcpToolCall" && typeof params.item.id === "string";
}

function isArchivedThread(notification: Notification): boolean {
  return notification.method === "thread/archived" && typeof notification.params?.threadId === "string";
}

function isIdleThread(notification: Notification): boolean {
  const status = notification.params?.status;
  return notification.method === "thread/status/changed" &&
    typeof notification.params?.threadId === "string" &&
    typeof status === "object" && status != null && status.type === "idle";
}

/** Routes app-server thread notifications into Browser session lifecycle state. */
export function installBrowserSessionNotificationBridge({ browserSessionRegistry, onMcpToolCallCompleted, source }: any): void {
  source?.registerInternalNotificationHandler((notification: Notification) => {
    if (isCompletedMcpToolCall(notification)) {
      onMcpToolCallCompleted(notification.params.threadId, notification.params.item.id);
      return;
    }
    if (isArchivedThread(notification)) {
      browserSessionRegistry.disposeConversation(notification.params.threadId);
      return;
    }
    if (isIdleThread(notification)) {
      browserSessionRegistry.endSessionActivity({ conversationId: notification.params.threadId });
    }
  });
}
