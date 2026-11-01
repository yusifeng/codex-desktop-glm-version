const THREAD_CLIENT_ID_PREFIX = "thread-client-id-v1:";
const THREAD_TAB_ROUTES_PREFIX = "thread-tab-routes-v1:";

export function threadClientIdStorageKey(clientId: string): string {
  return `${THREAD_CLIENT_ID_PREFIX}${encodeURIComponent(clientId)}`;
}

export function localThreadClientIdStorageKey(threadId: string): string {
  return threadClientIdStorageKey(`local:${threadId}`);
}

export function threadTabRoutesStorageKey(threadId: string): string {
  return `${THREAD_TAB_ROUTES_PREFIX}${encodeURIComponent(threadId)}`;
}
