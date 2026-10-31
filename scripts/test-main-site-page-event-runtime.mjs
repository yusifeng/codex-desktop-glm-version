import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/site-page-event-runtime.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const runtimeModule = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);
const {
  SITE_ANNOTATION_FEATURES_CHANGED_EVENT,
  WEBMCP_UI_TOOLS_CHANGED_EVENT,
  siteAnnotationFeaturesChangedSchema,
  normalizeSiteHostname,
  webMcpDescriptorByteSize,
  parseWebMcpToolsChangedEvent,
  createSitePageEventRuntime,
} = runtimeModule;

equal(normalizeSiteHostname("https://Example.test./path"), "example.test");
equal(normalizeSiteHostname("http://localhost:3000"), "localhost");
equal(normalizeSiteHostname("file:///tmp/page.html"), null);
equal(normalizeSiteHostname("not a URL"), null);
equal(webMcpDescriptorByteSize([{ name: "工具" }]), Buffer.byteLength(JSON.stringify([{ name: "工具" }])));

const annotationEvent = {
  ...SITE_ANNOTATION_FEATURES_CHANGED_EVENT,
  payload: { features: ["containers", "metadata", "requests"] },
};
equal(siteAnnotationFeaturesChangedSchema.safeParse(annotationEvent).success, true);
equal(
  siteAnnotationFeaturesChangedSchema.safeParse({
    ...annotationEvent,
    payload: { features: ["metadata", "metadata-with-targets"] },
  }).success,
  false,
);
equal(
  siteAnnotationFeaturesChangedSchema.safeParse({
    ...annotationEvent,
    payload: { features: ["requests", "requests-with-prompts"] },
  }).success,
  false,
);
equal(
  siteAnnotationFeaturesChangedSchema.safeParse({
    ...annotationEvent,
    payload: { features: ["containers", "controls", "surfaces", "metadata", "mode-toggle", "requests", "requests"] },
  }).success,
  false,
);

const tool = {
  name: "search",
  title: "",
  description: "Search the site",
  inputSchema: { type: "object" },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  origin: "https://example.test",
  pageUrl: "https://example.test/page",
};
const toolEvent = { ...WEBMCP_UI_TOOLS_CHANGED_EVENT, payload: { tools: [tool] } };
const parsedToolEvent = parseWebMcpToolsChangedEvent(toolEvent, {
  maxTools: 2,
  maxTotalDescriptorBytes: 10_000,
});
equal(parsedToolEvent.payload.tools, [
  {
    annotations: { readOnlyHint: true },
    description: "Search the site",
    inputSchema: { type: "object" },
    name: "search",
    title: undefined,
  },
]);
equal(parseWebMcpToolsChangedEvent({ ...toolEvent, version: 2 }, { maxTools: 2, maxTotalDescriptorBytes: 10_000 }), null);
equal(parseWebMcpToolsChangedEvent(toolEvent, { maxTools: 0, maxTotalDescriptorBytes: 10_000 }), null);
equal(parseWebMcpToolsChangedEvent({ ...toolEvent, payload: { tools: [{ ...tool, name: "" }] } }, { maxTools: 2, maxTotalDescriptorBytes: 10_000 }), null);
equal(parseWebMcpToolsChangedEvent(toolEvent, { maxTools: 2, maxTotalDescriptorBytes: 1 }), null);
equal(
  parseWebMcpToolsChangedEvent(
    { ...toolEvent, payload: { tools: [{ ...tool, inputSchema: 4 }] } },
    { maxTools: 2, maxTotalDescriptorBytes: 10_000 },
  ).payload.tools[0].inputSchema,
  undefined,
);
equal(
  parseWebMcpToolsChangedEvent(
    { ...toolEvent, payload: { tools: [] } },
    { maxTools: 0, maxTotalDescriptorBytes: 0 },
  ).payload.tools,
  [],
);
const cyclic = {};
cyclic.self = cyclic;
equal(
  parseWebMcpToolsChangedEvent(
    { ...toolEvent, payload: { tools: [{ ...tool, inputSchema: cyclic }] } },
    { maxTools: 2, maxTotalDescriptorBytes: 10_000 },
  ),
  null,
);

const appliedTools = [];
const syncs = [];
const forwarded = [];
const annotationEvents = [];
let featureFlags = { webMcp: true, webMcpMaxTools: 2 };
let browserWindow = { id: 91, isDestroyed: () => false };
let applyChanged = true;
const runtime = createSitePageEventRuntime({
  browserWindowFromWebContents: () => browserWindow,
  getFeatureFlags: () => featureFlags,
  maxTotalDescriptorBytes: 10_000,
  isWebMcpEnabled: (flag) => flag === true,
  applyWebMcpTools: (_page, tools) => {
    appliedTools.push(tools);
    return applyChanged;
  },
  normalizeWindowId: (id) => `window:${id}`,
});
const pageState = {
  page: { conversationId: "conversation-1" },
  threadState: { id: "thread-1" },
  windowState: { owner: { id: 7 } },
};
const dispatch = (event, override = {}) => runtime.dispatchPageEvent({
  sender: { id: 44 },
  pageState,
  event,
  siteAnnotationFeatures: { handlePageEvent: (...args) => annotationEvents.push(args) },
  browserSessionRegistry: { notifyPageEvent: (value) => forwarded.push(value) },
  syncThreadState: (...args) => syncs.push(args),
  ...override,
});

dispatch(annotationEvent);
equal(annotationEvents, [[pageState, annotationEvent]]);
dispatch(toolEvent);
equal(appliedTools[0][0].name, "search");
equal(syncs.length, 1);
featureFlags = { webMcp: false, webMcpMaxTools: 2 };
dispatch(toolEvent);
equal(appliedTools[1], []);
applyChanged = false;
dispatch(toolEvent);
equal(syncs.length, 2);
dispatch({ type: "page-ready", payload: { ready: true } });
equal(forwarded, [{
  conversationId: "conversation-1",
  event: { type: "page-ready", payload: { ready: true } },
  webContentsId: 44,
  windowId: "window:91",
}]);
dispatch({ ...toolEvent, payload: { tools: [{ ...tool, name: "" }] } });
equal(forwarded.length, 1);
equal(appliedTools.length, 3);
browserWindow = { id: 91, isDestroyed: () => true };
dispatch({ type: "ignored" });
equal(forwarded.length, 1);
dispatch({ type: "ignored" }, { pageState: null });
equal(forwarded.length, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/site-page-event-runtime.js")'), true);
for (const oldOwner of ["function QHe(", "function yZ(", "function MZe(", "function FZe(", "function IZe("]) {
  equal(main.includes(oldOwner), false);
}
equal(main.includes("dispatchPageEvent: dispatchSitePageEvent"), true);
equal(main.includes("WEBMCP_UI_TOOLS_CHANGED_EVENT.type"), true);
equal(main.includes("SITE_ANNOTATION_FEATURES_CHANGED_EVENT.type"), true);

console.log(`${assertions} main site page-event runtime assertions passed`);
