import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hooks = [];
let hookIndex = 0;
const effects = [];
const effectDeps = [];
const baseBuilder = {
  agent: { id: "agent-1", viewer_capability: "hermes_admin", slack_handle: "helper" }, draft_revision: "rev-1", latest_published_version: { id: "pub-2" },
  draft_version: { name: "Finance Helper", tagline: "Clear answers", description: "Helps the team", model_spec: { name: "gpt-5.6-sol", reasoning_effort: "medium" }, icon: { name: "bloop", color: "blue" }, starter_prompts: [{ title: "Review", description: "Review a plan", prompt: "Review this plan" }], config: { prompt: "Be useful", tools: { connectors: [{ id: "drive", name: "Drive", permissions_ready: false }], memory: true }, persistent_folder: { enabled: true }, deployments: { slack: [{ channel_id: "C1", channel_name: "finance", handle: "helper" }] } } },
};
const state = {
  accountId: "acct-1", agentId: "agent-1", buildPermission: true, editFeature: true, slackFeature: true, initialized: 0,
  requests: [], navigations: [], analytics: [], rejectCode: null,
  builder: structuredClone(baseBuilder), models: [{ name: "gpt-5.6-sol", reasoning_efforts: ["low", "medium", "high"] }, { name: "gpt-5.6-terra", reasoning_efforts: ["medium"] }],
  apps: [{ id: "drive", name: "Drive", permissions_ready: false }, { id: "slack", name: "Slack", permissions_ready: true }], versions: [{ id: "v2", name: "Published v2", version: 2 }],
};
const React = {
  useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; },
  useEffect(effect, dependencies) { const index = hookIndex++; const previous = effectDeps[index]; const changed = previous == null || dependencies == null || dependencies.length !== previous.length || dependencies.some((value, dependencyIndex) => !Object.is(value, previous[dependencyIndex])); if (changed) { effectDeps[index] = dependencies; effects.push(effect); } },
};
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__builderPage = { React, jsx, state };

const dependencies = ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "toolbar-breadcrumb", "app-connect-modal", "workspace-agent-detail-query", "duplicate-agent", "read-error", "builder-analytics"];
const mocks = Object.fromEntries(dependencies.map((name) => [name, "export {};\n"]));
mocks["app-shared"] = "const r=globalThis.__builderPage;export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;export const ZI='scope';export const LX=()=>({name:'scope'});export const HX=s=>s==='account'?r.state.accountId:s==='build'?r.state.buildPermission:s==='edit'?r.state.editFeature:r.state.slackFeature;";
mocks["app-initial"] = [
  "const r=globalThis.__builderPage;export const mun='account';export const Vw='build';export const Bw='edit';export const Hw='slack';export const l_n=()=>({agentId:r.state.agentId});export const o_n=()=> (path,options)=>r.state.navigations.push({path,options});",
  "export const rJt={safeGet:async(path)=>{r.state.requests.push({method:'GET',path});if(path.includes('builder-view'))return structuredClone(r.state.builder);if(path==='/hermes/models')return {models:r.state.models};if(path==='/hermes/apps')return {apps:r.state.apps};if(path.includes('published-versions'))return {versions:r.state.versions};},safePost:async(path,options)=>{r.state.requests.push({method:'POST',path,options});if(r.state.rejectCode){const e=new Error(r.state.rejectCode);e.code=r.state.rejectCode;throw e}if(path==='/hermes/agent')return {id:'agent-new'};const next=structuredClone(r.state.builder),body=options.requestBody;next.draft_revision='rev-2';next.draft_version={...next.draft_version,name:body.name,tagline:body.tagline,description:body.description,model_spec:body.model_spec,starter_prompts:body.starter_prompts,config:{...next.draft_version.config,prompt:body.prompt,tools:body.tools,persistent_folder:body.persistent_folder,deployments:body.deployments}};r.state.builder=structuredClone(next);return next}};",
].join("\n");
mocks["duplicate-agent"] = "export const a=props=>({type:'delete-agent-dialog',props});";
mocks["builder-analytics"] = "const r=globalThis.__builderPage;export const n=(_scope,payload)=>r.state.analytics.push(payload);";

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/workspace-agent-builder-page/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, metafile: true, logLevel: "silent", plugins: [{ name: "builder-page-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["WorkspaceAgentBuilderPage"]);
assert.equal(state.initialized, 1);
const source = fs.readFileSync(path.join(ROOT, "src/renderer/workspace-agent-builder-page/index.ts"), "utf8");
assert.deepEqual([...new Set([...source.matchAll(/(?:from\s+|import\s+)["']@rchunk\/([^"']+)["']/g)].map((match) => match[1]))], dependencies);
assert.deepEqual([...source.matchAll(/import\(["']@rchunk\/([^"']+)["']\)/g)], []);

function render(clear = false) { hookIndex = 0; effects.length = 0; if (clear) { hooks.length = 0; effectDeps.length = 0; } const view = module.WorkspaceAgentBuilderPage(); const running = effects.splice(0).map((effect) => effect()); return { view, running }; }
async function settle() { for (let index = 0; index < 10; index += 1) await Promise.resolve(); }
async function load(clear = true) { let result = render(clear); await settle(); return render(false).view; }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" "); return text(value.props?.children); }
function find(view, predicate) { return walk(view).find(predicate); }
function findAll(view, predicate) { return walk(view).filter(predicate); }
function button(view, label, last = false) { const values = findAll(view, (node) => node.type === "button" && text(node) === label); return last ? values.at(-1) : values[0]; }
function control(view, label, type) { const labelNode = find(view, (node) => node.type === "label" && text(node).startsWith(label)); return find(labelNode, (node) => node.type === type); }

state.accountId = null;
let view = render(true).view;
assert.equal(text(view), "Loading workspace…");
state.accountId = "acct-1"; view = await load(true);
assert.equal(text(view).includes("Finance Helper"), true);
assert.equal(text(view).includes("Changes stay in your draft"), true);
assert.equal(control(view, "Name", "input").props.value, "Finance Helper");
assert.equal(control(view, "Instructions", "textarea").props.value, "Be useful");
assert.equal(find(view, (node) => node.type === "select").props.value, "gpt-5.6-sol");
assert.equal(text(view).includes("Connection permissions need an update"), true);
assert.equal(text(view).includes("#finance @helper"), true);
assert.equal(button(view, "Save draft").props.disabled, false);
assert.equal(button(view, "Publish").props.disabled, false);

control(view, "Name", "input").props.onChange({ target: { value: "Updated Helper" } }); view = render().view;
assert.equal(text(view).includes("Updated Helper"), true);
const capabilityChecks = findAll(view, (node) => node.type === "input" && node.props.type === "checkbox");
capabilityChecks.find((node) => text(find(view, (label) => label.type === "label" && label.props.children?.includes?.(node))) === "")?.props?.onChange?.();
button(view, "Add starter prompt").props.onClick(); view = render().view;
assert.equal(text(view).includes("Starter prompt 2"), true);
assert.equal(button(view, "Save draft").props.disabled, true);
const starterNames = findAll(view, (node) => node.props?.["aria-label"] === "Starter prompt name");
starterNames[1].props.onChange({ target: { value: "Summarize" } }); view = render().view;
findAll(view, (node) => node.props?.["aria-label"] === "Starter prompt text")[1].props.onChange({ target: { value: "Summarize this" } }); view = render().view;
assert.equal(button(view, "Save draft").props.disabled, false);

const appCheckboxes = findAll(view, (node) => node.type === "input" && node.props.type === "checkbox" && typeof node.props.checked === "boolean");
const unchecked = appCheckboxes.find((node) => node.props.checked === false && node.props.onChange != null);
unchecked.props.onChange(); view = render().view;
assert.equal(findAll(view, (node) => node.type === "input" && node.props.type === "checkbox" && node.props.checked === true).length > 2, true);
const modelSelect = findAll(view, (node) => node.type === "select")[0];
modelSelect.props.onChange({ target: { value: "gpt-5.6-terra" } }); view = render().view;
assert.equal(findAll(view, (node) => node.type === "select")[0].props.value, "gpt-5.6-terra");

button(view, "Save draft").props.onClick(); await settle(); view = render().view;
const saveRequest = state.requests.findLast((request) => request.method === "POST");
assert.equal(saveRequest.path, "/hermes/agent/{agent_id}/save");
assert.equal(saveRequest.options.requestBody.name, "Updated Helper");
assert.equal(saveRequest.options.requestBody.expected_draft_revision, "rev-1");
assert.equal(state.analytics.at(-1).action, "save");
assert.equal(text(view).includes("Saved"), true);

button(view, "Publish").props.onClick(); view = render().view;
assert.equal(text(view).includes("Publish Updated Helper?"), true);
button(view, "Publish", true).props.onClick(); await settle();
const publishRequest = state.requests.findLast((request) => request.method === "POST");
assert.equal(publishRequest.path, "/hermes/agent/{agent_id}/save_publish");
assert.equal(publishRequest.options.requestBody.publish_type, "changes");
assert.equal(state.analytics.at(-1).action, "publish");

view = render().view; button(view, "Version history").props.onClick(); view = render().view;
assert.equal(text(view).includes("Published v2"), true);
button(view, "Add Slack channel").props.onClick(); view = render().view;
control(view, "Slack handle", "input").props.onChange({ target: { value: "new-helper" } }); view = render().view;
control(view, "Channel ID or link", "input").props.onChange({ target: { value: "c99" } }); view = render().view;
button(view, "Add channel").props.onClick(); view = render().view;
assert.equal(text(view).includes("#c99 @new-helper"), true);

button(view, "Delete").props.onClick(); view = render().view;
const deleteDialog = find(view, (node) => node.type === "delete-agent-dialog");
assert.equal(deleteDialog.props.agentId, "agent-1");
deleteDialog.props.onDeleted();
assert.deepEqual(state.navigations.at(-1), { path: "/agents", options: { replace: true } });

state.rejectCode = "draft_revision_mismatch"; view = render().view; button(view, "Save draft").props.onClick(); await settle(); view = render().view;
assert.equal(text(view).includes("draft changed elsewhere"), true);
assert.equal(control(view, "Name", "input").props.value, "Updated Helper");
state.rejectCode = null;

state.builder.agent.viewer_capability = "hermes_read_config"; view = await load(true);
assert.equal(text(view).includes("You don’t have permission to edit this agent"), true);
assert.equal(button(view, "Save draft"), undefined);
assert.ok(button(view, "Version history"));
assert.equal(button(view, "Delete"), undefined);
assert.equal(button(view, "Add Slack channel"), undefined);

state.agentId = null; state.builder = structuredClone(baseBuilder); view = await load(true);
assert.equal(text(view).includes("Create agent"), true);
assert.equal(text(view).includes("Create a draft before adding a Slack channel"), true);
assert.equal(button(view, "Create draft").props.disabled, true);
control(view, "Name", "input").props.onChange({ target: { value: "New Agent" } }); view = render().view;
control(view, "Instructions", "textarea").props.onChange({ target: { value: "Help everyone" } }); view = render().view;
button(view, "Create draft").props.onClick(); await settle();
assert.equal(state.requests.findLast((request) => request.method === "POST").path, "/hermes/agent");
assert.deepEqual(state.navigations.at(-1), { path: "/agents/agent-new/edit", options: { replace: true } });

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " workspace agent builder page assertions passed");
