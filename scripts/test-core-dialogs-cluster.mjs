import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["create-pull-request-modal-content", "automation-dialog", "plan-downgrade-dialog-core", "create-project-dialog-core", "gpt-about-dialog-core", "create-dialog"];
const state = globalThis.__coreDialogsTest = { apiCalls: [], initialized: [] };
const jsxRuntime = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const reactRuntime = { useEffect: () => {}, useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; }, useRef: value => ({ current: value }) };
const apiClient = { async safePost(pathname, options) { state.apiCalls.push({ pathname, options }); return { success: true }; } };
Object.assign(state, { apiClient, jsxRuntime, reactRuntime });

const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) names.add(item.trim().split(/\s+as\s+/)[0]);
    imports.set(match[2], names);
  }
}
const overrides = {
  "app-shared": { I3: "() => globalThis.__coreDialogsTest.jsxRuntime", e6: "() => globalThis.__coreDialogsTest.reactRuntime" },
  "app-initial": { cJt: "() => globalThis.__coreDialogsTest.initialized.push('api')", rJt: "globalThis.__coreDialogsTest.apiClient" },
  "remote-connection-editor-draft": { r: "() => globalThis.__coreDialogsTest.initialized.push('remote-draft')" },
};
const sideEffects = new Set(["rolldown-runtime", "git-action-new-branch-field", "pull-request", "app-primary", "model-and-reasoning-effort-translations", "pricing", "subscription-update-dialog", "billing-queries", "billing-query-error", "stripe-client", "billing-state", "billing-pricing", "subscription-queries", "billing-events", "gpt-plugin-retirement", "gpt-report-menu-item", "card-tile", "migrated-plugin-access", "gpt-plugin-migration-notices", "gpt-plugin-migration-dialog", "setup-artwork", "pending-onboarding", "plugin-settings-url", "cloud-environment-queries"]);
function generic(moduleName, exportName) { return `(...args) => { globalThis.__coreDialogsTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return args[0]; }`; }
function mock(name) {
  if (sideEffects.has(name)) return "export {};";
  return [...(imports.get(name) ?? [])].filter(Boolean).map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`).join("\n");
}
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "core-dialog-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" }));
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function nodes(root) {
  const output = [];
  const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); };
  visit(root);
  return output;
}
const byText = (tree, text) => nodes(tree).find(node => node.props?.children === text);

// create-pull-request-modal-content: 7
const pr = await bundle("create-pull-request-modal-content");
const prActions = [];
const prTree = pr.t({ isGitLab: false, repositoryName: "repo", baseBranch: "main", headBranch: "feature", title: "Ship", description: "Ready", includeLocalChanges: true, onTitleChange: value => prActions.push(["title", value]), onDescriptionChange: value => prActions.push(["description", value]), onIncludeLocalChangesChange: value => prActions.push(["local", value]), onCreate: value => prActions.push(["create", value]), onOpenPullRequest: () => {} });
assert.equal(prTree.props["aria-label"], "Create pull request");
assert.equal(byText(prTree, "Create pull request").type, "h2");
assert.match(nodes(prTree).find(node => node.type === "p").props.children, /main ← feature/);
nodes(prTree).find(node => node.type === "input" && node.props.value === "Ship").props.onChange({ currentTarget: { value: "New title" } });
assert.deepEqual(prActions.at(-1), ["title", "New title"]);
nodes(prTree).find(node => node.props.type === "checkbox").props.onChange({ currentTarget: { checked: false } });
assert.deepEqual(prActions.at(-1), ["local", false]);
byText(prTree, "Create draft").props.onClick();
assert.deepEqual(prActions.at(-1), ["create", true]);
assert.equal(nodes(prTree).find(node => node.type === "button" && node.props.children === "Create pull request").props.disabled, false);

// automation-dialog: 7
const automation = await bundle("automation-dialog");
automation.a();
assert.equal(state.initialized.includes("api"), true);
const titleChanges = [];
const titleInput = automation.i({ id: "title", value: "Daily", onChange: value => titleChanges.push(value) });
assert.equal(titleInput.props["data-testid"], "automation-title-input");
titleInput.props.onChange({ currentTarget: { value: "Weekly" } });
assert.deepEqual(titleChanges, ["Weekly"]);
assert.match(automation.r({ isDangerFullAccess: true }).props.children, /full access/);
let formSubmitted = false;
const formTree = automation.t({ draft: { name: "Digest", prompt: "Summarize" }, setDraft: () => {}, onSubmit: () => { formSubmitted = true; } });
nodes(formTree).find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.equal(formSubmitted, true);
assert.equal(nodes(formTree).some(node => node.type === "textarea"), true);
assert.equal(byText(formTree, "Save").props.type, "submit");

// plan-downgrade-dialog-core: 6
const downgrade = await bundle("plan-downgrade-dialog-core");
downgrade.n();
let backed = false;
const downgradeTree = downgrade.t({ account: { account: { account_id: "account-1", plan_type: "pro", structure: "personal" }, entitlement: {} }, accountId: "account-1", targetPlan: "plus", onBack: () => { backed = true; }, onClose: () => {} });
assert.equal(byText(downgradeTree, "Change your plan").type, "h2");
assert.match(nodes(downgradeTree).find(node => node.type === "p").props.children, /pro to plus/);
byText(downgradeTree, "Back").props.onClick();
assert.equal(backed, true);
await byText(downgradeTree, "Confirm plan change").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/consumer/billing/subscription/update");
assert.equal(state.apiCalls.at(-1).options.requestBody.target_plan, "plus");
assert.equal(state.apiCalls.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-1");

// create-project-dialog-core: 7
const project = await bundle("create-project-dialog-core");
project.r();
assert.equal(state.initialized.includes("remote-draft"), true);
let createdProject = null;
let projectClosed = false;
const projectTree = project.t({ initialRequest: { initialPath: "/workspace/repo", hostId: "remote-1", setActive: true }, remoteConnections: [{ hostId: "remote-1", displayName: "Remote" }], onClose: () => { projectClosed = true; }, onCreate: async input => { createdProject = input; } });
assert.equal(byText(projectTree, "Create project").type, "h2");
assert.equal(nodes(projectTree).find(node => node.type === "select").props.value, "remote-1");
await nodes(projectTree).find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.equal(createdProject.directoryPath, "/workspace/repo");
assert.equal(createdProject.hostId, "remote-1");
assert.equal(projectClosed, true);
const missingTree = project.n({ missingDirectory: { path: "/new", remoteName: "Remote" }, onCancel: () => {}, onCloseAutoFocus: () => {}, onConfirm: () => {} });
assert.match(nodes(missingTree).find(node => node.type === "p").props.children, /\/new on Remote/);

// gpt-about-dialog-core: 8
const about = await bundle("gpt-about-dialog-core");
const resource = { gizmo: { id: "gpt-1", author: { display_name: "OpenAI" }, display: { name: "Builder", description: "Builds things" }, tags: ["featured"] } };
assert.equal(about.i(resource), "Builder");
assert.equal(about.o(resource), "OpenAI");
assert.equal(about.s(resource, "featured"), true);
assert.equal(about.r(resource, "id", "missing"), "gpt-1");
assert.equal(about.a(resource, "Official", "Verified"), "Official · OpenAI · Verified");
let reportClicked = false;
const aboutTree = about.t({ resource, onClose: () => {}, onReport: () => { reportClicked = true; } });
assert.equal(byText(aboutTree, "Builder").type, "h2");
assert.equal(byText(aboutTree, "Builds things").type, "p");
byText(aboutTree, "Report").props.onClick();
assert.equal(reportClicked, true);

// create-dialog: 7
const create = await bundle("create-dialog");
create.n();
let created = null;
let createClosed = false;
const createTree = create.t({ initialMode: "cloud", initialName: "Cloud task", initialRepository: "org/repo", onClose: () => { createClosed = true; }, onCreate: async input => { created = input; } });
assert.equal(byText(createTree, "Create").type, "h2");
assert.equal(nodes(createTree).find(node => node.props?.name === "create-mode" && node.props.value === "cloud").props.checked, true);
assert.equal(nodes(createTree).find(node => node.type === "input" && node.props.value === "org/repo").props.value, "org/repo");
await nodes(createTree).find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.deepEqual(created, { mode: "cloud", name: "Cloud task", repository: "org/repo" });
assert.equal(createClosed, true);
assert.equal(nodes(createTree).find(node => node.type === "button" && node.props.children === "Create").props.disabled, false);
assert.equal(byText(createTree, "Cancel").props.type, "button");

console.log("42 core dialogs cluster assertions passed");
