import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
};

async function load(relativePath, requireStub = () => { throw new Error("unexpected require"); }) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", output.code)(requireStub, module, module.exports);
  return module.exports;
}

const deferred = await load("../src/main/main-app/startup/deferred-startup-work.ts");
const ambient = await load("../src/main/main-app/ambient-suggestions/runtime.ts");
const modelRouting = await load("../src/main/main-app/misc/model-routing.ts", (specifier) => {
  equal(specifier, "@chunk/shared");
  return {
    Cd: (value) => ({ parsed: value }),
    Sd: { fallback: true },
  };
});

equal(deferred.DEFAULT_DEFERRED_STARTUP_FALLBACK_MS, 10_000);
equal(await modelRouting.resolveAutomationModelRouting({
  getClient: () => ({ getDynamicConfig: () => ({ value: "remote" }) }),
}), { parsed: "remote" });
equal(await modelRouting.resolveAutomationModelRouting({ getClient: () => { throw new Error("offline"); } }), { fallback: true });

let resolvePrimary;
let resolveFallback;
const phasePromises = {
  primary: new Promise((resolve) => { resolvePrimary = resolve; }),
  fallback: new Promise((resolve) => { resolveFallback = resolve; }),
};
let starts = 0;
const deferredErrors = [];
const scheduled = deferred.scheduleDeferredStartupWork({
  startupPhases: { whenReached: (phase) => phasePromises[phase] },
  phase: "primary",
  fallback: { phase: "fallback", timeoutMs: 0 },
  start: () => { starts += 1; },
  onError: (error) => deferredErrors.push(error),
});
resolveFallback();
await new Promise((resolve) => setTimeout(resolve, 5));
resolvePrimary();
await Promise.resolve();
equal(starts, 1, "fallback and primary phase share a once gate");
equal(deferredErrors, []);
scheduled.dispose();

let canceledStarts = 0;
let canceledResolve;
const canceled = deferred.scheduleDeferredStartupWork({
  startupPhases: { whenReached: () => new Promise((resolve) => { canceledResolve = resolve; }) },
  phase: "primary",
  start: () => { canceledStarts += 1; },
  onError: () => { throw new Error("abort must be ignored"); },
});
canceled.dispose();
canceledResolve();
await Promise.resolve();
equal(canceledStarts, 0);

let availability = {
  ambientSuggestions: true,
  ambientSuggestionsFeatureDiscovery: true,
  ambientSuggestionsStaleTimeMs: 500,
  computerUse: true,
  noPluginListPhase2: true,
};
let access = { status: "loading" };
let selectedProject = { rootPaths: ["/workspace"] };
let generatedAtMs = null;
let now = 1_000;
let accountEligible = true;
let generationResolve;
const generations = [];
const warnings = [];
const scheduledBackground = [];
const subscriptions = [];
const dependencies = {
  getDesktopFeatureAvailability: () => availability,
  getDesktopAccessState: () => access,
  isEligibleAccount: () => accountEligible,
  enabledSettingKey: "ambient-enabled",
  conversationDetailModeSettingKey: "detail-mode",
  shouldNormalizeDesktopPaths: () => true,
  normalizeDesktopPath: (value, enabled) => enabled ? `desktop:${value}` : value,
  normalizePath: (value) => `normalized:${value}`,
  firstWorkspaceRoot: (roots) => roots?.[0] ?? null,
  getSelectedLocalProject: () => selectedProject,
  homeDirectory: () => "/home/me",
  readAmbientSuggestions: () => ({ generatedAtMs }),
  generateAmbientSuggestions: (input) => {
    generations.push(input);
    return new Promise((resolve) => { generationResolve = resolve; });
  },
  resolveModelRouting: async () => ({ ambientSuggestionsModel: "model" }),
  scheduleDeferredStartupWork: (input) => {
    const record = { input, disposed: false };
    scheduledBackground.push(record);
    return { dispose: () => { record.disposed = true; } };
  },
  deferredStartupFallbackMs: 10_000,
  createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
  now: () => now,
};
const runtime = ambient.createAmbientSuggestionsRuntime(dependencies);
const settings = {
  getEffective(key) {
    return key === "ambient-enabled" ? true : "STEPS_PROSE";
  },
};

equal(runtime.isAmbientSuggestionsEnabled(settings), true);
equal(runtime.resolveAmbientSuggestionsSurface(settings), "chatgpt_work");
access = { status: "ready", codexLocalAccess: true, workCloudAccess: false, workLocalAccess: false };
equal(runtime.resolveAmbientSuggestionsSurface(settings), "codex");
access = { status: "ready", codexLocalAccess: false, workCloudAccess: true, workLocalAccess: false };
equal(runtime.resolveAmbientSuggestionsSurface(settings), "chatgpt_work");

const connection = { getAccount: async () => ({ account: { id: "account" } }) };
equal(await runtime.getAmbientSuggestionsEligibility({ appServerConnection: connection, settingsStore: settings }), {
  enabled: true,
  computerUseAvailable: true,
  featureDiscoveryEnabled: true,
  staleTimeMs: 500,
});
accountEligible = false;
equal(await runtime.getAmbientSuggestionsEligibility({ appServerConnection: connection, settingsStore: settings }), { enabled: false });
accountEligible = true;

let backgroundReady = true;
const events = {
  subscribe(listener) {
    subscriptions.push(listener);
    return { dispose: () => subscriptions.splice(subscriptions.indexOf(listener), 1) };
  },
};
const lifecycle = runtime.createAmbientSuggestionsBackgroundRefresh({
  appEvent: events,
  appServerClient: { hostConfig: { id: "local" } },
  appServerConnectionRegistry: { getConnection: () => connection },
  globalState: {},
  settingsStore: settings,
  startupPhases: { hasReached: () => backgroundReady },
  statsig: {},
});
equal(subscriptions.length, 1);
subscriptions[0]({ type: "background" });
subscriptions[0]({ type: "background" });
await new Promise((resolve) => setImmediate(resolve));
equal(generations.length, 1, "same project refresh is single-flight");
equal(generations[0].projectRoot, "normalized:desktop:/workspace");
equal(generations[0].isProjectlessChat, false);
equal(generations[0].modelRouting, { ambientSuggestionsModel: "model" });
equal(generations[0].usePluginDetailReads, true);
generationResolve();
await new Promise((resolve) => setImmediate(resolve));

generatedAtMs = 900;
subscriptions[0]({ type: "background" });
await new Promise((resolve) => setImmediate(resolve));
equal(generations.length, 1, "fresh suggestions skip generation");

generatedAtMs = null;
selectedProject = null;
backgroundReady = false;
subscriptions[0]({ type: "background" });
equal(scheduledBackground.length, 1);
equal(scheduledBackground[0].input.phase, "background_ready");
equal(scheduledBackground[0].input.fallback, { phase: "renderer_ready", timeoutMs: 10_000 });
subscriptions[0]({ type: "foreground" });
equal(scheduledBackground[0].disposed, true);

subscriptions[0]({ type: "background" });
scheduledBackground[1].input.start();
await new Promise((resolve) => setImmediate(resolve));
equal(generations.at(-1).projectRoot, "normalized:desktop:/home/me");
equal(generations.at(-1).isProjectlessChat, true);
generationResolve();
await new Promise((resolve) => setImmediate(resolve));
lifecycle.dispose();
equal(subscriptions.length, 0);
equal(warnings.length, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/misc/model-routing.js")'), true);
equal(main.includes('require("./main-app/startup/deferred-startup-work.js")'), true);
equal(main.includes('require("./main-app/ambient-suggestions/runtime.js")'), true);
equal(main.includes("createAmbientSuggestionsRuntime({"), true);
for (const generatedName of ["Ln", "Br", "Vr", "Fte", "Hr", "Ite", "Wr"]) {
  equal(new RegExp(`^(?:async )?function ${generatedName}\\(`, "m").test(main), false);
}
equal(/^var Ur = /m.test(main), false);

console.log(`${assertions} ambient suggestions runtime assertions passed`);
