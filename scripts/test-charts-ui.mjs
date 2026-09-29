import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const modules = {
  PieChart: { dependencies: ["rolldown-runtime","app-shared","i18n"], exports: ["n","t"] },
  "chart-indicator": { dependencies: ["rolldown-runtime","app-shared","app-initial","contracts"], exports: ["EpicChartIndicator"] },
};
let sourceAssertions = 0;
const sourceAssert = (condition, message) => { sourceAssertions += 1; assert.ok(condition, message); };
for (const [name, expectation] of Object.entries(modules)) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", name, "index.ts"), "utf8");
  const dependencies = [...source.matchAll(/@rchunk\/([^";]+)/g)].map((match) => match[1]);
  sourceAssert(JSON.stringify(dependencies) === JSON.stringify(expectation.dependencies), name + " exact dependencies");
  sourceAssert(!source.includes("import("), name + " no dynamic dependencies");
  sourceAssert(!/\bany\b/.test(source), name + " no any");
  sourceAssert(!/\w+Chunk\.[A-Za-z_$]/.test(source), name + " no direct namespace consumption");
  for (const exported of expectation.exports) sourceAssert(name === "PieChart" ? source.includes(" as " + exported) : source.includes("export { " + exported + " }"), name + " export " + exported);
}

const state = globalThis.__chartsUiTest = { initializers: [], layouts: [], nativePending: null, nativeValue: null, nativeDestination: null, messages: {}, query: { isError: false }, apiCalls: [], subscriptions: [] };
const jsx = { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const React = {
  useCallback(callback) { return callback; },
  useId() { return "pie-id"; },
  useLayoutEffect(effect) { state.layouts.push(effect); },
  useMemo(factory) { return factory(); },
  useState(initial) { let value = initial; return [value, (next) => { value = typeof next === "function" ? next(value) : next; }]; },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
};
const marker = (name) => "() => globalThis.__chartsUiTest.initializers.push(" + JSON.stringify(name) + ")";
const commonShared = [
  "export const I3=()=>globalThis.__chartsUiTest.jsx;export const e6=()=>globalThis.__chartsUiTest.React;",
  "export const K2=" + marker("compiler") + ";export const n4=()=>({formatNumber:value=>Math.round(value*1000)/10+'%'});",
].join("\n");
const pieMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": commonShared,
  "i18n": [
    "export const g=" + marker("chart-runtime") + ";export const S=" + marker("charts") + ";",
    "export const C=()=>({theme:'dark',isPrimarilyTouchDevice:false});export const _=value=>value==='blue';export const b=value=>value;",
    "export const c='Cell';export const d='RechartsPieChart';export const f='ResponsiveContainer';export const l='Legend';export const p='Tooltip';export const s='ChartContainer';export const u='Pie';",
    "export const h=(_intl,value)=>value==null?null:String(value);export const m=(...values)=>values.filter(Boolean).join(' ');",
    "export const v=(_theme,color)=>typeof color==='object'?color.dark:color;export const y=()=>()=> 'evaluated';",
  ].join("\n"),
};
Object.assign(state, { jsx, React });

async function load(name, mocks) {
  const entry = path.join(ROOT, "src/renderer", name, "index.ts");
  const result = await esbuild.build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: mocks[dependency] ?? "export {};", loader: "js" })); } }] });
  const out = path.join("/tmp", name.replaceAll("/", "-") + "-" + process.pid + ".mjs");
  fs.writeFileSync(out, result.outputFiles[0].text);
  const loaded = await import(pathToFileURL(out).href);
  fs.unlinkSync(out);
  return loaded;
}

let runtimeAssertions = 0;
const runtimeAssert = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };

const pie = await load("PieChart", pieMocks);
runtimeAssert(Object.keys(pie).sort(), ["n","t"], "PieChart exact exports");
runtimeAssert(state.initializers, ["chart-runtime","charts","compiler"], "PieChart initializer order");
const pieView = pie.t({ id:"sales", role:"img", "data-test":"pie", ignored:"kept", data:[{category:"One",value:30},{category:"Two",value:70,fill:{light:"pink",dark:"purple"}}], series:[{dataKey:"value",label:"Sales",color:"blue"}], xAxis:{dataKey:"category",labels:{One:"First"}}, showValueLabels:true, dimInactiveSlices:true });
runtimeAssert(pieView.type, "ChartContainer", "chart container root");
runtimeAssert(pieView.props["data-w-component"], "pie-chart", "chart marker");
runtimeAssert(pieView.props.id, "sales", "safe id forwarded");
runtimeAssert(pieView.props["data-test"], "pie", "data prop forwarded");
runtimeAssert(pieView.props.aspectRatio, 4/3, "default aspect ratio");
const chart = pieView.props.children.props.children;
runtimeAssert(chart.type, "RechartsPieChart", "recharts root");
const tooltip = chart.props.children[0];
const legend = chart.props.children[1];
const slices = chart.props.children[2];
runtimeAssert(tooltip.type, "Tooltip", "tooltip enabled");
runtimeAssert(legend.props.payload.map((entry) => entry.value), ["First","Two"], "legend labels resolved");
runtimeAssert(slices.props.data[0].fill, "var(--blue-400)", "palette color resolved");
runtimeAssert(slices.props.data[1].fill, "purple", "dual theme color resolved");
runtimeAssert(slices.props.data[0].__sliceId, "pie-id-0", "stable slice id");
runtimeAssert(slices.props.isAnimationActive, true, "animation initially active");
runtimeAssert(slices.props.label({value:30,payload:{formatted:"30 units"}}), "30 units", "formatted label preferred");
const tooltipView = tooltip.props.content({active:true,payload:[{value:30,name:"First",dataKey:"value",payload:{__sliceLabel:"First",fill:"red"},color:"red"}]});
runtimeAssert(tooltipView.props.children[1].props.children, "30", "tooltip value formatted");
const legendView = legend.props.content(legend.props);
runtimeAssert(legendView.props.children.length, 2, "legend items rendered");
runtimeAssert(state.layouts.length >= 2, true, "layout effects registered");

state.initializers = [];
const listeners = new Map();
globalThis.addEventListener = (name, listener) => { listeners.set(name, listener); state.subscriptions.push(["add",name]); };
globalThis.removeEventListener = (name) => { listeners.delete(name); state.subscriptions.push(["remove",name]); };
globalThis.__oaiEpicNativeLaunch = {
  pending: () => state.nativePending,
  get: () => state.nativeValue,
  destination: () => state.nativeDestination,
  ownsMessage: (id) => id === "owned",
};
const indicatorMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "export const $3=" + marker("shared") + ";export const gL=" + marker("query-runtime") + ";export const FX=" + marker("signals") + ";export const K2=" + marker("compiler") + ";export const q4=" + marker("query-client") + ";",
    "export const I3=()=>globalThis.__chartsUiTest.jsx;export const e6=()=>globalThis.__chartsUiTest.React;export const Y2='FormattedMessage';",
    "export const BX=()=>globalThis.__chartsUiTest.messages;export const _L=options=>{globalThis.__chartsUiTest.queryOptions=options;return globalThis.__chartsUiTest.query;};",
    "const stringSchema={nullable(){return this},optional(){return this}};export const g4=()=>stringSchema;",
    "export const H4=()=>({safeParse:value=>value&&typeof value.epic_patient_label==='string'?{success:true,data:value}:{success:false}});",
  ].join("\n"),
  "app-initial": [
    "export const cJt=" + marker("epic-queries") + ";export const uHt=" + marker("native-launch") + ";export const r7=" + marker("epic-runtime") + ";",
    "export const RVt={};export const n7='CompactNotice';export const rJt={safePost:async(path,options)=>{globalThis.__chartsUiTest.apiCalls.push([path,options]);return {patient_label:'Fetched Patient',encounter_label:'Fetched Encounter'};}};",
  ].join("\n"),
  "contracts": "export const r=" + marker("contracts") + ";export const t='epic-native-launch';",
};
const indicator = await load("chart-indicator", indicatorMocks);
runtimeAssert(Object.keys(indicator), ["EpicChartIndicator"], "indicator unique export");
runtimeAssert(state.initializers, ["shared","query-runtime","signals","compiler","query-client","epic-queries","native-launch","epic-runtime","contracts"], "indicator initializer order");
state.messages = { one:{message:{metadata:{epic_patient_label:"Patient A",epic_encounter_label:"Visit 1"}}} };
let indicatorView = indicator.EpicChartIndicator({conversationId:"conversation"});
runtimeAssert(indicatorView.type, "CompactNotice", "metadata renders notice");
runtimeAssert(indicatorView.props.content.props.values, {patient:"Patient A",encounter:"Visit 1"}, "metadata labels");
state.messages = { one:{message:{metadata:{epic_patient_label:"Patient B"}}} };
indicatorView = indicator.EpicChartIndicator({conversationId:"conversation"});
runtimeAssert(indicatorView.props.content, "Patient B", "patient-only label");
state.messages = { one:{message:{id:"owned"}} };
state.nativeValue = "snapshot";
state.nativeDestination = "destination";
state.query = { isError:false, data:{patient_label:"Fetched",encounter_label:"Encounter"} };
indicatorView = indicator.EpicChartIndicator({conversationId:"conversation"});
runtimeAssert(state.queryOptions.queryKey, ["epic-launch-preview","destination"], "native launch query key");
runtimeAssert(state.queryOptions.enabled, true, "native launch query enabled");
runtimeAssert(indicatorView.props.content.props.values, {patient:"Fetched",encounter:"Encounter"}, "resolved launch labels");
state.query = { isError:true };
indicatorView = indicator.EpicChartIndicator({conversationId:"conversation"});
runtimeAssert(indicatorView.props.content.props.id, "epic.chart.unavailable", "unavailable recovery message");
state.messages = {};
state.nativeValue = null;
state.query = { isError:false };
runtimeAssert(indicator.EpicChartIndicator({conversationId:"conversation"}), null, "no chart context renders null");

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
