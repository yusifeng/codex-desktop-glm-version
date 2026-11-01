import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["result-values", "partition", "undo", "book-open", "diff-preview-tooltip", "exec-shell-container", "computer-use-native-app-metadata", "open-in-button", "skill-exploration-labels", "plan-implementation-request"];
const state = globalThis.__toolResultPrimitivesTest = {};
state.jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.react = { useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; } };
const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) {
      const name = item.trim().split(/\s+as\s+/)[0];
      if (name && !name.startsWith("type ")) names.add(name);
    }
    imports.set(match[2], names);
  }
}
const overrides = {
  "app-shared": {
    $O: "{ FIVE_MINUTES: 300000 }",
    BX: "(family, parameter) => ({ data: family?.read?.(parameter) ?? null })",
    FX: "() => undefined",
    I3: "() => globalThis.__toolResultPrimitivesTest.jsx",
    QI: "() => undefined",
    ZI: "{ id: 'app-scope' }",
    e6: "() => globalThis.__toolResultPrimitivesTest.react",
    ek: "() => undefined",
  },
  "app-initial": {
    eun: `(scope, method, options) => ({
      method,
      options,
      read(parameter) {
        const config = options(parameter);
        if (!config.enabled) return null;
        if (method === "native-desktop-app-by-bundle-id") {
          return config.select({ app: { appId: parameter, displayName: "Editor" } });
        }
        return config.select({ apps: [{ appId: "com.example.Editor", displayName: "Editor" }] });
      },
    })`,
    nun: "() => undefined",
  },
};
const sideEffects = new Set(["rolldown-runtime", "diff-preview-content", "ansi-block", "shell-label", "use-app-connect-flow", "open-in-google-drive-menu-item"]);
function mock(name) { if (sideEffects.has(name)) return "export {};"; return [...(imports.get(name) ?? [])].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`).join("\n"); }
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "tool-result-primitives-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); }; visit(root); return output; }
const nodeOfType = (tree, type) => nodes(tree).find(node => node.type === type);
const textNode = (tree, text) => nodes(tree).find(node => node.props?.children === text);

// partition: 4
const partition = await bundle("partition");
assert.deepEqual(partition.t([1, 2, 3, 4], value => value % 2 === 0), [[2, 4], [1, 3]]);
assert.deepEqual(partition.t([], () => true), [[], []]);
assert.deepEqual(partition.t(["a", "b"], (_value, index) => index === 0), [["a"], ["b"]]);
assert.equal(typeof partition.t, "function");

// plan-implementation-request: 5
const plan = await bundle("plan-implementation-request");
plan.n();
assert.equal(plan.t, "PLEASE IMPLEMENT THIS PLAN:");
assert.equal(plan.r("PLEASE IMPLEMENT THIS PLAN: ship it"), true);
assert.equal(plan.r(" Please implement this plan"), false);
assert.equal(plan.r("PLEASE IMPLEMENT THIS"), false);
assert.equal(typeof plan.n, "function");

// undo + book-open: 6
const undo = await bundle("undo"); const book = await bundle("book-open");
undo.n(); book.n();
const undoTree = undo.t({ "aria-label": "Undo" });
assert.equal(undoTree.type, "svg");
assert.equal(undoTree.props.width, 20);
assert.equal(undoTree.props["aria-label"], "Undo");
const bookTree = book.t({ className: "book" });
assert.equal(bookTree.type, "svg");
assert.equal(bookTree.props["data-rtl-flip"], "");
assert.equal(bookTree.props.className, "book");

// computer-use-native-app-metadata: 4
const nativeApp = await bundle("computer-use-native-app-metadata");
nativeApp.t();
assert.deepEqual(nativeApp.n({ kind: "appId", appId: "com.example.Editor" }), { appId: "com.example.Editor", displayName: "Editor" });
assert.deepEqual(nativeApp.n({ kind: "displayName", displayName: "Editor" }), { appId: "com.example.Editor", displayName: "Editor" });
assert.equal(nativeApp.n(null), null);
assert.equal(typeof nativeApp.t, "function");

// diff-preview-tooltip: 5
const diffPreview = await bundle("diff-preview-tooltip");
diffPreview.n();
const diffTree = diffPreview.t({ children: "main.ts", diff: { metadata: { path: "main.ts" } }, disabled: true, displayPath: "main.ts", linesAdded: 3, linesRemoved: 1 });
assert.equal(diffTree.type, "span");
assert.equal(diffTree.props.className, "group/diff-preview");
assert.equal(nodes(diffTree).find(node => node.props["aria-disabled"] === true).props.children, "main.ts");
assert.equal(nodeOfType(diffTree, "aside"), undefined);
assert.equal(typeof diffTree.props.onPointerEnter, "function");

// exec-shell-container: 10
const shell = await bundle("exec-shell-container");
shell.n();
const shellTree = shell.t({ command: "npm test", cwd: "/repo", output: "passed", surface: "plain" });
assert.equal(shellTree.type, "section");
assert.equal(shellTree.props["data-surface"], "plain");
assert.equal(textNode(shellTree, "npm test").type, "code");
assert.equal(textNode(shellTree, "/repo").type, "span");
assert.equal(nodeOfType(shellTree, "pre").props.children, "passed");
assert.equal(nodeOfType(shell.t({ command: "true", output: "" }), "pre").props.children, "No output");
assert.equal(shell.t.Footer({ isInProgress: true }).props["aria-label"], "Command running");
assert.equal(shell.t.Footer({ wasInterrupted: true }).props.children, "Stopped");
assert.equal(shell.t.Footer({ isSuccess: true }).props.children, "Success");
assert.equal(shell.t.Footer({ exitCode: 2 }).props.children, "Exit code 2");

// open-in-button: 7
const openIn = await bundle("open-in-button");
openIn.n();
assert.equal(openIn.t({}), null);
let opened = false; let downloaded = false;
const openTree = openIn.t({ artifactRef: "artifact-1", hostId: "local", kind: "document", onDownload: () => { downloaded = true; }, onOpen: () => { opened = true; }, threadId: "thread-1", title: "Report", variant: "title" });
assert.equal(openTree.props["data-artifact-ref"], "artifact-1");
assert.equal(openTree.props["data-thread-id"], "thread-1");
const buttons = nodes(openTree).filter(node => node.type === "button");
assert.equal(buttons[0].props.children, "Open Report");
buttons[0].props.onClick(); buttons[1].props.onClick();
assert.equal(opened, true);
assert.equal(downloaded, true);
assert.equal(buttons[1].props.children, "Download");

// skill-exploration-labels: 12
const skills = await bundle("skill-exploration-labels");
skills.n(); skills.s();
assert.equal(skills.a("mkdir visualizations/demo"), "create");
assert.equal(skills.a("apply_patch\n*** Update File: visualizations/demo/index.html"), "update");
assert.equal(skills.a("apply_patch\n*** Delete File: visualizations/demo/index.html"), null);
assert.equal(skills.a("echo hello"), null);
assert.equal(skills.l("completed"), true);
assert.equal(skills.l("failed"), false);
assert.equal(skills.c({ isSkillDefinitionFile: true, skillId: "visualize" }), true);
assert.equal(skills.c({ isSkillDefinitionFile: true, skillId: "live", pluginId: "visualize" }), true);
assert.equal(skills.i({ kind: "create", isFinished: false, isLeadingSegment: true }), "Creating visualization");
assert.equal(skills.i({ kind: "update", isFinished: true, isLeadingSegment: false }), "updated visualization");
assert.equal(skills.o([{ type: "text", text: "Create an interactive chart" }]), "soft");
assert.equal(skills.r({ summary: { isSkillDefinitionFile: true } }), true);

// result-values: 10
const values = await bundle("result-values");
values.a(); values.s();
assert.equal(textNode(values.i({ script: "npm install" }), "Configured").type, "span");
assert.equal(textNode(values.i({ script: " " }), "Not set").type, "span");
assert.equal(textNode(values.t({ policy: { type: "disabled" } }), "Disabled").type, "span");
assert.equal(textNode(values.t({ policy: { type: "unrestricted" } }), "Unrestricted").type, "span");
assert.equal(values.t({ policy: { type: "restricted", egress_rules: [{ host: "a.test" }, { host: "a.test" }] } }).props.children, "1 allowed domains");
assert.equal(values.t({ policy: { type: "restricted", egress_rules: [], presets: ["package_managers"] } }).props.children, "Package managers");
assert.equal(values.n({ workspaceName: "Acme" }).props.children, "Everyone at Acme");
assert.equal(values.n({ detail: true }).props.children, "Everyone in this workspace can access");
assert.equal(values.r({ requirement: { connection_id: "github", display_name: "GitHub" } }).props.children, "GitHub");
assert.deepEqual(values.o.queryKey, ["environment-outbound-identity"]);

console.log("63 tool result primitives cluster assertions passed");
