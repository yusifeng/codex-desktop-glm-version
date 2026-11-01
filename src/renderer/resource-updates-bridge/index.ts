// React bridge for websocket resource invalidations. Release chunk: resource-updates-bridge-2f9138580a72.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface Store {
  watch(
    callback: (context: {
      get(signal: unknown): unknown;
    }) => void | (() => void),
  ): () => void;
}
interface Subscription {
  onMessage(callback: (message: unknown) => void): () => void;
  onSubscribed(callback: () => void): () => void;
  onPotentialMissedMessages(callback: () => void): () => void;
  subscribe(): void;
  unsubscribe(): void;
}
interface Debounced {
  (): void;
  cancel(): void;
}
interface AppSharedRuntime {
  LX(signal: unknown): Store;
  ZI: unknown;
  e6(): {
    useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  };
  vW: string;
  wL(): void;
}
interface AppInitialRuntime {
  [key: string]: unknown;
}

type DebounceFactory = (
  callback: () => void,
  delay: number,
  options: { leading: boolean },
) => Debounced;

const shared = appSharedChunk as unknown as AppSharedRuntime;
const initial = appInitialChunk as unknown as AppInitialRuntime;
const React = shared.e6();

function websocketUrl(response: unknown): unknown {
  return typeof response === "object" &&
    response !== null &&
    "websocket_url" in response
    ? response.websocket_url
    : undefined;
}

function resolveDebounceFactory(): DebounceFactory | undefined {
  const initializeDebounceModule = initial.IPt;
  if (typeof initializeDebounceModule !== "function") return undefined;
  const module = initializeDebounceModule() as
    | DebounceFactory
    | { default?: DebounceFactory }
    | undefined;
  if (typeof module === "function") return module;
  return typeof module?.default === "function" ? module.default : undefined;
}

function ResourceUpdatesBridge(): null {
  const store = shared.LX(shared.ZI);
  React.useEffect(
    () =>
      store.watch(({ get }) => {
        const accountId = get(initial.mun);
        const userId = get(initial._un);
        const authAllowed = get(initial.gun);
        const permission = get(initial.vun) as { status?: string } | undefined;
        if (
          accountId == null ||
          userId == null ||
          !authAllowed ||
          permission?.status !== "allowed"
        ) {
          return;
        }
        const debounce = resolveDebounceFactory();
        const invalidate = initial.ctt as
          ((store: Store, accountId: unknown) => void) | undefined;
        const debounced = debounce?.(
          () => invalidate?.(store, accountId),
          500,
          {
            leading: false,
          },
        );
        if (!debounced) return;
        const createSubscription = initial.TKt as
          | ((
              name: string,
              connect: () => Promise<unknown>,
              key: string,
            ) => Subscription)
          | undefined;
        const api = initial.rJt as
          | { safeGet(path: string, options: unknown): Promise<unknown> }
          | undefined;
        const subscription = createSubscription?.(
          "resource-updates",
          () =>
            api
              ?.safeGet("/celsius/ws/user", {
                additionalHeaders: { [shared.vW]: accountId },
              })
              .then(websocketUrl) ?? Promise.resolve(undefined),
          JSON.stringify([accountId, userId]),
        );
        if (!subscription) return;
        const stopMessage = subscription.onMessage((message) => {
          const valid =
            typeof message === "object" &&
            message !== null &&
            "type" in message &&
            message.type === "resource-updated" &&
            "payload" in message;
          if (valid) debounced();
        });
        const stopSubscribed = subscription.onSubscribed(debounced);
        const stopMissed = subscription.onPotentialMissedMessages(debounced);
        subscription.subscribe();
        return () => {
          debounced.cancel();
          stopMessage();
          stopSubscribed();
          stopMissed();
          subscription.unsubscribe();
        };
      }),
    [store],
  );
  return null;
}

shared.wL();

export { ResourceUpdatesBridge };
