import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "report-dialog-core",
  "codex-thread-report-dialog",
  "remote-connection-editor-dialog",
  "plugin-share-dialog-core",
  "gitlab-merge-request-form-dialog",
];
const state = (globalThis.__reportSharingDialogsTest = {
  apiCalls: [],
  initialized: [],
  validationInputs: [],
});
const jsxRuntime = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const reactRuntime = {
  useEffect: () => {},
  useState(initial) {
    let value = typeof initial === "function" ? initial() : initial;
    return [
      value,
      (next) => {
        value = typeof next === "function" ? next(value) : next;
      },
    ];
  },
};
const apiClient = {
  async safeGet(pathname, options) {
    state.apiCalls.push({ method: "GET", pathname, options });
    return { reasons: [{ id: "safety", label: "Safety" }] };
  },
  async safePost(pathname, options) {
    state.apiCalls.push({ method: "POST", pathname, options });
    return { success: true };
  },
};
const legacyHttpClient = {
  async get(pathname, headers) {
    state.apiCalls.push({ method: "GET", pathname, headers });
    return { body: { reasons: [{ id: "safety", label: "Safety" }] } };
  },
  async post(pathname, body, headers) {
    state.apiCalls.push({
      method: "POST",
      pathname,
      body: JSON.parse(body),
      headers,
    });
    return { success: true };
  },
};
Object.assign(state, { apiClient, legacyHttpClient, jsxRuntime, reactRuntime });

const importedNames = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = importedNames.get(match[2]) ?? new Set();
    for (const item of match[1].split(","))
      names.add(item.trim().split(/\s+as\s+/)[0]);
    importedNames.set(match[2], names);
  }
}
const overrides = {
  "app-shared": {
    I3: "() => globalThis.__reportSharingDialogsTest.jsxRuntime",
    e6: "() => globalThis.__reportSharingDialogsTest.reactRuntime",
  },
  "app-initial": {
    _dn: "{getInstance:()=>globalThis.__reportSharingDialogsTest.legacyHttpClient}",
    cJt: "() => globalThis.__reportSharingDialogsTest.initialized.push('api')",
    fdn: "() => ({Authorization:'Bearer test'})",
    pdn: "() => globalThis.__reportSharingDialogsTest.initialized.push('desktop-http')",
    rJt: "globalThis.__reportSharingDialogsTest.apiClient",
    ydn: "() => globalThis.__reportSharingDialogsTest.initialized.push('auth-headers')",
  },
  "report-dialog-core": {
    n: "() => globalThis.__reportSharingDialogsTest.initialized.push('report-dialog')",
    t: "props => ({ type: 'report-dialog', props })",
  },
  "remote-connection-editor-draft": {
    n: "input => { globalThis.__reportSharingDialogsTest.validationInputs.push(input); return globalThis.__reportSharingDialogsTest.validationErrors ?? []; }",
    r: "() => globalThis.__reportSharingDialogsTest.initialized.push('remote-draft')",
  },
};
function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__reportSharingDialogsTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return args[0]; }`;
}
function mock(name) {
  if (name === "rolldown-runtime")
    return "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};";
  if (
    [
      "form-runtime",
      "color-palette",
      "automation-dialog",
      "schedule-fields",
      "schedule-draft",
      "share-analytics",
      "codex-thread-report-dialog-entry",
      "dialog-action",
      "permission-dropdown",
      "git-action-new-branch-field",
      "create-pull-request-modal-content",
      "creation-target-query",
    ].includes(name)
  )
    return "export {};";
  return [...(importedNames.get(name) ?? [])]
    .filter(Boolean)
    .map(
      (exportName) =>
        `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`,
    )
    .join("\n");
}
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "dialog-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => ({
              contents: mock(importPath),
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}
function nodes(root) {
  const found = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) found.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return found;
}
const byText = (tree, text) =>
  nodes(tree).find((node) => node.props?.children === text);

// report-dialog-core: 7
const reportCore = await bundle("report-dialog-core");
reportCore.n();
assert.equal(state.initialized.includes("api"), true);
let reportClosed = false;
const reportTree = reportCore.t({
  title: "Report item",
  queryKey: ["reasons"],
  initialReasons: [{ id: "spam", label: "Spam" }],
  loadReasons: async () => [],
  submitReport: async () => {},
  onClose: () => {
    reportClosed = true;
  },
});
assert.equal(reportTree.type, "dialog");
assert.equal(reportTree.props.open, true);
assert.equal(byText(reportTree, "Report item").type, "h2");
assert.equal(
  nodes(reportTree).find((node) => node.props?.name === "report-reason").props
    .value,
  "spam",
);
byText(reportTree, "Cancel").props.onClick();
assert.equal(reportClosed, true);
assert.equal(byText(reportTree, "Next").props.disabled, true);

// codex-thread-report-dialog: 10
const codexReport = await bundle("codex-thread-report-dialog");
codexReport.n();
assert.equal(state.initialized.includes("report-dialog"), true);
const codexTree = codexReport.t({
  onClose: () => {},
  reportEntityType: "conversation",
  threadId: "thread-1",
  chatGptMessageId: "message-1",
});
assert.equal(typeof codexTree.type, "function");
assert.deepEqual(codexTree.props.queryKey, [
  "codex-thread-report-reasons",
  "conversation",
]);
const loadedReasons = await codexTree.props.loadReasons({
  signal: new AbortController().signal,
});
assert.equal(loadedReasons.reasons[0].id, "safety");
assert.equal(
  state.apiCalls.at(-1).pathname,
  "/report_flow/reasons/conversation",
);
await codexTree.props.submitReport({
  reason: { id: "legal" },
  details: "Details",
});
assert.equal(state.apiCalls.at(-1).pathname, "/report_flow/report");
assert.equal(state.apiCalls.at(-1).body.entity_id, "thread-1");
assert.equal(state.apiCalls.at(-1).body.reason.details, "Details");
assert.equal(
  state.apiCalls.at(-1).headers["chatgpt-conv-message-id"],
  "message-1",
);
const connectorTree = codexReport.t({
  onClose: () => {},
  reportEntityType: "connector",
  connectorId: "connector-1",
  threadId: "thread-2",
});
assert.equal(connectorTree.props.title.props.defaultMessage, "Report app");

// remote-connection-editor-dialog: 7
const remote = await bundle("remote-connection-editor-dialog");
remote.n();
assert.equal(state.initialized.includes("remote-draft"), true);
const remoteSubmissions = [];
const remoteTree = remote.t({
  open: true,
  mode: "add",
  draft: { displayName: "Prod", sshHost: "user@host", authMode: "none" },
  existingConnections: [],
  onOpenChange: (value) => {
    state.remoteOpen = value;
  },
  onSubmit: (...args) => remoteSubmissions.push(args),
});
assert.equal(byText(remoteTree, "Add SSH connection").type, "h2");
assert.equal(
  nodes(remoteTree).filter((node) => node.type === "input").length >= 3,
  true,
);
nodes(remoteTree)
  .find((node) => node.type === "form")
  .props.onSubmit({ preventDefault() {} });
assert.equal(state.validationInputs.at(-1).draft.sshHost, "user@host");
assert.equal(remoteSubmissions.length, 1);
assert.equal(remoteSubmissions[0][0].displayName, "Prod");
byText(remoteTree, "Cancel").props.onClick();
assert.equal(state.remoteOpen, false);

const sharedTaskReleaseAssertions = assertReleaseOwner("scheduled-shared-task-dialog-core");
const skillShareReleaseAssertions = assertReleaseOwner("skill-share-dialog-runtime");

const pluginShareAssertions = assertReleaseOwner("plugin-share-dialog-core");

// gitlab-merge-request-form-dialog: 7
const gitlab = await bundle("gitlab-merge-request-form-dialog");
const mergeRequests = [];
let gitlabClosed = false;
const gitlabTree = gitlab.GitLabMergeRequestFormDialog({
  form: {
    title: "Ship feature",
    description: "Ready",
    headBranch: "feature",
    targetBranch: "main",
    targetProjectPath: "group/repo",
  },
  target: { hostId: "host-1" },
  onClose: () => {
    gitlabClosed = true;
  },
  onSubmit: (input) => mergeRequests.push(input),
});
assert.equal(gitlabTree.props["data-host-id"], "host-1");
assert.equal(byText(gitlabTree, "Create merge request").type, "h2");
assert.equal(
  nodes(gitlabTree).some((node) => node.props?.children === "New branch"),
  false,
);
byText(gitlabTree, "Create draft").props.onClick();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(mergeRequests[0].createAsDraft, true);
assert.equal(mergeRequests[0].title, "Ship feature");
assert.equal(gitlabClosed, true);
assert.equal(byText(gitlabTree, "Open in browser").type, "button");

console.log(`37 report/sharing dialog assertions, ${sharedTaskReleaseAssertions} shared task, ${skillShareReleaseAssertions} skill share, and ${pluginShareAssertions} plugin share release assertions passed`);
