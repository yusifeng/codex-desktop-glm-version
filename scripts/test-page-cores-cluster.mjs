import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["chatgpt-work-home-page-core", "credit-purchase-page-core", "skills-page-core", "mcp-extension-view-page-core"];
const state = globalThis.__pageCoresTest = { apiCalls: [], initialized: [] };
const jsxRuntime = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const reactRuntime = { useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; } };
const apiClient = { async safePost(pathname, options) { state.apiCalls.push({ pathname, options }); return { checkoutId: "checkout-1" }; } };
const ViewFrame = function ViewFrame() {};
Object.assign(state, { apiClient, jsxRuntime, reactRuntime, ViewFrame });

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
  "app-shared": { I3: "() => globalThis.__pageCoresTest.jsxRuntime", e6: "() => globalThis.__pageCoresTest.reactRuntime" },
  "app-initial": { cJt: "() => globalThis.__pageCoresTest.initialized.push('api')", rJt: "globalThis.__pageCoresTest.apiClient" },
  "view-frame": { n: "() => globalThis.__pageCoresTest.initialized.push('view-frame')", t: "globalThis.__pageCoresTest.ViewFrame" },
  "mcp-quick-action-dialog": { n: "() => globalThis.__pageCoresTest.initialized.push('quick-action-dialog')" },
};
const sideEffects = new Set(["rolldown-runtime", "app-primary", "home-task-suggestions-core", "checkout-policy", "checkout-dialog-fields", "checkout-error", "account-action-integrity", "billing-pricing", "checkout-session", "checkout-confirm-latency", "checkout-page-core", "computer-history-suggestions", "use-element-in-view", "skills-page-grid", "plugin-request-empty-state", "plugins-store-page", "plugins-page-section", "plugin-detail-page-core", "plugin-detail-view", "settings-host-dropdown", "plugins-page", "mcp-view-surface"]);
function generic(moduleName, exportName) { return `(...args) => { globalThis.__pageCoresTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return args[0]; }`; }
function mock(name) { if (sideEffects.has(name)) return "export {};"; return [...(imports.get(name) ?? [])].filter(Boolean).map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`).join("\n"); }
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "page-core-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" }));
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); }; visit(root); return output; }
const byText = (tree, text) => nodes(tree).find(node => node.props?.children === text);
const button = (tree, text) => nodes(tree).find(node => node.type === "button" && node.props.children === text);

// chatgpt-work-home-page-core: 10
const workHome = await bundle("chatgpt-work-home-page-core");
workHome.n();
let submitted = null;
let selectedSuggestion = null;
let homeContext = null;
const workTree = workHome.t({ additionalDeveloperInstructions: "Use the repository conventions", initialPrompt: "Fix the renderer", onSubmit: input => { submitted = input; }, onTaskSuggestionSelected: value => { selectedSuggestion = value; }, renderHomeContent: context => { homeContext = context; return "ambient"; }, suggestions: ["Review my changes"] });
assert.equal(workTree.props["data-testid"], "chatgpt-work-home-page");
assert.match(workTree.props["data-vscode-context"], /supportsNewChatMenu/);
assert.equal(byText(workTree, "What are you working on?").type, "h1");
assert.equal(nodes(workTree).find(node => node.type === "textarea").props.value, "Fix the renderer");
assert.equal(typeof homeContext.setPrompt, "function");
button(workTree, "Review my changes").props.onClick();
assert.equal(selectedSuggestion, "Review my changes");
await nodes(workTree).find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.equal(submitted.prompt, "Fix the renderer");
assert.equal(submitted.developerInstructions, "Use the repository conventions");
assert.equal(button(workTree, "Send").props.disabled, false);
assert.equal(state.initialized.includes("api"), true);

// credit-purchase-page-core: 11
const purchase = await bundle("credit-purchase-page-core");
purchase.n();
let purchaseResult = null;
const purchaseTree = purchase.t({ accountId: "account-1", audience: "workspace", currencyCode: "EUR", defaultQuantity: 3000, onComplete: result => { purchaseResult = result; } });
assert.equal(byText(purchaseTree, "Purchase credits").type, "h1");
assert.equal(nodes(purchaseTree).find(node => node.type === "input").props.value, 3000);
assert.equal(nodes(purchaseTree).find(node => node.type === "input").props.step, 250);
assert.equal(byText(purchaseTree, "3,000 credits · EUR").type, "p");
assert.equal(button(purchaseTree, "Continue").props.disabled, false);
await nodes(purchaseTree).find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.equal(state.apiCalls.at(-1).pathname, "/consumer/billing/credits/purchase");
assert.equal(state.apiCalls.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-1");
assert.deepEqual(state.apiCalls.at(-1).options.requestBody, { audience: "workspace", currency: "EUR", quantity: 3000 });
assert.equal(purchaseResult.checkoutId, "checkout-1");
const invalidPurchaseTree = purchase.t({ defaultQuantity: 501 });
assert.equal(button(invalidPurchaseTree, "Continue").props.disabled, true);
assert.equal(nodes(invalidPurchaseTree).filter(node => node.props.role === "alert").length, 1);

// skills-page-core: 10
const skills = await bundle("skills-page-core");
skills.r();
let openedSkill = null;
let installedSkill = null;
const skillsTree = skills.t({ initialQuery: "code", initialTab: "plugins", onInstall: async skill => { installedSkill = skill; }, onOpen: skill => { openedSkill = skill; }, skills: [{ id: "review", name: "Code review", description: "Review changes" }, { id: "docs", name: "Documents", installed: true }] });
assert.equal(byText(skillsTree, "Skills and plugins").type, "h1");
assert.equal(button(skillsTree, "Plugins").props["aria-pressed"], true);
assert.equal(button(skillsTree, "Skills").props["aria-pressed"], false);
assert.equal(nodes(skillsTree).find(node => node.type === "input").props.value, "code");
assert.equal(button(skillsTree, "Code review").type, "button");
assert.equal(button(skillsTree, "Documents"), undefined);
button(skillsTree, "Code review").props.onClick();
assert.equal(openedSkill.id, "review");
await button(skillsTree, "Install").props.onClick();
assert.equal(installedSkill.id, "review");
const managedSkills = skills.n();
assert.equal(managedSkills.type, skills.t);
assert.equal(managedSkills.props.initialTab, "skills");

const mcpReleaseAssertions = assertReleaseOwner("mcp-extension-view-page-core");

console.log(`31 page cores assertions and ${mcpReleaseAssertions} MCP release assertions passed`);
