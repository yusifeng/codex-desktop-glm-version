import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = path.join(ROOT, "src/renderer/visualization-annotation-editor/index.ts");
const source = fs.readFileSync(entryPoint, "utf8");
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const ok = (value) => { assertions++; assert.ok(value); };

deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), [
  "rolldown-runtime",
  "app-shared",
  "app-initial",
  "app-primary",
  "design-editor-state",
  "quick-chat-obstacles",
]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
equal(/\b[A-Z][A-Za-z]+Chunk\./.test(source), false);

const calls = { changes: [], effects: [], initializers: [], setters: [] };
let hookIndex = 0;
const hookValues = [];
const React = {
  useEffect(effect) { calls.effects.push(effect); },
  useId() { return "visualization-controls-title"; },
  useRef(initialValue) {
    const index = hookIndex++;
    if (!(index in hookValues)) hookValues[index] = { current: initialValue };
    return hookValues[index];
  },
  useState(initialValue) {
    const index = hookIndex++;
    if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue;
    return [hookValues[index], (value) => {
      hookValues[index] = typeof value === "function" ? value(hookValues[index]) : value;
      calls.setters.push(hookValues[index]);
    }];
  },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
};
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.window = { innerHeight: 800, innerWidth: 1200, addEventListener() {}, removeEventListener() {} };
globalThis.DOMRect = class DOMRect {
  constructor(x, y, width, height) { this.x = x; this.y = y; this.width = width; this.height = height; this.left = x; this.top = y; this.right = x + width; this.bottom = y + height; }
};
globalThis.__visualizationEditor = { calls, jsx, React };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const x=globalThis.__visualizationEditor;",
    "export const e6=()=>x.React;",
    "export const I3=()=>x.jsx;",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join(""),
  "app-initial": "export {};",
  "app-primary": "export {};",
  "design-editor-state": [
    "const x=globalThis.__visualizationEditor;",
    "export const c=()=>x.calls.initializers.push('design-layout');",
    "export const i=()=>x.calls.initializers.push('design-controls');",
    "export const t=()=>x.calls.initializers.push('design-state');",
    "export const n=(state,callback,value)=>{const changes=state.annotationControlChanges??[];const control=state.annotationControls.controls.find(item=>item.callback===callback);const prior=changes.find(item=>item.callback===callback);const next={callback,previousValue:prior?.previousValue??control?.currentValue,value:value??prior?.previousValue??control?.currentValue};return {...state,annotationControlChanges:prior?changes.map(item=>item.callback===callback?next:item):[...changes,next]};};",
    "export const r=props=>({type:'design-controls',props});",
  ].join(""),
  "quick-chat-obstacles": [
    "const x=globalThis.__visualizationEditor;",
    "export const a=()=>()=>{};",
    "export const f=()=>x.calls.initializers.push('quick-placement');",
    "export const n=()=>'';",
    "export const o=props=>({type:'resize-handles',props});",
    "export const r=()=>x.calls.initializers.push('quick-obstacles');",
    "export const t=()=>[];",
  ].join(""),
};
const result = await esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "visualization-annotation-editor-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
deepEqual(Object.keys(module), ["VisualizationAnnotationEditor"]);
deepEqual(calls.initializers, ["design-layout", "design-controls", "design-state", "quick-placement", "quick-obstacles"]);

function find(node, predicate) {
  if (node == null || typeof node !== "object") return null;
  if (predicate(node)) return node;
  const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
  for (const child of children) {
    if (Array.isArray(child)) { for (const nested of child) { const found = find(nested, predicate); if (found) return found; } }
    else { const found = find(child, predicate); if (found) return found; }
  }
  return null;
}
function render(overrides = {}) {
  hookIndex = 0;
  calls.effects.length = 0;
  return module.VisualizationAnnotationEditor({
    body: "",
    hasChanges: false,
    isOpen: true,
    onBodyChange(value) { calls.body = value; },
    onChange(id, state) { calls.changes.push([id, state]); },
    onClose() { calls.closed = (calls.closed ?? 0) + 1; },
    onOpen() { calls.opened = (calls.opened ?? 0) + 1; },
    onReset() { calls.reset = (calls.reset ?? 0) + 1; },
    onSelect(id) { calls.selected = id; },
    onSubmit() { calls.submitted = (calls.submitted ?? 0) + 1; },
    selectedId: "chart-1",
    states: [{
      id: "chart-1",
      targetLabel: "Revenue chart",
      annotationControls: { controls: [{ callback: "setVisible", currentValue: true, label: "Visible", type: "toggle" }] },
      annotationControlChanges: [{ callback: "setVisible", previousValue: true, value: false }],
    }],
    ...overrides,
  });
}

equal(render({ states: [] }), null);
const view = render();
equal(view.type, "div");
equal(view.props["data-testid"], "visualization-annotation-ui");
const trigger = find(view, (node) => node.type === "button" && node.props["aria-label"] === "Adjust visualization");
ok(trigger);
trigger.props.onClick();
equal(calls.opened, 1);
const dialog = find(view, (node) => node.props?.role === "dialog");
ok(dialog);
equal(dialog.props["aria-labelledby"], "visualization-controls-title");
ok(find(view, (node) => node.type === "resize-handles"));
const reset = find(view, (node) => node.type === "button" && node.props["aria-label"] === "Reset all");
equal(reset.props.disabled, false);
reset.props.onClick();
equal(calls.reset, 1);
const close = find(view, (node) => node.type === "button" && node.props["aria-label"] === "Close design controls");
close.props.onClick();
equal(calls.closed, 1);
const section = find(view, (node) => node.type === "section");
equal(section.props["aria-label"], "Revenue chart");
equal(section.props["data-selected"], "true");
section.props.onPointerDownCapture();
equal(calls.selected, "chart-1");
const controls = find(view, (node) => node.type === "design-controls");
equal(controls.props.isEditable, true);
controls.props.onValueChange("setVisible", true);
equal(calls.changes.at(-1)[0], "chart-1");
equal(calls.changes.at(-1)[1].annotationControlChanges[0].value, true);
controls.props.onReset("setVisible");
equal(calls.changes.at(-1)[1].annotationControlChanges[0].value, true);
const textarea = find(view, (node) => node.type === "textarea");
textarea.props.onChange({ currentTarget: { value: "Make bars blue" } });
equal(calls.body, "Make bars blue");
let requested = 0;
let prevented = 0;
textarea.props.onKeyDown({ key: "Enter", nativeEvent: { isComposing: false }, preventDefault() { prevented++; }, currentTarget: { form: { requestSubmit() { requested++; } } } });
equal(prevented, 1);
equal(requested, 1);
textarea.props.onKeyDown({ key: "Enter", nativeEvent: { isComposing: true }, preventDefault() { prevented++; }, currentTarget: { form: { requestSubmit() { requested++; } } } });
equal(prevented, 1);
equal(requested, 1);
const submit = find(view, (node) => node.type === "button" && node.props.type === "submit");
equal(submit.props.disabled, true);
const form = find(view, (node) => node.type === "form");
form.props.onSubmit({ preventDefault() { prevented++; } });
equal(calls.submitted ?? 0, 0);

const changedView = render({ body: "Please adjust", submitting: false });
const changedSubmit = find(changedView, (node) => node.type === "button" && node.props.type === "submit");
equal(changedSubmit.props.disabled, false);
find(changedView, (node) => node.type === "form").props.onSubmit({ preventDefault() {} });
equal(calls.submitted, 1);
const loadingView = render({ body: "Please adjust", submitting: true });
equal(find(loadingView, (node) => node.type === "button" && node.props.type === "submit").props.disabled, true);
equal(find(loadingView, (node) => node.type === "textarea").props.disabled, true);
equal(find(loadingView, (node) => node.type === "design-controls").props.isEditable, false);
const closedView = render({ isOpen: false });
equal(find(closedView, (node) => node.props?.role === "dialog"), null);
ok(find(closedView, (node) => node.props?.["aria-label"] === "Adjust visualization"));

console.log(`visualization-annotation-editor tests passed (${assertions} assertions)`);
