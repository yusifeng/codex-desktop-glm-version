export interface BrowserCommentHandler<Message = unknown, Result = unknown> {
  acceptsTab(browserTabId: string): boolean;
  submit(message: Message): Promise<Result> | Result;
}

export interface BrowserContextRequest {
  conversationId: string;
}

type ContextProvider<Request extends BrowserContextRequest, Result> = (
  request: Request,
) => Result | null | undefined;

const contextProviders = new Map<string, Set<ContextProvider<any, any>>>();
const commentHandlers = new Map<string, Set<BrowserCommentHandler<any, any>>>();
const readinessListeners = new Map<string, Set<() => void>>();
let browserTabUrlStateSignal: unknown;

export interface BrowserTabUrlState {
  currentUrls: string[];
  isOpen: boolean;
}

interface BrowserTabStateScope {
  get<Value>(signal: unknown, key: string): Value | null | undefined;
  set<Value>(signal: unknown, key: string, value: Value): void;
}

export function initializeBrowserTabUrlState(
  createStateFamily: (scope: unknown, defaultValue: (key: string) => null) => unknown,
  appScope: unknown,
): void {
  browserTabUrlStateSignal ??= createStateFamily(appScope, () => null);
}

function requireBrowserTabUrlStateSignal(): unknown {
  if (browserTabUrlStateSignal == null) {
    throw new Error("Browser tab URL state must be initialized before use");
  }
  return browserTabUrlStateSignal;
}

function browserTabStateKey(conversationId: string, browserTabId: string): string {
  return `${conversationId}\0${browserTabId}`;
}

export function setBrowserTabUrlState(
  scope: BrowserTabStateScope,
  conversationId: string,
  browserTabId: string,
  state: { isOpen: boolean; url: string },
): void {
  const url = state.url.trim();
  scope.set(requireBrowserTabUrlStateSignal(), browserTabStateKey(conversationId, browserTabId), {
    currentUrls: url.length > 0 ? [url] : [],
    isOpen: state.isOpen,
  });
}

export function getBrowserTabUrlState(
  scope: BrowserTabStateScope,
  conversationId: string | null | undefined,
  browserTabId: string | null | undefined,
): BrowserTabUrlState | null | undefined {
  if (conversationId == null || browserTabId == null) return null;
  return scope.get(
    requireBrowserTabUrlStateSignal(),
    browserTabStateKey(conversationId, browserTabId),
  );
}

function addToRegistry<Value>(
  registry: Map<string, Set<Value>>,
  key: string,
  value: Value,
): () => void {
  const values = registry.get(key) ?? new Set<Value>();
  values.add(value);
  registry.set(key, values);
  for (const listener of readinessListeners.get(key) ?? []) listener();
  return () => {
    values.delete(value);
    if (values.size === 0) registry.delete(key);
  };
}

export function registerBrowserContextProvider<
  Request extends BrowserContextRequest,
  Result,
>(
  conversationId: string,
  provider: ContextProvider<Request, Result>,
): () => void {
  return addToRegistry(contextProviders, conversationId, provider);
}

export function resolveBrowserContext<
  Request extends BrowserContextRequest,
  Result,
>(request: Request): Result | undefined {
  for (const provider of contextProviders.get(request.conversationId) ?? []) {
    const result = provider(request);
    if (result != null) return result;
  }
  return undefined;
}

export function registerBrowserCommentHandler<Message, Result>(
  conversationId: string,
  handler: BrowserCommentHandler<Message, Result>,
): () => void {
  return addToRegistry(commentHandlers, conversationId, handler);
}

export function findBrowserCommentHandler<Message, Result>(
  conversationId: string,
  browserTabId: string,
): BrowserCommentHandler<Message, Result> | undefined {
  for (const handler of commentHandlers.get(conversationId) ?? []) {
    if (handler.acceptsTab(browserTabId)) return handler;
  }
  return undefined;
}

export function hasBrowserCommentHandler(
  conversationId: string,
  browserTabId: string,
): boolean {
  return findBrowserCommentHandler(conversationId, browserTabId) != null;
}

export function submitBrowserComment<Message, Result>(
  message: Message & { browserTabId: string; conversationId: string },
): Promise<Result> | null {
  const handler = findBrowserCommentHandler<Message, Result>(
    message.conversationId,
    message.browserTabId,
  );
  return handler == null ? null : Promise.resolve(handler.submit(message));
}

export function subscribeBrowserCommentReadiness(
  conversationId: string,
  listener: () => void,
): () => void {
  const listeners = readinessListeners.get(conversationId) ?? new Set();
  listeners.add(listener);
  readinessListeners.set(conversationId, listeners);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) readinessListeners.delete(conversationId);
  };
}

export function waitForBrowserCommentHandler(
  conversationId: string,
  browserTabId: string,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (hasBrowserCommentHandler(conversationId, browserTabId)) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      unwatch();
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      resolve(ready);
    };
    const onReady = () => {
      if (hasBrowserCommentHandler(conversationId, browserTabId)) finish(true);
    };
    const onAbort = () => finish(false);
    const unwatch = subscribeBrowserCommentReadiness(conversationId, onReady);
    timeout = setTimeout(() => finish(false), timeoutMs);
    signal.addEventListener("abort", onAbort, { once: true });
    onReady();
  });
}
