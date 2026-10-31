import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/misc/primary-runtime-installer.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createPrimaryRuntimeInstaller } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

function fixture(overrides = {}) {
  const logs = [];
  const fsCalls = [];
  const reconciles = [];
  const activations = [];
  const runtimeRoots = [];
  const diagnoses = [];
  const reports = [];
  const requests = [];
  let id = 0;
  let clock = 1000;
  const stats = new Map();
  const runtime = {
    Df: () => ({
      safeParse: (value) => ({
        success: value != null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0,
      }),
    }),
    wf: () => ({
      safeParse: (value) => ({
        success: value?.features != null,
        data: value,
      }),
    }),
    gf: () => ({}),
    ec: "workspace_dependencies",
    yn: "primary-runtime",
    Ka: { channel: "default" },
    bn: () => ({ platform: "darwin", arch: "arm64" }),
    An: async () => { throw Error("install implementation required"); },
    Dn: (_error, context) => ({
      bundleVersion: context.bundleVersion ?? null,
      errorCategory: "network",
      errorCode: "E_TEST",
      failureStage: context.failureStage,
      retryable: true,
    }),
    jn: (value) => runtimeRoots.push(value),
    async wn(options) {
      diagnoses.push(options);
      return {
        artifactToolVersion: "1",
        bundleVersion: "bundle-1",
        installed: true,
        instructions: "Use bundled tools",
        libreOfficeVersion: "2",
        problems: [],
      };
    },
    async Sn() { return null; },
    kn: () => ({ runtimeSource: "host", runtimeRoot: "/runtime" }),
  };
  const buildRuntime = {
    in: {
      resolve: () => "production",
      isInternal: (value) => value === "internal",
    },
    t: () => false,
    i: () => false,
    c: (error) => ({ classified: error instanceof Error ? error.message : String(error) }),
    r: async () => {},
    o: (value) => activations.push(value),
    async n() {},
  };
  const fs = {
    async mkdir(...args) { fsCalls.push(["mkdir", ...args]); },
    async cp(...args) { fsCalls.push(["cp", ...args]); },
    async rm(...args) { fsCalls.push(["rm", ...args]); },
    async rename(...args) { fsCalls.push(["rename", ...args]); },
    async lstat(value) {
      return stats.get(value) ?? { isSymbolicLink: () => false, isFile: () => true };
    },
    async stat(value) {
      const stat = stats.get(value);
      if (stat instanceof Error) throw stat;
      if (stat) return stat;
      const error = Error("missing");
      error.code = "ENOENT";
      throw error;
    },
  };
  const makeLogger = (name) => ({
    info: (event, payload) => logs.push({ name, level: "info", event, payload }),
    warning: (event, payload) => logs.push({ name, level: "warning", event, payload }),
    error: (event, payload) => logs.push({ name, level: "error", event, payload }),
  });
  const connection = {
    async sendAppServerRequest(method, params) {
      requests.push({ method, params });
      if (method === "experimentalFeature/list")
        return { data: [{ name: "workspace_dependencies", enabled: true }], nextCursor: null };
      return {};
    },
    async codexHome() { return "/codex"; },
  };
  const dependencies = {
    runtime,
    logger: {
      i: (name) => () => makeLogger(name),
      r: (name) => makeLogger(name),
    },
    electron: { net: { fetch: async () => ({ ok: true }) } },
    buildRuntime,
    path,
    fs,
    os: { homedir: () => "/home/me", release: () => "test-release" },
    processRef: {
      arch: "arm64",
      platform: "darwin",
      resourcesPath: "/resources",
      env: {},
    },
    resolveElectronResourcesPath: () => "/resources",
    async reconcileMarketplaceRoot(options) { reconciles.push(options); return true; },
    randomUUID: () => `id-${++id}`,
    now: () => ++clock,
    ...overrides,
  };
  if (overrides.runtime) dependencies.runtime = { ...runtime, ...overrides.runtime };
  if (overrides.buildRuntime) dependencies.buildRuntime = { ...buildRuntime, ...overrides.buildRuntime };
  return {
    connection,
    dependencies,
    state: { activations, diagnoses, fsCalls, logs, reconciles, reports, requests, runtimeRoots, stats },
  };
}

const base = fixture();
const runtime = createPrimaryRuntimeInstaller(base.dependencies);
equal(runtime.updateIntervalMs, 3600000, "update interval remains one hour");
equal(runtime.retryIntervalMs, 30000, "restore retry interval remains thirty seconds");
equal(runtime.getActiveInstallCount(), 0, "installer starts without active operations");
equal(runtime.toolFailure("nope"), {
  contentItems: [{ type: "inputText", text: "nope" }],
  success: false,
}, "dependency tool failure shape is stable");

equal(await runtime.executeDependencyTool({ hostId: "remote", argumentsValue: {} }, async () => null), {
  contentItems: [{ type: "inputText", text: "Workspace dependency tools are only supported for local threads." }],
  success: false,
}, "dependency tool rejects remote hosts");
equal(await runtime.executeDependencyTool({ hostId: "local", argumentsValue: { extra: true } }, async () => null), {
  contentItems: [{ type: "inputText", text: "load_workspace_dependencies takes no arguments." }],
  success: false,
}, "dependency tool rejects arguments");
equal((await runtime.executeDependencyTool({ hostId: "local", argumentsValue: {} }, async () => null)).success, false, "dependency tool reports disabled runtime");
equal((await runtime.executeDependencyTool({ hostId: "local", argumentsValue: {} }, async () => ({ installed: false }))).success, false, "dependency tool reports unavailable runtime");
const availableTool = await runtime.executeDependencyTool(
  { hostId: "local", argumentsValue: {} },
  async () => ({ installed: true, instructions: "Run tool", bundleVersion: "b1" }),
);
equal(availableTool.success, true, "dependency tool returns successful content");
ok(availableTool.contentItems[0].text.includes("Run tool"), "dependency tool includes runtime instructions");
equal((await runtime.executeDependencyTool(
  { hostId: "local", argumentsValue: {} },
  async () => { throw Error("load failed"); },
)).success, false, "dependency tool converts load errors to tool failure");
ok(base.state.logs.some((entry) => entry.event === "primary_runtime_dependency_tool_outcome"), "dependency tool logs outcomes");

equal(runtime.isFeatureEnabled({ features: { workspace_dependencies: true } }), true, "feature projection accepts enabled workspace dependencies");
equal(runtime.isFeatureEnabled({ features: { workspace_dependencies: false } }), false, "feature projection rejects disabled workspace dependencies");
equal(runtime.isFeatureEnabled(null), false, "feature projection rejects invalid payload");
equal(await runtime.readFeatureEnabled(base.connection), true, "feature reader detects enabled app-server feature");
equal(base.state.requests[0], {
  method: "experimentalFeature/list",
  params: { cursor: null, limit: 100 },
}, "feature reader starts paginated request at null cursor");

equal(runtime.getWindowsRelease(), "latest", "external builds use latest Windows release");
equal(runtime.requiresWindowsFramework({ platform: "win32", arch: "x64" }, "latest"), false, "disabled framework gate does not require framework");
equal(runtime.pathIsWithin("/root/skills/a", "/root/skills"), true, "path containment accepts descendants");
equal(runtime.pathIsWithin("/root/skills", "/root/skills"), false, "path containment rejects root itself");
equal(runtime.pathIsWithin("/root/other", "/root/skills"), false, "path containment rejects siblings");
equal(runtime.resolveRemovedSkillPath({ skillDir: "legacy", skillsRoot: "/root/skills" }), "/root/skills/legacy", "removed skill path resolves within root");
assert.throws(
  () => runtime.resolveRemovedSkillPath({ skillDir: "../outside", skillsRoot: "/root/skills" }),
  /must stay within/,
);
assertions += 1;

base.state.stats.set("/codex/skills/legacy", { isDirectory: () => true });
await runtime.removeLegacySkills({ codexHome: "/codex", skillsToRemove: ["legacy", "missing"] });
ok(base.state.fsCalls.some(([kind, from]) => kind === "rename" && from === "/codex/skills/legacy"), "legacy skill is moved to backup");
ok(base.state.logs.some((entry) => entry.event === "primary_runtime_legacy_skill_migrated"), "legacy skill migration is logged");

const signal = new AbortController().signal;
await runtime.syncSkills(base.connection, {
  skillsToRemove: [],
  bundledSkillPaths: ["/bundle/skill-a/SKILL.md"],
}, signal);
ok(base.state.fsCalls.some(([kind, target]) => kind === "rm" && target === "/codex/skills/primary-runtime"), "skill sync replaces runtime skill root");
ok(base.state.fsCalls.some(([kind, source, target]) =>
  kind === "cp" && source === "/bundle/skill-a" && target === "/codex/skills/primary-runtime/skill-a"), "skill sync copies each bundled skill directory");

await runtime.syncPluginMarketplaces(base.connection, {
  bundledPluginMarketplacePaths: ["/bundle/plugins"],
}, false, signal);
equal(base.state.reconciles.at(-1).marketplaceRoot, "/bundle/plugins", "plugin sync uses source marketplace without framework copy");
equal(typeof base.state.reconciles.at(-1).beforeSendRequest, "function", "plugin sync supplies abort guard");

const copiedMarketplace = await runtime.copySafePluginMarketplace("/bundle/marketplace", signal);
ok(copiedMarketplace.includes("/.cache/codex-runtimes/primary-runtime/plugins/marketplace"), "framework marketplace copy uses isolated runtime cache");
const marketplaceCopy = base.state.fsCalls.find(([kind, source]) => kind === "cp" && source === "/bundle/marketplace");
equal(typeof marketplaceCopy[3].filter, "function", "marketplace copy installs safety filter");
base.state.stats.set("/bundle/marketplace/tool.exe", { isSymbolicLink: () => false, isFile: () => true });
equal(await marketplaceCopy[3].filter("/bundle/marketplace/tool.exe"), false, "marketplace copy rejects executable payloads");
base.state.stats.set("/bundle/marketplace/readme.md", { isSymbolicLink: () => false, isFile: () => true });
equal(await marketplaceCopy[3].filter("/bundle/marketplace/readme.md"), true, "marketplace copy accepts ordinary files");

const progress = [];
const installCalls = [];
const errorReporter = { reportNonFatal: (...args) => base.state.reports.push(args) };
const installResult = {
  bundleVersion: "bundle-2",
  frameworkRoot: null,
  paths: {
    binPath: "/runtime/bin/tool",
    bundledPluginMarketplacePaths: [],
    bundledSkillPaths: [],
    skillsToRemove: [],
  },
  status: "installed",
};
const result = await runtime.installRuntime({
  connection: base.connection,
  errorReporter,
  installRuntime: async (target, options, release, installOptions) => {
    installCalls.push({ target, options, release, installOptions });
    installOptions.onProgress({ phase: "downloading", downloadedBytes: 5 });
    return installResult;
  },
  onProgress: (value) => progress.push(value),
  release: "latest",
  runtimeConfig: { runtimes: { "primary-runtime": { channel: "configured" } } },
});
equal(result, { bundleVersion: "bundle-2", status: "installed" }, "install returns stable bundle projection");
equal(installCalls.length, 1, "install implementation runs once");
equal(installCalls[0].options, { channel: "configured" }, "install receives configured runtime options");
ok(/^id-\d+$/.test(installCalls[0].installOptions.bundleOperationId), "install receives stable bundle operation id");
equal(progress.map((value) => value.phase), ["downloading", "configuring", "ready"], "install progress preserves download-configure-ready order");
equal(progress[0].errorMessage, null, "installer normalizes progress error message");
equal(progress[0].release, "latest", "installer attaches release to progress");
equal(base.state.diagnoses.at(-1).probeExecutables, true, "installed payload is validated with executable probes");
ok(base.state.requests.some(({ method, params }) => method === "skills/list" && params.forceReload), "successful install reloads skills");
ok(base.state.logs.some((entry) => entry.event === "primary_runtime_install_finished"), "successful install logs finished event");
ok(base.state.logs.some((entry) => entry.event === "primary_runtime_install_call_outcome" && entry.payload.safe.outcome === "installed"), "successful install logs call outcome");
equal(runtime.getActiveInstallCount(), 0, "successful operation leaves no active install");

const bundleFailure = fixture();
const bundleFailureRuntime = createPrimaryRuntimeInstaller(bundleFailure.dependencies);
const bundleFailureProgress = [];
await assert.rejects(() => bundleFailureRuntime.installRuntime({
  connection: bundleFailure.connection,
  errorReporter: { reportNonFatal: (...args) => bundleFailure.state.reports.push(args) },
  installRuntime: async () => { throw Error("download failed"); },
  onProgress: (value) => bundleFailureProgress.push(value),
  release: "latest",
}), /download failed/);
assertions += 1;
equal(bundleFailureProgress.map(({ phase }) => phase), ["error"], "bundle failure emits one error progress event");
equal(bundleFailure.state.reports.length, 1, "bundle failure reports nonfatal error");
ok(bundleFailure.state.logs.some((entry) =>
  entry.event === "primary_runtime_install_call_outcome" &&
  entry.payload.safe.failureDomain === "bundle" &&
  entry.payload.safe.outcome === "failed"), "bundle failure logs bundle domain and failed outcome");

const postFailure = fixture({
  async reconcileMarketplaceRoot() { return false; },
});
const postFailureRuntime = createPrimaryRuntimeInstaller(postFailure.dependencies);
const postFailureProgress = [];
await assert.rejects(() => postFailureRuntime.installRuntime({
  connection: postFailure.connection,
  errorReporter: { reportNonFatal: (...args) => postFailure.state.reports.push(args) },
  installRuntime: async () => ({
    ...installResult,
    paths: { ...installResult.paths, bundledPluginMarketplacePaths: ["/bad-marketplace"] },
  }),
  onProgress: (value) => postFailureProgress.push(value),
  release: "latest",
}), /Failed to sync/);
assertions += 1;
equal(postFailureProgress.map(({ phase }) => phase), ["configuring", "error"], "post-install failure preserves configuring-error order");
ok(postFailure.state.logs.some((entry) =>
  entry.event === "primary_runtime_install_call_outcome" &&
  entry.payload.safe.failureDomain === "post_install" &&
  entry.payload.safe.failureStage === "sync_plugins"), "post-install failure records active stage");

const activationFixture = fixture({
  buildRuntime: {
    in: { resolve: () => "internal", isInternal: () => true },
    t: () => true,
    i: () => true,
  },
});
const activationRuntime = createPrimaryRuntimeInstaller(activationFixture.dependencies);
await activationRuntime.installRuntime({
  connection: activationFixture.connection,
  errorReporter: { reportNonFatal() {} },
  installRuntime: async () => ({ ...installResult, frameworkRoot: "/framework" }),
  release: "latest-alpha",
});
equal(activationFixture.state.activations, ["/framework"], "framework install activates build runtime before completion");
equal(activationFixture.state.runtimeRoots, ["/framework"], "framework install updates primary runtime root");

let releaseDeferred;
const deferred = new Promise((resolve) => { releaseDeferred = resolve; });
let sharedCalls = 0;
const sharedOptions = {
  connection: base.connection,
  requireWindowsFramework: false,
  forceReinstall: false,
  getInternalUpdateCdnRequestHeaders: () => ({}),
  installRuntime: async () => { sharedCalls += 1; return deferred; },
  onProgress: () => {},
  release: "shared",
  runtimeOptions: {},
  target: { platform: "darwin", arch: "arm64" },
  trigger: "manual_install",
};
let firstId;
let secondId;
const firstOperation = runtime.startInstallOperation({ ...sharedOptions, onBundleOperationId: (value) => { firstId = value; } });
const secondOperation = runtime.startInstallOperation({ ...sharedOptions, onBundleOperationId: (value) => { secondId = value; } });
equal(firstOperation, secondOperation, "identical install requests share one operation");
equal(firstId, secondId, "single-flight callers receive same bundle operation id");
releaseDeferred({ ...installResult, status: "already-current" });
await firstOperation.postInstallPromise;
equal(sharedCalls, 1, "single-flight invokes installer only once");

const cancelFixture = fixture();
const cancelRuntime = createPrimaryRuntimeInstaller(cancelFixture.dependencies);
let capturedSignal;
const cancelOperation = cancelRuntime.startInstallOperation({
  ...sharedOptions,
  connection: cancelFixture.connection,
  installRuntime: async (_target, _options, _release, installOptions) => {
    capturedSignal = installOptions.signal;
    await new Promise((_, reject) => installOptions.signal.addEventListener("abort", () => {
      const error = Error("aborted");
      error.name = "AbortError";
      reject(error);
    }));
  },
  onBundleOperationId: () => {},
});
await new Promise((resolve) => setImmediate(resolve));
equal(cancelRuntime.cancelInstalls(), true, "cancel aborts active install");
equal(capturedSignal.aborted, true, "cancel propagates AbortSignal");
await assert.rejects(cancelOperation.promise, /aborted/);
assertions += 1;
await assert.rejects(cancelOperation.postInstallPromise, /aborted/);
assertions += 1;

const diagnoseFixture = fixture({
  buildRuntime: {
    in: { resolve: () => "internal", isInternal: () => true },
  },
  processRef: {
    arch: "arm64",
    platform: "darwin",
    resourcesPath: "/resources",
    env: {},
  },
});
const diagnoseRuntime = createPrimaryRuntimeInstaller(diagnoseFixture.dependencies);
const diagnosis = await diagnoseRuntime.diagnoseRuntime({ hostId: "local", probeExecutables: false });
equal(diagnosis.installed, true, "diagnostics return runtime result");
equal(diagnoseFixture.state.diagnoses.at(-1).preferredGitPath, "/resources/git/bin/git", "internal macOS diagnostics prefer bundled Git");
equal((await diagnoseRuntime.readDependencies({ hostId: "local" })).instructions, "Use bundled tools", "dependency read exposes instructions only when installed");

const frameworkFixture = fixture({
  buildRuntime: {
    in: { resolve: () => "internal", isInternal: () => true },
    t: () => true,
    i: () => true,
    async n() {},
  },
  runtime: {
    async Sn() { return null; },
  },
});
const frameworkRuntime = createPrimaryRuntimeInstaller(frameworkFixture.dependencies);
equal(frameworkRuntime.getWindowsRelease(), "latest-alpha", "internal builds use alpha Windows release");
equal(frameworkRuntime.requiresWindowsFramework({ platform: "win32", arch: "x64" }, "latest-alpha"), true, "eligible gated Windows target requires framework");
await frameworkRuntime.restoreRuntime(frameworkFixture.connection, new AbortController().signal);
ok(frameworkFixture.state.logs.some((entry) => entry.event === "primary_runtime_selection"), "restore without cached paths logs runtime selection");

runtime.assertLocalHost("local");
assert.throws(() => runtime.assertLocalHost("remote"), /only supports the local host/);
assertions += 1;
equal(runtime.isAbortError(Object.assign(Error("operation aborted"), { name: "Error" })), true, "abort classifier accepts aborted message");
equal(runtime.isAbortError(Error("failure")), false, "abort classifier rejects ordinary errors");

ok(assertions >= 55, "primary runtime installer owner has broad tool, feature, sync, install, cancel, restore, and diagnosis coverage");
console.log(`${assertions} main primary runtime installer owner assertions passed`);
