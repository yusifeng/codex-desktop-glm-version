import "@rchunk/rolldown-runtime";
import { l3 as isEqual } from "@rchunk/app-shared";

type ExtensionProfile = Record<string, unknown> | null;

interface ExtensionProfileSubscription {
  [Symbol.dispose](): void;
}

interface BrowserExtensionProfileHost {
  subscribeExtensionProfile(
    listener: (profile: ExtensionProfile) => void,
  ): Promise<ExtensionProfileSubscription>;
}

interface ExtensionProfileStore {
  getSnapshot(): ExtensionProfile;
  initialize(host: BrowserExtensionProfileHost | null | undefined): Promise<void>;
  receive(profile: ExtensionProfile): void;
  retry(host: BrowserExtensionProfileHost | null | undefined): void;
  subscribe(listener: () => void): () => void;
}

let initialized = false;
export let t: ExtensionProfileStore;

async function subscribeToExtensionProfile(
  host: BrowserExtensionProfileHost | null | undefined,
  store: ExtensionProfileStore,
): Promise<void> {
  if (host == null) return;

  let subscription: ExtensionProfileSubscription | null = null;
  let pageHidden = false;
  const cleanup = (): void => {
    pageHidden = true;
    subscription?.[Symbol.dispose]();
    subscription = null;
    window.removeEventListener("pagehide", cleanup);
  };

  window.addEventListener("pagehide", cleanup, { once: true });
  try {
    subscription = await host.subscribeExtensionProfile((profile) => {
      if (!pageHidden) store.receive(profile);
    });
    if (pageHidden) cleanup();
  } catch (error) {
    cleanup();
    throw error;
  }
}

export function n(): void {
  if (initialized) return;
  initialized = true;

  let snapshot: ExtensionProfile = null;
  let initialization: Promise<void> | null = null;
  let initializationFailed = false;
  const listeners = new Set<() => void>();

  t = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    initialize: (host) => {
      if (initialization != null) return initialization;
      initializationFailed = false;
      initialization = subscribeToExtensionProfile(host, t).catch(() => {
        initialization = null;
        initializationFailed = true;
        t.receive(null);
      });
      return initialization;
    },
    retry: (host) => {
      if (initializationFailed) void t.initialize(host);
    },
    receive: (profile) => {
      if (isEqual(snapshot, profile)) return;
      snapshot = profile;
      for (const listener of listeners) listener();
    },
  };
}
