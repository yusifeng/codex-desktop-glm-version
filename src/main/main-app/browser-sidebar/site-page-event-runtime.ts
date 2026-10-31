// @ts-nocheck

import { z } from "zod";

export const SITE_ANNOTATION_FEATURES_CHANGED_EVENT = {
  type: "site_annotation_features_changed",
  version: 1,
} as const;

export const WEBMCP_UI_TOOLS_CHANGED_EVENT = {
  type: "webmcp_ui_tools_changed",
  version: 1,
} as const;

const siteAnnotationFeatureSchema = z.enum([
  "containers",
  "controls",
  "surfaces",
  "metadata",
  "metadata-with-targets",
  "mode-toggle",
  "requests",
  "requests-with-prompts",
]);

export const siteAnnotationFeaturesChangedSchema = z.object({
  type: z.literal(SITE_ANNOTATION_FEATURES_CHANGED_EVENT.type),
  version: z.literal(SITE_ANNOTATION_FEATURES_CHANGED_EVENT.version),
  payload: z.object({
    features: z
      .array(siteAnnotationFeatureSchema)
      .max(6)
      .refine(
        (features) =>
          !features.includes("requests") || !features.includes("requests-with-prompts"),
      )
      .refine(
        (features) =>
          !features.includes("metadata") || !features.includes("metadata-with-targets"),
      ),
  }),
});

const webMcpAnnotationsSchema = z.object({
  readOnlyHint: z.boolean().optional(),
  untrustedContentHint: z.boolean().optional(),
  consequentialHint: z.boolean().optional(),
});

const rawWebMcpToolSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  inputSchema: z.unknown(),
  annotations: webMcpAnnotationsSchema.optional(),
  origin: z.string().optional(),
  pageUrl: z.string().optional(),
});

const normalizedWebMcpToolSchema = z.object({
  annotations: z.object({ readOnlyHint: z.boolean() }).optional().catch(undefined),
  description: z.string().optional(),
  inputSchema: z.record(z.string(), z.unknown()).optional().catch(undefined),
  name: z.string(),
  title: z
    .string()
    .transform((value) => value || undefined)
    .optional(),
});

const webMcpToolsChangedSchema = z.object({
  type: z.literal(WEBMCP_UI_TOOLS_CHANGED_EVENT.type),
  version: z.literal(WEBMCP_UI_TOOLS_CHANGED_EVENT.version),
  payload: z.object({ tools: z.array(z.unknown()) }),
});

export function normalizeSiteHostname(url: string): string | null {
  const parsed = URL.parse(url);
  if (parsed?.protocol !== "http:" && parsed?.protocol !== "https:") return null;
  return parsed.hostname.replace(/\.$/, "");
}

export function webMcpDescriptorByteSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function parseWebMcpToolsChangedEvent(
  event: unknown,
  limits: { maxTools: number; maxTotalDescriptorBytes: number },
) {
  const parsedEvent = webMcpToolsChangedSchema.safeParse(event);
  if (!parsedEvent.success) return null;
  const tools = parsedEvent.data.payload.tools;
  if (tools.length > limits.maxTools) return null;
  if (tools.length === 0) return { ...WEBMCP_UI_TOOLS_CHANGED_EVENT, payload: { tools: [] } };

  const parsedTools = z.array(rawWebMcpToolSchema).safeParse(tools);
  if (!parsedTools.success) return null;
  let descriptorBytes: number;
  try {
    descriptorBytes = webMcpDescriptorByteSize(parsedTools.data);
  } catch {
    return null;
  }
  if (descriptorBytes > limits.maxTotalDescriptorBytes) return null;

  return {
    ...WEBMCP_UI_TOOLS_CHANGED_EVENT,
    payload: { tools: parsedTools.data.map((tool) => normalizedWebMcpToolSchema.parse(tool)) },
  };
}

type SitePageEventRuntimeDependencies = {
  browserWindowFromWebContents(owner: unknown): { id: number; isDestroyed(): boolean } | null;
  getFeatureFlags(): { webMcp: unknown; webMcpMaxTools: number };
  maxTotalDescriptorBytes: number;
  isWebMcpEnabled(flag: unknown): boolean;
  applyWebMcpTools(page: unknown, tools: unknown[]): boolean;
  normalizeWindowId(windowId: number): unknown;
};

export function createSitePageEventRuntime(dependencies: SitePageEventRuntimeDependencies) {
  function dispatchPageEvent({
    sender,
    pageState,
    event,
    siteAnnotationFeatures,
    browserSessionRegistry,
    syncThreadState,
  }: Record<string, any>) {
    if (pageState == null) return;
    const browserWindow = dependencies.browserWindowFromWebContents(pageState.windowState.owner);
    if (browserWindow == null || browserWindow.isDestroyed()) return;

    if (event.type === SITE_ANNOTATION_FEATURES_CHANGED_EVENT.type) {
      siteAnnotationFeatures.handlePageEvent(pageState, event);
      return;
    }
    if (event.type === WEBMCP_UI_TOOLS_CHANGED_EVENT.type) {
      const featureFlags = dependencies.getFeatureFlags();
      const parsedEvent = parseWebMcpToolsChangedEvent(event, {
        maxTools: featureFlags.webMcpMaxTools,
        maxTotalDescriptorBytes: dependencies.maxTotalDescriptorBytes,
      });
      if (
        parsedEvent != null &&
        dependencies.applyWebMcpTools(
          pageState.page,
          dependencies.isWebMcpEnabled(featureFlags.webMcp) ? parsedEvent.payload.tools : [],
        )
      ) {
        syncThreadState(pageState.windowState, pageState.page.conversationId, pageState.threadState);
      }
      return;
    }
    browserSessionRegistry.notifyPageEvent({
      conversationId: pageState.page.conversationId,
      event,
      webContentsId: sender.id,
      windowId: dependencies.normalizeWindowId(browserWindow.id),
    });
  }

  return { dispatchPageEvent };
}

if (typeof module !== "undefined")
  module.exports = {
    SITE_ANNOTATION_FEATURES_CHANGED_EVENT,
    WEBMCP_UI_TOOLS_CHANGED_EVENT,
    siteAnnotationFeaturesChangedSchema,
    normalizeSiteHostname,
    webMcpDescriptorByteSize,
    parseWebMcpToolsChangedEvent,
    createSitePageEventRuntime,
  };
