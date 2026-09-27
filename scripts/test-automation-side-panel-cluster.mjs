import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resetState() {
  globalThis.__automationPanelTest = {
    definitions: [],
    dismissals: [],
    families: [],
    opens: [],
    setupState: null,
    tabTarget: null,
    jsx: { jsx: (type, props) => ({ type, props: props ?? {} }) },
  };
  return globalThis.__automationPanelTest;
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
    plugins: [{
      name: "automation-panel-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8), namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
          if (value === "app-shared") return { contents: `
            const state=globalThis.__automationPanelTest; const noop=()=>{};
            export const FX=noop,QI=noop,H3=noop,lw=noop,qm=noop;
            export const ZI={}; export const oZ=(_scope,factory)=>(state.families.push(factory),{factory});
            export const I3=()=>state.jsx; export const wy=Symbol("FallbackIcon");
            export const Jm=(loader,options)=>{const component=()=>null;component.loader=loader;component.options=options;return component};
          `, loader: "js" };
          if (value === "app-initial") return { contents: `
            const state=globalThis.__automationPanelTest; const noop=()=>{};
            export const Fg="automation-route",QCt={},ttt={},mun={},_un={};
            export const Wvt=noop,Sun=noop,Ng=noop,_vt=noop,ZCt=noop,Ig=noop,stt=noop;
            export const qvt={tabStateById$:Symbol("right-state")}; export const Vvt={tabStateById$:Symbol("bottom-state")};
            export const zg=(key)=>"automation-suggestion:"+key;
            export const gvt=()=>state.tabTarget;
            export const Pg=(definition)=>(state.definitions.push(definition),definition);
            export const Gvt=(_scope,_definition,options)=>state.opens.push(options);
          `, loader: "js" };
          if (value === "elicitation-events") return { contents: `
            export const t=()=>{};
            export const n=(scope,elicitation,result)=>globalThis.__automationPanelTest.dismissals.push({scope,elicitation,result});
          `, loader: "js" };
          if (value === "site-automation-setup-state") return { contents: `
            export const n={}; export const t=()=>{};
          `, loader: "js" };
          if (value === "automation-side-panel-tab-core") return { contents: `
            export const AutomationSidePanelTabIcon=()=>null;
          `, loader: "js" };
          return { contents: "export {};", loader: "js" };
        });
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

let state = resetState();
const setupState = await bundle("site-automation-setup-state");
setupState.t();
assert.equal(state.families.length, 1);
assert.equal(state.families[0]("key"), null);
assert.equal(typeof setupState.n, "object");

state = resetState();
const automations = await bundle("open-automation-side-panel-tab");
automations.t();
assert.equal(state.definitions.length, 1);
assert.equal(typeof state.definitions[0].open, "function");
assert.equal(typeof state.definitions[0].restore, "function");

const tabStates = new Map();
const scope = {
  values: new Map(),
  query: {
    async getOrFetch(query, parameter) {
      if (parameter != null) return { automation: { title: `Detail ${parameter}` } };
      return { items: [{ id: "a1", name: "Daily summary" }] };
    },
  },
  get(signal, parameter) {
    if (typeof signal === "symbol") return tabStates.get(`${String(signal)}:${parameter}`) ?? null;
    if (parameter != null) return state.setupState;
    return this.values.get(signal) ?? null;
  },
  set(signal, parameter, value) { this.values.set(`${String(signal)}:${parameter}`, value); state.lastSet = { signal, parameter, value }; },
};

automations.n({ scope, automationId: "a1", title: "Daily summary" });
assert.equal(state.opens.length, 1);
assert.equal(state.opens[0].id, "automation:a1");
assert.equal(state.opens[0].durableRoute.kind, "automation-route");
assert.deepEqual(state.opens[0].props.request, { type: "automation", automationId: "a1" });
assert.equal(state.opens[0].target, "right");
assert.equal(state.opens[0].title, "Daily summary");
assert.equal(state.opens[0].defaultState().savedAutomationId, null);

assert.equal(await automations.a(scope, "a1", {}), true);
assert.equal(state.opens.at(-1).title, "Daily summary");
assert.equal(await automations.a(scope, "a2", {}), true);
assert.equal(state.opens.at(-1).title, "Detail a2");

automations.r({ scope, seed: { directiveKey: "weekly" }, title: "Weekly" });
assert.equal(state.opens.at(-1).id, "automation-suggestion:weekly");
assert.equal(state.opens.at(-1).props.request.type, "suggestion");

const elicitation = { id: "e1" };
automations.r({ scope, seed: { directiveKey: "ask", elicitation }, title: "Ask" });
const suggestionTab = state.opens.at(-1);
tabStates.set(`${String(Object.getOwnPropertySymbols({})[0])}:unused`, null);
const closingScope = {
  get: () => ({ value: { savedAutomationId: null } }),
};
suggestionTab.onClose(closingScope, "right");
assert.equal(state.dismissals.length, 1);
assert.equal(state.dismissals[0].elicitation, elicitation);
assert.equal(state.dismissals[0].result, "dismiss");

scope.values.set(Object.keys(scope.values)[0], "unused");
state.setupState = { status: "saved" };
automations.i({ scope, projectId: "p1", title: "Publish site" });
assert.equal(state.opens.at(-1).id, "site-automation:p1");
assert.equal(state.opens.at(-1).props.request.type, "site");
assert.equal(state.opens.at(-1).title, "Publish site");
assert.equal(state.lastSet.value, null);

console.log("26 automation side-panel cluster assertions passed");
