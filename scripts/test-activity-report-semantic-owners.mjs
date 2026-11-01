import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__activityReportSemanticOwners = {
  hookCursor: 0,
  hookValues: [],
  initialized: [],
  submitted: [],
};
const jsxRuntime = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const reactRuntime = {
  useEffect() {},
  useState(initial) {
    const index = state.hookCursor++;
    if (!(index in state.hookValues)) {
      state.hookValues[index] = typeof initial === "function" ? initial() : initial;
    }
    return [state.hookValues[index], next => {
      const current = state.hookValues[index];
      state.hookValues[index] = typeof next === "function" ? next(current) : next;
    }];
  },
};

async function bundle(directory, mocks) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "activity-report-owner-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({
          contents: mocks[moduleName] ?? "export const n=()=>{};export const t=()=>{};",
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

function walk(root) {
  const nodes = [];
  const visit = value => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) nodes.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return nodes;
}

const activity = await bundle("agent-activity-units", {
  "app-shared": "export const $3=()=>globalThis.__activityReportSemanticOwners.initialized.push('shared');",
  "app-initial": `
    export const C=()=>globalThis.__activityReportSemanticOwners.initialized.push('initial');
    export const mXt=server=>server==='codex_apps';
    export const uXt=({isCodexAppsServer})=>isCodexAppsServer;
  `,
  "agent-activity-item": `
    export const n=()=>globalThis.__activityReportSemanticOwners.initialized.push('activity-item');
    export const r=item=>item.linkedToPatch===true;
    export const t=(item,options)=>item.type==='ignored'||(item.type==='generated-image'&&!options.includeGeneratedImages)?null:{grouping:item.type==='assistant-message'?'standalone':'groupable',item};
  `,
});

assert.equal(activity.n({ item: { type: "assistant-message", delivery: "async", searchItemId: "search-1" } }, 4), "search-1");
assert.equal(activity.n({ item: { type: "exec", callId: "call-1" } }, 4), "call-1");
assert.equal(activity.n({ item: { type: "patch" } }, 4), "patch:4");
assert.equal(activity.m({ type: "todo-list", plan: [{ status: "completed" }, { status: "pending" }] }), true);
assert.equal(activity.m({ type: "multi-agent-action", status: "inProgress" }), true);
assert.equal(activity.m({ type: "permission-request", completed: false }), true);

const markdown = [
  ":codex-followup[Visible]",
  "`:codex-followup[Inline code]`",
  "```md",
  ":codex-followup[Fenced code]",
  "```",
].join("\n");
const expanded = activity.x(markdown);
assert.match(expanded, /^Visible/m);
assert.match(expanded, /`:codex-followup\[Inline code\]`/);
assert.match(expanded, /:codex-followup\[Fenced code\]/);
assert.equal(activity.v("curl https://example.com/docs"), true);
assert.equal(activity.v("curl -X POST https://example.com/api"), false);
assert.equal(activity.v("curl --data q=1 https://example.com/api"), false);
assert.equal(activity.v("curl http://localhost:3000"), false);
assert.equal(activity.v("wget https://example.com"), false);

const rawItems = [
  { type: "exec", callId: "skip", linkedToPatch: true, parsedCmd: { isFinished: true, type: "read" } },
  { type: "patch", callId: "patch-1", success: true },
  { type: "exec", callId: "exec-1", parsedCmd: { isFinished: true, type: "search" } },
  { type: "assistant-message", id: "assistant-1", completed: true },
];
const units = activity.r(rawItems);
assert.equal(units.length, 2);
assert.equal(units[0].kind, "group");
assert.equal(units[0].key, "agent-activity-group:patch-1");
assert.equal(units[0].items.length, 2);
assert.equal(units[1].kind, "standalone");
assert.equal(units[1].key, "agent-activity-standalone:assistant-1");
assert.equal(units[1].item.item.type, "assistant-message");
const codexClusters = activity.o([
  { grouping: "groupable", item: { type: "mcp-tool-call", completed: true, invocation: { server: "codex_apps", tool: "read" }, result: { type: "success" } } },
  { grouping: "groupable", item: { type: "mcp-tool-call", completed: true, invocation: { server: "codex_apps", tool: "read" }, result: { type: "success" } } },
], () => "same");
assert.equal(codexClusters.length, 2, "Codex Apps calls stay out of generic MCP clusters");
activity.p();
activity.p();
assert.equal(state.initialized.filter(value => value === "activity-item").length, 1);

Object.assign(state, { jsxRuntime, reactRuntime });
const report = await bundle("report-dialog-core", {
  "rolldown-runtime": "export {};",
  "app-shared": "export const I3=()=>globalThis.__activityReportSemanticOwners.jsxRuntime;export const e6=()=>globalThis.__activityReportSemanticOwners.reactRuntime;",
  "app-initial": "export const cJt=()=>globalThis.__activityReportSemanticOwners.initialized.push('api');",
});
const reasons = [{
  id: "quality",
  cta: "Quality issue",
  sub_reasons: [{
    id: "incorrect",
    cta: "Incorrect",
    has_details: true,
    details_placeholder: "What was incorrect?",
    additional_fields: [{ id: "source", placeholder: "Source URL", required: true, type: "url" }],
  }],
}, {
  id: "external",
  cta: "External form",
  link_attachment: "https://example.test/report",
}];
const opened = [];
const props = {
  includeServerFields: true,
  initialReasons: { header: "Choose one", reasons },
  loadReasons: async () => ({ reasons: [] }),
  onClose() {},
  openExternalForm: url => opened.push(url),
  queryKey: ["report-reasons"],
  submitReport: async input => state.submitted.push(input),
  title: "Report response",
};
function renderReport() {
  state.hookCursor = 0;
  return report.t(props);
}
function nodeBy(root, predicate) {
  return walk(root).find(predicate);
}

let tree = renderReport();
assert.equal(nodeBy(tree, node => node.props?.children === "Next").props.disabled, true);
nodeBy(tree, node => node.props?.value === "quality").props.onChange();
tree = renderReport();
const rootForm = nodeBy(tree, node => node.type === "form");
assert.equal(nodeBy(tree, node => node.props?.children === "Next").props.disabled, false);
rootForm.props.onSubmit({ currentTarget: { reportValidity: () => true }, preventDefault() {} });
tree = renderReport();
nodeBy(tree, node => node.props?.value === "incorrect").props.onChange();
tree = renderReport();
nodeBy(tree, node => node.type === "form").props.onSubmit({ currentTarget: { reportValidity: () => true }, preventDefault() {} });
tree = renderReport();
assert.equal(nodeBy(tree, node => node.type === "textarea").props.placeholder, "What was incorrect?");
nodeBy(tree, node => node.type === "textarea").props.onChange({ currentTarget: { value: "The answer was outdated" } });
nodeBy(tree, node => node.type === "input" && node.props.type === "url").props.onChange({ currentTarget: { value: "https://source.test" } });
tree = renderReport();
nodeBy(tree, node => node.type === "form").props.onSubmit({ currentTarget: { reportValidity: () => true }, preventDefault() {} });
await new Promise(resolve => setImmediate(resolve));
assert.equal(state.submitted.length, 1);
assert.equal(state.submitted[0].reason.id, "incorrect");
assert.deepEqual(state.submitted[0].path.map(reason => reason.id), ["quality", "incorrect"]);
assert.equal(state.submitted[0].details, "The answer was outdated");
assert.equal(state.submitted[0].additionalFields.source, "https://source.test");

state.hookValues = [];
tree = renderReport();
nodeBy(tree, node => node.props?.value === "external").props.onChange();
tree = renderReport();
nodeBy(tree, node => node.type === "form").props.onSubmit({ currentTarget: { reportValidity: () => true }, preventDefault() {} });
tree = renderReport();
nodeBy(tree, node => node.props?.children === "View form").props.onClick();
assert.deepEqual(opened, ["https://example.test/report"]);

console.log("activity and report semantic owner assertions passed");
