import "@rchunk/rolldown-runtime";
import {
  FX as initializeMaitaiRuntime,
  QI as initializeExternalSignals,
  ZI as appScope,
  dZ as createExternalSignal,
  type ScopedExternalSignal,
} from "@rchunk/app-shared";
import {
  mnt as initializeAppServices,
  pnt as appServices,
} from "@rchunk/app-initial";
import * as profileChunk from "@rchunk/profile";

type ExtensionProfile = Record<string, unknown> | null;

interface BrowserExtensionProfileHost {
  subscribeExtensionProfile(
    listener: (profile: ExtensionProfile) => void,
  ): Promise<{ [Symbol.dispose](): void }>;
}

interface ExtensionProfileStore {
  getSnapshot(): ExtensionProfile;
  initialize(host: BrowserExtensionProfileHost | null | undefined): Promise<void>;
  subscribe(listener: () => void): () => void;
}

interface ProfileChunkRuntime {
  n(): void;
  t: ExtensionProfileStore;
}

function getProfileRuntime(): ProfileChunkRuntime {
  return profileChunk as unknown as ProfileChunkRuntime;
}

let initialized = false;
export let t: ScopedExternalSignal<Record<string, unknown>, ExtensionProfile>;

export function r(): Promise<void> {
  const { t: profileStore } = getProfileRuntime();
  const browserHost = (appServices as unknown as {
    browserHost?: BrowserExtensionProfileHost;
  }).browserHost;
  return profileStore.initialize(browserHost);
}

export function n(): void {
  if (initialized) return;
  initialized = true;
  initializeMaitaiRuntime();
  initializeAppServices();
  initializeExternalSignals();
  const { n: initializeProfileStore } = getProfileRuntime();
  initializeProfileStore();
  const { t: profileStore } = getProfileRuntime();
  t = createExternalSignal(
    appScope,
    profileStore.getSnapshot,
    ({ set }) =>
      profileStore.subscribe(() => set(profileStore.getSnapshot())),
  );
}
