import { z } from "zod";

export interface BrowserCapabilityInfo {
  description: string;
  id: string;
}

export interface IabCapabilityHost {
  isBrowserVisibleForBrowserUse(browserTabId?: unknown): boolean;
  setBrowserVisibleForBrowserUse(visible: boolean, browserTabId?: unknown): void;
  setViewportForBrowserUse(
    viewport: { height: number; width: number } | null,
    browserTabId?: unknown,
  ): void;
  waitForPendingDebuggerSync?(browserTabId?: unknown): Promise<unknown> | null | undefined;
}

export interface IabCapabilityRuntimeDependencies {
  dispatchBrowserCommand(input: {
    backendName: string;
    commandSets: { commands: Record<string, unknown> }[];
    handlers: Record<string, (payload: any) => any>;
    payload: { type: string };
  }): Promise<unknown>;
  isWebMcpEnabled(buildFlavor: string, featureFlag: unknown): boolean;
}

export interface IabCapabilityRuntime {
  browserCapabilityInfos: BrowserCapabilityInfo[];
  dispatchCapabilityCommand(input: {
    browserTabId?: unknown;
    host: IabCapabilityHost;
    payload: { type: string };
  }): Promise<unknown>;
  isDeferredCapabilityCommand(payload: { type?: unknown }): boolean;
  parseDeferredCapabilityIntent(payload: { type?: unknown }):
    | { kind: "visibility"; visible: boolean }
    | { kind: "viewport"; viewportSize: { height: number; width: number } | null }
    | null;
  tabCapabilityInfos(buildFlavor: string | null | undefined, featureFlags: {
    webMcp?: unknown;
  }): BrowserCapabilityInfo[];
}

const VISIBILITY_GET = `browser_visibility_get`;
const VISIBILITY_SET = `browser_visibility_set`;
const VIEWPORT_RESET = `browser_viewport_reset`;
const VIEWPORT_SET = `browser_viewport_set`;

const browserIdentitySchema = z.object({ browser_id: z.string() });
const visibilitySetSchema = browserIdentitySchema.extend({ visible: z.boolean() });
const viewportSetSchema = browserIdentitySchema.extend({
  height: z.number().int().positive(),
  width: z.number().int().positive(),
});

const visibilityInfo: BrowserCapabilityInfo = {
  id: `visibility`,
  description: `Use to show or hide the browser to the user, and to determine the browser's current visibility. Keep browser work in the background unless the user asks to see it or live viewing is useful. When the browser should be visible, call set(true).`,
};

const viewportInfo: BrowserCapabilityInfo = {
  id: `viewport`,
  description: `Controls an explicit browser viewport override for responsive or device-size testing. Use it when a task calls for specific dimensions or breakpoint validation; otherwise leave it unset so the browser uses its normal viewport. Reset temporary overrides before finishing unless the user asked to keep them.`,
};

const pageAssetsInfo: BrowserCapabilityInfo = {
  id: `pageAssets`,
  description: `List assets already observed in the current page state and bundle selected assets into a temporary local artifact.`,
};

const webMcpInfo: BrowserCapabilityInfo = {
  id: `webmcp`,
  description: `Fetch page-defined WebMCP tools bound to the current document, then call them through the returned object.`,
};

const visibilityCommands = {
  commands: { [VISIBILITY_GET]: {}, [VISIBILITY_SET]: {} },
};

const viewportCommands = {
  commands: { [VIEWPORT_RESET]: {}, [VIEWPORT_SET]: {} },
};

export function createIabCapabilityRuntime(
  dependencies: IabCapabilityRuntimeDependencies,
): IabCapabilityRuntime {
  function handlers(browserTabId: unknown, host: IabCapabilityHost) {
    return {
      [VISIBILITY_SET]: (payload: unknown) => {
        const parsed = visibilitySetSchema.parse(payload);
        host.setBrowserVisibleForBrowserUse(parsed.visible, browserTabId);
        return {};
      },
      [VISIBILITY_GET]: (payload: unknown) => {
        browserIdentitySchema.parse(payload);
        return { visible: host.isBrowserVisibleForBrowserUse(browserTabId) };
      },
      [VIEWPORT_SET]: (payload: unknown) => {
        const parsed = viewportSetSchema.parse(payload);
        host.setViewportForBrowserUse(
          { width: parsed.width, height: parsed.height },
          browserTabId,
        );
        const pendingSync = host.waitForPendingDebuggerSync?.(browserTabId);
        return pendingSync == null ? {} : pendingSync.then(() => ({}));
      },
      [VIEWPORT_RESET]: (payload: unknown) => {
        browserIdentitySchema.parse(payload);
        host.setViewportForBrowserUse(null, browserTabId);
        const pendingSync = host.waitForPendingDebuggerSync?.(browserTabId);
        return pendingSync == null ? {} : pendingSync.then(() => ({}));
      },
    };
  }

  return {
    browserCapabilityInfos: [visibilityInfo, viewportInfo],
    dispatchCapabilityCommand({ browserTabId, host, payload }) {
      return dependencies.dispatchBrowserCommand({
        backendName: `Codex in-app browser`,
        commandSets: [visibilityCommands, viewportCommands],
        handlers: handlers(browserTabId, host),
        payload,
      });
    },
    isDeferredCapabilityCommand(payload) {
      return (
        payload.type === VISIBILITY_SET ||
        payload.type === VIEWPORT_SET ||
        payload.type === VIEWPORT_RESET
      );
    },
    parseDeferredCapabilityIntent(payload) {
      if (payload.type === VISIBILITY_SET) {
        const parsed = visibilitySetSchema.parse(payload);
        return { kind: `visibility`, visible: parsed.visible };
      }
      if (payload.type === VIEWPORT_SET) {
        const parsed = viewportSetSchema.parse(payload);
        return {
          kind: `viewport`,
          viewportSize: { width: parsed.width, height: parsed.height },
        };
      }
      if (payload.type === VIEWPORT_RESET) {
        browserIdentitySchema.parse(payload);
        return { kind: `viewport`, viewportSize: null };
      }
      return null;
    },
    tabCapabilityInfos(buildFlavor, featureFlags) {
      return [
        pageAssetsInfo,
        ...(buildFlavor != null &&
        dependencies.isWebMcpEnabled(buildFlavor, featureFlags.webMcp)
          ? [webMcpInfo]
          : []),
      ];
    },
  };
}

export const IAB_CAPABILITY_COMMANDS = {
  visibilityGet: VISIBILITY_GET,
  visibilitySet: VISIBILITY_SET,
  viewportReset: VIEWPORT_RESET,
  viewportSet: VIEWPORT_SET,
} as const;
