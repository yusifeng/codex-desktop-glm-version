import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";
import * as PresentationChunk from "@rchunk/settings-parental-presentation";
import * as LoggingChunk from "@rchunk/u18-banner-logging";

type NotificationType = "family-invite" | "family-unlink" | "self-harm" | "setting-defaulted" | "setting-updated";
interface NotificationItem { id: string; notification_type: NotificationType; payload?: Record<string, unknown> | null; reacted_to_at?: string | null }
interface NotificationPage { cursor?: string | null; items: NotificationItem[] }
interface QueryClient { cancelQueries(input: { queryKey: readonly unknown[] }): Promise<unknown> | unknown; getQueryData(key: readonly unknown[]): NotificationPage | undefined; removeQueries(input: { queryKey: readonly unknown[] }): void }
interface Scope { queryClient: QueryClient; query?: { snapshot(key: unknown): unknown }; get?(key: unknown): unknown }
interface Socket { onMessage?(listener: (message: unknown) => void): () => void; onPotentialMissedMessages?(listener: () => void): () => void; onSubscribed?(listener: () => void): () => void; subscribe(): void; unsubscribe(): void }
interface InitialApi { TKt?(name: string, getUrl: () => Promise<string>, key: string): Socket; rJt?: { safeGet(path: string, options: Record<string, unknown>): Promise<{ websocket_url: string }> } }

const initial = InitialChunk as unknown as InitialApi;
void RuntimeChunk; void SharedChunk; void PresentationChunk;
const logEvent = (LoggingChunk as unknown as { n?: (scope: Scope, event: Record<string, unknown>) => void }).n;
const allowedTypes = new Set<NotificationType>(["family-invite", "family-unlink", "self-harm", "setting-defaulted", "setting-updated"]);

function parseNotification(value: unknown): NotificationItem | null {
  if (typeof value !== "object" || value == null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.notification_type !== "string" || !allowedTypes.has(record.notification_type as NotificationType)) return null;
  if (record.notification_type === "setting-updated" && typeof record.payload === "object" && record.payload != null && (record.payload as Record<string, unknown>).clear_cache_only === true) return null;
  return record as unknown as NotificationItem;
}

function listenForParentalControlNotifications(scope: Scope, userId: string, accountId: string): () => void {
  const controller = new AbortController();
  const queryKey = ["parental-control-notifications", userId, accountId] as const;
  const known = new Map<string, "banner" | "info" | "shown">();
  const refresh = (): void => {
    const page = scope.queryClient.getQueryData(queryKey);
    for (const candidate of page?.items ?? []) {
      const item = parseNotification(candidate);
      if (item == null || known.has(item.id)) continue;
      const surface = item.reacted_to_at != null ? "shown" : item.notification_type === "family-invite" ? "info" : "banner";
      known.set(item.id, surface);
      logEvent?.(scope, { accountId, notificationId: item.id, notificationType: item.notification_type, surface, userId });
    }
  };
  const socket = initial.TKt?.(
    "app_notifications",
    async () => {
      if (initial.rJt == null) throw new Error("Notification API is unavailable");
      return (await initial.rJt.safeGet("/celsius/ws/user", { additionalHeaders: { "ChatGPT-Account-ID": accountId }, signal: controller.signal })).websocket_url;
    },
    JSON.stringify(["parental-controls", userId, accountId]),
  );
  const removeMessage = socket?.onMessage?.((message) => {
    const item = parseNotification(message);
    if (item != null && !known.has(item.id)) { known.set(item.id, item.notification_type === "family-invite" ? "info" : "banner"); logEvent?.(scope, { accountId, notificationId: item.id, notificationType: item.notification_type, surface: known.get(item.id), userId }); }
    refresh();
  }) ?? (() => {});
  const removeMissed = socket?.onPotentialMissedMessages?.(refresh) ?? (() => {});
  const removeSubscribed = socket?.onSubscribed?.(refresh) ?? (() => {});
  socket?.subscribe(); refresh();
  return () => { controller.abort(); removeMessage(); removeMissed(); removeSubscribed(); socket?.unsubscribe(); void scope.queryClient.cancelQueries({ queryKey }); scope.queryClient.removeQueries({ queryKey }); known.clear(); };
}

export { listenForParentalControlNotifications };
