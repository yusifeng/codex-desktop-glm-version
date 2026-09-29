import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/chart-content-reference/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const hookState = [];
let hookIndex = 0;
const fakeElement = {
  attributes: new Map(),
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; },
  removeAttribute(name) { this.attributes.delete(name); },
  setAttribute(name, value) { this.attributes.set(name, value); },
};
const calls = {
  autoReady: false,
  chartProps: [],
  clipboard: [],
  createdUrls: [],
  domToBlob: [],
  filterResult: null,
  initializers: [],
  links: [],
  revokedUrls: [],
};
const React = {
  useRef(initial) {
    const index = hookIndex++;
    if (!(index in hookState)) hookState[index] = { current: initial };
    return hookState[index];
  },
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial;
    return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    if (typeof type === "function") return type(props ?? {});
    if (props?.ref != null) props.ref(fakeElement);
    return { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    if (typeof type === "function") return type(props ?? {});
    if (props?.ref != null) props.ref(fakeElement);
    return { type, props: props ?? {}, key };
  },
};

Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText(value) { calls.clipboard.push(value); return Promise.resolve(); } } } });
Object.defineProperty(globalThis, "window", { configurable: true, value: { devicePixelRatio: 3 } });
Object.defineProperty(globalThis, "document", { configurable: true, value: {
  fonts: { ready: Promise.resolve() },
  createElement(type) {
    const link = { type, href: "", download: "", clicked: false, click() { this.clicked = true; } };
    calls.links.push(link);
    return link;
  },
} });
Object.defineProperty(globalThis, "requestAnimationFrame", { configurable: true, value(callback) { callback(); return 1; } });
Object.defineProperty(globalThis, "URL", { configurable: true, value: {
  createObjectURL(blob) { calls.createdUrls.push(blob); return "blob:chart"; },
  revokeObjectURL(value) { calls.revokedUrls.push(value); },
} });
globalThis.__chartContentReference = { React, jsx, calls };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__chartContentReference;",
    "export const $3=()=>r.calls.initializers.push('lazy-runtime');",
    "export const H3=()=>r.calls.initializers.push('lazy-components');",
    "export const I3=()=>r.jsx;",
    "export const e6=()=>r.React;",
    "export const Qh=()=>({type:'spinner',props:{}});",
    "export const Jm=()=>props=>{r.calls.chartProps.push(props);if(r.calls.autoReady)props.onReady();return {type:'chart-widget',props};};",
  ].join(""),
  "app-initial": "export {};",
  "bar-sizing": "const r=globalThis.__chartContentReference;export const a=()=>r.calls.initializers.push('bar-sizing');export const n=chart=>chart.layout==='vertical'?{height:'500px'}:undefined;",
  "chart": "export const ChartWidget=props=>({type:'real-chart-widget',props});",
  "i18n": "export {};",
  "with-selector": "export {};",
  "react-redux": "export {};",
  "use-stable-callback-chart": "export {};",
  "chart-stores": "export {};",
  "chart-colors": "export {};",
  "PieChart": "export {};",
  "dom-to-blob": "const r=globalThis.__chartContentReference;export const domToBlob=async(node,options)=>{r.calls.domToBlob.push([node,options]);r.calls.filterResult=options.filter({closest:()=>({excluded:true})});return new Blob(['png']);};",
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "chart-content-reference-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function reset() {
  hookState.length = 0;
  hookIndex = 0;
  fakeElement.attributes.clear();
  calls.autoReady = false;
  calls.chartProps.length = 0;
  calls.clipboard.length = 0;
  calls.createdUrls.length = 0;
  calls.domToBlob.length = 0;
  calls.filterResult = null;
  calls.links.length = 0;
  calls.revokedUrls.length = 0;
}
function render(props) { hookIndex = 0; return module.ChatGptChartContentReference(props); }
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function text(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join(" ");
  return text(value.props?.children);
}
function findButton(view, label) { return walk(view).find((node) => node.type === "button" && (node.props["aria-label"] === label || text(node) === label)); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

deepEqual(Object.keys(module), ["ChatGptChartContentReference"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "bar-sizing"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), ["chart", "dom-to-blob"]);
equal(source.includes("FORMULA_PREFIX"), true);
equal(source.includes("recharts-tooltip-wrapper"), true);
equal(source.includes('data-testid": "chatgpt-chart-content-reference"'), true);
deepEqual(calls.initializers, ["lazy-runtime", "lazy-components", "bar-sizing"]);

reset();
let view = render({ contentReferenceIndex: 0, reference: null });
equal(view.props.role, "alert");
equal(text(view), "Unsupported chart reference");

reset();
view = render({ contentReferenceIndex: 0, isStreaming: true, reference: { data: { content: {} } } });
equal(view.props.role, "status");
equal(view.props["aria-label"], "Loading chart");
equal(walk(view).some((node) => node.type === "spinner"), true);
reset();
view = render({ contentReferenceIndex: 0, reference: { data: { content: {} }, matched_text: "chart" } });
equal(view.props.role, "status");

reset();
equal(render({ contentReferenceIndex: 0, reference: { data: { content: "{" } } }), null);
equal(render({ contentReferenceIndex: 0, reference: { data: { content: { chartType: "radar", data: [] } } } }), null);

const barSpec = {
  chartType: "bar",
  data: [{ month: "Jan", revenue: 1200, formula: "=SUM(A1)" }, { month: "Feb", revenue: 2400, formula: "+B1" }],
  layout: "vertical",
  meta: { title: "Revenue by Month", description: "Monthly revenue", footer: "Source: Finance" },
};
const barReference = { data: { content: JSON.stringify(barSpec) } };
reset();
view = render({ contentReferenceIndex: 2, reference: barReference });
equal(view.props["data-testid"], "chatgpt-chart-content-reference");
deepEqual(view.props.style, { height: "500px" });
equal(text(view).includes("Revenue by Month"), true);
equal(text(view).includes("Monthly revenue"), true);
equal(text(view).includes("Source: Finance"), true);
equal(text(view).includes("Jan: revenue 1.2K"), true);
equal(calls.chartProps.at(-1).chart.xKey, "month");
equal(calls.chartProps.at(-1).chart.valueKey, "revenue");
deepEqual(calls.chartProps.at(-1).chart.series, [{ dataKey: "revenue", label: "revenue", valueFormat: "compact", valuePrefix: "", valueSuffix: "" }]);

const toggle = findButton(view, "View as table");
ok(toggle);
toggle.props.onClick();
view = render({ contentReferenceIndex: 2, reference: barReference });
ok(findButton(view, "View as chart"));
equal(text(view).includes("Month"), true);
equal(text(view).includes("Revenue"), true);
equal(text(view).includes("=SUM(A1)"), true);
findButton(view, "Copy table").props.onClick();
await flush();
equal(calls.clipboard.length, 1);
equal(calls.clipboard[0], "Month\tRevenue\tFormula\nJan\t1200\t'=SUM(A1)\nFeb\t2400\t'+B1");

reset();
view = render({ contentReferenceIndex: 3, reference: { data: { content: { chartType: "line", data: [] } } } });
equal(findButton(view, "View as table"), undefined);

reset();
view = render({ contentReferenceIndex: 4, reference: { data: { content: { chartType: "pie", data: [{ name: "Alpha", amount: 7 }] } } } });
equal(calls.chartProps.at(-1).chart.nameKey, "name");
equal(calls.chartProps.at(-1).chart.valueKey, "amount");
equal(text(view).includes("Alpha: 7"), true);

reset();
calls.autoReady = true;
view = render({ contentReferenceIndex: 5, reference: barReference });
view = render({ contentReferenceIndex: 5, reference: barReference });
const download = findButton(view, "Download as image");
equal(download.props.disabled, false);
download.props.onClick();
await flush();
equal(calls.domToBlob.length, 1);
equal(calls.domToBlob[0][0], fakeElement);
equal(calls.domToBlob[0][1].scale, 2);
equal(calls.filterResult, false);
equal(calls.links[0].download, "Revenue by Month.png");
equal(calls.links[0].clicked, true);
deepEqual(calls.revokedUrls, ["blob:chart"]);
equal(fakeElement.getAttribute("data-chart-widget-downloading"), null);

console.log("chart-content-reference tests passed (" + assertions + " assertions)");
