import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__pullRequestRevisionCoreTest = {
  derivedFamilies: [],
  initialized: [],
  queryFamilies: [],
  requests: [],
  warnings: [],
});
state.jsxRuntime = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ key, props, type }),
  jsxs: (type, props, key) => ({ key, props, type }),
};

function appSharedMock() {
  return `
    export const Q3 = { warning: (message, details) => globalThis.__pullRequestRevisionCoreTest.warnings.push({ message, details }) };
    export const Z3 = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("query-runtime");
    export const FX = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("signal-runtime");
    export const QI = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("scope-runtime");
    export const ZI = { id: "app-scope" };
    export const rZ = (scope, factory) => { const value = { kind: "derived", scope, factory }; globalThis.__pullRequestRevisionCoreTest.derivedFamilies.push(value); return value; };
    export const QX = (scope, factory) => { const value = { kind: "query", scope, factory }; globalThis.__pullRequestRevisionCoreTest.queryFamilies.push(value); return value; };
    export const $3 = () => {};
    export const I3 = () => globalThis.__pullRequestRevisionCoreTest.jsxRuntime;
    export const K2 = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("messages");
    export const Lo = "FailureIcon"; export const Ro = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("failure-icon");
    export const Tc = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("success-icon");
    export const Y2 = "FormattedMessage"; export const e6 = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("react");
    export const h4 = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("styles");
    export const m4 = (...values) => values.filter(Boolean).join(" "); export const wc = "SuccessIcon";
    export const If = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("menu");
    export const Yh = "Button"; export const Zh = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("button");
    export const iy = "CheckIcon"; export const jf = { ItemIcon: "MenuItemIcon" }; export const kf = "DropdownMenu";
    export const lw = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("browser-icons");
    export const sy = "ChevronDownIcon";
  `;
}

function appInitialMock() {
  return `
    export const $ln = (key, parameters) => [key, parameters];
    export const Gy = { id: "cli-availability" }; export const gy = { id: "current-user" };
    export const Xy = async (method, parameters, options) => { globalThis.__pullRequestRevisionCoreTest.requests.push({ method, parameters, options }); return { method, parameters }; };
    export const t5t = account => account?.login ?? null;
    ${["Yy", "i5t", "nrn", "nun", "qy", "yy"].map(name => `export const ${name} = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("${name}");`).join("\n")}
    export const $v = "NoChecksIcon"; export const Vg = "EmptyChecksRingIcon";
    export const Hg = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("check-icons");
    export const ey = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("checks");
    export const dat = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("diff-stats");
    export const uat = "DiffStats";
  `;
}

function mockChunk(name) {
  if (name === "app-shared") return appSharedMock();
  if (name === "app-initial") return appInitialMock();
  if (name === "full-content-metadata")
    return `
      export const r = () => globalThis.__pullRequestRevisionCoreTest.initialized.push("full-metadata");
      export const t = (metadata, deletionLines, additionLines) => metadata.reject ? null : ({ ...metadata, deletionLines, additionLines, isPartial: false });
    `;
  return "export const sideEffect = true;";
}

async function bundle(directory, { mockChunks = true } = {}) {
  const plugins = mockChunks
    ? [{
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({ contents: mockChunk(importPath), loader: "js" }),
          );
        },
      }]
    : [];
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins,
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

const metadata = await bundle("full-content-metadata");
assert.deepEqual(metadata.n(), { type: "success", lines: [] });
metadata.r();
assert.equal(state.initialized.includes("query-runtime"), true);
const partial = {
  name: "src/a.ts",
  cacheKey: "diff-1",
  prevObjectId: "old",
  newObjectId: "new",
  deletionLines: ["old\n"],
  additionLines: ["new\n"],
  hunks: [{
    additionStart: 2, deletionStart: 2, additionCount: 1, deletionCount: 1,
    splitLineCount: 2, unifiedLineCount: 2,
    hunkContent: [
      { type: "deletion", additions: 0, deletions: 1, lines: 0, additionLineIndex: 0, deletionLineIndex: 0 },
      { type: "addition", additions: 1, deletions: 0, lines: 0, additionLineIndex: 0, deletionLineIndex: 1 },
    ],
  }],
};
const full = metadata.t(partial, ["same\n", "old\n", "tail\n"], ["same\n", "new\n", "tail\n"]);
assert.equal(full.isPartial, false);
assert.equal(full.hunks[0].collapsedBefore, 1);
assert.equal(full.hunks[0].splitLineStart, 1);
assert.equal(full.hunks[0].hunkContent[1].additionLineIndex, 1);
assert.equal(full.splitLineCount, 4);
assert.equal(full.unifiedLineCount, 4);
assert.equal(full.cacheKey, "diff-1:full:old:new");
assert.equal(metadata.t(partial, ["different\n", "old\n"], ["same\n", "new\n"]), null);
assert.equal(state.warnings.at(-1).details.safe.reason, "collapsed_context_mismatch");
const whitespaceFull = metadata.t(partial, [" same \n", "old\n"], ["same\n", "new\n"], { ignoreWhitespace: true });
assert.equal(whitespaceFull.isPartial, false);
assert.equal(metadata.t(partial, ["same\n", "old\n", "extra\n"], ["same\n", "new\n"]), null);
assert.equal(state.warnings.at(-1).details.safe.reason, "trailing_context_line_count_mismatch");

const revisionQueries = await bundle("pull-request-revision-queries-core");
revisionQueries.n();
assert.equal(state.derivedFamilies.length, 1);
assert.equal(state.queryFamilies.length, 3);
const request = { account: { hostId: "local", login: "ada" }, pullRequest: { hostname: "github.com", number: 42 } };
const capability = state.derivedFamilies[0].factory;
assert.equal(capability(request, { get: signal => signal.id === "cli-availability" ? "loading" : null }), "loading");
assert.equal(capability(request, { get: signal => signal.id === "cli-availability" ? "missing" : null }), "cli-required");
assert.equal(capability(request, { get: signal => signal.id === "cli-availability" ? "available" : { isPending: true } }), "loading");
assert.equal(capability(request, { get: signal => signal.id === "cli-availability" ? "available" : { isPending: false, data: { status: "success", account: { login: "ada" } } } }), "available");
assert.equal(capability(request, { get: signal => signal.id === "cli-availability" ? "available" : { isPending: false, data: { status: "success", account: { login: "grace" } } } }), "account-mismatch");
const snapshotOptions = state.queryFamilies[0].factory(request, { get: () => "available" });
assert.equal(snapshotOptions.enabled, true);
assert.deepEqual(snapshotOptions.queryKey, ["gh-pr-review-snapshot", request]);
await snapshotOptions.queryFn({ signal: new AbortController().signal });
assert.equal(state.requests.at(-1).method, "gh-pr-review-snapshot");
const fileOptions = state.queryFamilies[2].factory(request);
assert.equal(fileOptions.enabled, false);
assert.deepEqual(fileOptions.queryKey, ["gh-pr-revision-file", request]);
let refetched = 0;
const scope = {
  query: { getData: () => ({ status: "success", baseContent: "old\n", headContent: "new\n" }) },
  get: () => ({ refetch: async () => { refetched += 1; return { data: { status: "success", baseContent: "fallback", headContent: "fallback" } }; } }),
};
const loader = revisionQueries.t(scope, request, { metadata: { name: "a.ts" }, oldPath: "/dev/null", newPath: "a.ts" });
assert.equal(JSON.parse(loader.key)[0], "gh-pr-revision-file");
assert.equal(JSON.parse(loader.key)[1].basePath, null);
assert.equal(JSON.parse(loader.key)[1].headPath, "a.ts");
const loaded = await loader.load();
assert.equal(loaded.type, "success");
assert.deepEqual(loaded.metadata.deletionLines, ["old\n"]);
assert.equal(refetched, 0);
scope.query.getData = () => ({ status: "error" });
const fallbackLoaded = await loader.load();
assert.equal(fallbackLoaded.type, "success");
assert.equal(refetched, 1);

const checks = await bundle("pull-request-checks-summary");
checks.r();
assert.equal(state.initialized.includes("checks"), true);
const passingIcon = checks.t({ checks: [], ciStatus: "passing" });
assert.equal(passingIcon.type, "SuccessIcon");
assert.equal(passingIcon.props.className.includes("text-chart-green"), true);
const pendingIcon = checks.t({ checks: [], ciStatus: "pending" });
assert.equal(pendingIcon.type, checks.i);
const noneWithChecks = checks.t({ checks: [{ status: "passing" }], ciStatus: "none" });
assert.equal(noneWithChecks.type, "NoChecksIcon");
const ring = checks.t({ checks: [{ status: "passing" }, { status: "failing" }], ciStatus: "pending" });
assert.equal(typeof ring.type, "function");
const ringNode = ring.type(ring.props);
assert.equal(ringNode.type, "svg");
assert.equal(ringNode.props.children.props.children.length, 2);
assert.equal(ringNode.props.children.props.children[0].props.stroke, "var(--color-chart-green)");
assert.equal(ringNode.props.children.props.children[1].props.stroke, "var(--color-chart-red)");
for (const [status, message] of [["failing", "Checks failing"], ["none", "No CI checks"], ["passing", "Checks successful"], ["pending", "Checks pending"]]) {
  const node = checks.n(status);
  assert.equal(node.type, "FormattedMessage");
  assert.equal(node.props.defaultMessage, message);
}

const unavailable = await bundle("revision-review-unavailable-message");
unavailable.o();
assert.equal(state.initialized.includes("diff-stats"), true);
assert.equal(unavailable.r({ additions: 0, deletions: 0, reviewV2Enabled: true }), null);
const stats = unavailable.r({ additions: 3, deletions: 2, reviewV2Enabled: true });
assert.equal(stats.type, "DiffStats");
assert.equal(stats.props.linesAdded, 3);
const item = unavailable.a({ diffStats: { additions: 0, deletions: 0 }, isSelected: true, label: "All changes", showDiffStats: true });
assert.equal(item.type, "span");
assert.equal(item.props.children[0].type, "MenuItemIcon");
assert.equal(item.props.children[2].props.children, "—");
const dropdown = unavailable.i({ children: "items", diffStats: { additions: 1, deletions: 1 }, label: "Commit" });
assert.equal(dropdown.type, "DropdownMenu");
assert.equal(dropdown.props.contentWidth, "menuWide");
assert.equal(dropdown.props.triggerButton.type, "Button");
const intl = { formatMessage: descriptor => descriptor.defaultMessage };
assert.equal(unavailable.t(intl, "available"), undefined);
assert.equal(unavailable.t(intl, "loading"), "Checking review availability…");
assert.equal(unavailable.t(intl, "cli-required").startsWith("Exact-revision review requires GitHub CLI"), true);
assert.equal(unavailable.t(intl, "account-mismatch").startsWith("Exact-revision review requires GitHub CLI"), true);

console.log("pull request revision core assertions passed");
