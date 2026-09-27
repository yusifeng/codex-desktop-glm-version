// browser-session-queries —— 浏览器会话资格、配置探测和调试事件流。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
void runtimeChunk;

const {
  Cq: debugMenuPolicy,
  FX: initializeSignalRuntime,
  QI: initializeScopeRuntime,
  QX: createQueryFamily,
  ZI: appScope,
  eZ: createQuerySignal,
  wL: initializeWindowRuntime,
} = appSharedChunk;
const {
  Oun: getRuntimeEnvironment,
  _s: initializeBrowserSessionAnalytics,
  gs: eligibilityAnalyticsEvent,
  hs: profileAnalyticsEvent,
  mnt: initializeAppServices,
  pnt: appServices,
  xpn: trackAnalytics,
  ypn: initializeAnalyticsRuntime,
} = appInitialChunk;

interface BrowserSessionDebugEvent {
  details?: Record<string, unknown>;
  source: "renderer";
  stage: string;
}

let debugEnabled = false;
let debugEvents: BrowserSessionDebugEvent[] = [];
const debugListeners = new Set<() => void>();

function recordStage(
  stage: string,
  details: Record<string, unknown> = {},
): void {
  if (debugEnabled) recordDebugEvent({ source: "renderer", stage, details });
}

function recordDebugEvent(event: BrowserSessionDebugEvent): void {
  if (!debugEnabled) return;
  console.log(`[browser-session] ${JSON.stringify(event)}`);
  debugEvents = [...debugEvents.slice(-49), event];
  for (const listener of debugListeners) listener();
}

function clearDebugEvents(): void {
  if (!debugEnabled) return;
  debugEvents = [];
  for (const listener of debugListeners) listener();
}

function subscribeDebugEvents(listener: () => void): () => void {
  debugListeners.add(listener);
  return () => debugListeners.delete(listener);
}

function getDebugEvents(): readonly BrowserSessionDebugEvent[] {
  return debugEvents;
}

function initializeBrowserSessionDebug(): void {
  initializeWindowRuntime();
  debugEnabled = debugMenuPolicy.allowDebugMenu(getRuntimeEnvironment());
}

function createDesktopSessionUrl(origin?: string | null): string {
  return new URL(
    "/codex/desktop-session",
    origin?.trim() || "https://chatgpt.com",
  ).toString();
}

let eligibilityQuery: import("@rchunk/app-shared").ScopedQuerySignal<
  Record<string, unknown>,
  import("@rchunk/app-initial").BrowserSessionEligibility | null
>;
let profileQuery: import("@rchunk/app-shared").ScopedQueryFamily<
  Record<string, unknown>,
  string,
  import("@rchunk/app-initial").BrowserSessionProfile | null
>;

function initializeBrowserSessionQueries(): void {
  initializeBrowserSessionAnalytics();
  initializeSignalRuntime();
  initializeAnalyticsRuntime();
  initializeAppServices();
  initializeScopeRuntime();
  initializeBrowserSessionDebug();
  eligibilityQuery = createQuerySignal(appScope, ({ scope }) => ({
    gcTime: Infinity,
    queryKey: ["chatgpt-browser-session-lookup-eligibility"],
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      clearDebugEvents();
      recordStage("eligibility_query_started", {
        serviceAvailable: appServices.chatGptBrowserSession != null,
      });
      const result =
        (await appServices.chatGptBrowserSession?.getLookupEligibility()) ??
        null;
      recordStage("eligibility_query_completed", {
        eligible: result?.eligible ?? false,
        resultAvailable: result != null,
      });
      if (result != null) {
        trackAnalytics(scope, eligibilityAnalyticsEvent, {
          arm64CheckPassed: result.arm64,
          browserHasVisibleWindow: result.browserHasVisibleWindow,
          browserIsRunning: result.browserIsRunning,
          deviceCheckSupported: result.deviceCheck,
          eligible: result.eligible,
          macosCheckPassed: result.macOS,
        });
      }
      return result;
    },
  }));
  profileQuery = createQueryFamily(appScope, (securityLevel, { scope }) => ({
    gcTime: Infinity,
    queryKey: ["chatgpt-browser-session-profile", securityLevel],
    retry: false,
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      const service = appServices.chatGptBrowserSession;
      recordStage("profile_query_started", {
        securityLevel,
        serviceAvailable: service != null,
      });
      if (service == null) {
        recordStage("profile_query_skipped", { reason: "service_unavailable" });
        return null;
      }
      const probeId = crypto.randomUUID();
      const cancel = (): void => service.cancelProbe(probeId);
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) {
        recordStage("profile_query_aborted_before_probe");
        cancel();
        return null;
      }
      try {
        const { chatGptDesktopAuthOrigin } = await appServices.appInfo.get();
        if (signal.aborted) {
          recordStage("profile_query_aborted_before_probe");
          return null;
        }
        const startedAt = performance.now();
        const profile = await service.probe(
          probeId,
          createDesktopSessionUrl(chatGptDesktopAuthOrigin),
          securityLevel,
          debugEnabled ? recordDebugEvent : undefined,
        );
        if (!signal.aborted) {
          trackAnalytics(scope, profileAnalyticsEvent, {
            latencyMs: Math.round(performance.now() - startedAt),
            profileFound: profile != null,
          });
        }
        recordStage("profile_query_completed", {
          profileFound: profile != null,
        });
        return profile;
      } catch (error) {
        recordStage("profile_query_failed");
        throw error;
      } finally {
        signal.removeEventListener("abort", cancel);
      }
    },
  }));
}

export {
  initializeBrowserSessionDebug as a,
  getDebugEvents as i,
  profileQuery as n,
  subscribeDebugEvents as o,
  initializeBrowserSessionQueries as r,
  eligibilityQuery as t,
};
