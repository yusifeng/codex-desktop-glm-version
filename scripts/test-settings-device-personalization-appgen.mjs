import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__settingsDeviceTest = {
  accountId: "account-1",
  featureGate: true,
  hooks: [],
  hookIndex: 0,
  personalization: true,
  service: null,
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const ReactRuntime = {
  useState(initialValue) {
    const index = state.hookIndex++;
    if (!(index in state.hooks)) state.hooks[index] = typeof initialValue === "function" ? initialValue() : initialValue;
    return [state.hooks[index], (value) => { state.hooks[index] = typeof value === "function" ? value(state.hooks[index]) : value; }];
  },
};

async function load(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "settings-device-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({
          loader: "js",
          contents: value === "app-shared"
            ? `export const I3=()=>globalThis.__settingsDeviceTest.jsx; export const HX=(signal)=>signal.id==="account"?globalThis.__settingsDeviceTest.accountId:globalThis.__settingsDeviceTest.personalization; export const e6=globalThis.__settingsDeviceTest.ReactRuntime;`
            : value === "app-initial"
              ? `export const pnt={get codexMicro(){return globalThis.__settingsDeviceTest.service}}; export const U6t={id:"account"}; export const xun={id:"personalization"}; export const ofn=()=>globalThis.__settingsDeviceTest.featureGate;`
              : "export {};",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
state.jsx = jsx;
state.ReactRuntime = ReactRuntime;
function walk(node, output = []) {
  if (node == null || typeof node !== "object") return output;
  output.push(node);
  const children = node.props?.children;
  (Array.isArray(children) ? children.flat(Infinity) : [children]).forEach((child) => walk(child, output));
  return output;
}
function text(node) {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(text).join(" ");
  return text(node.props?.children);
}

const micro = await load("codex-micro-settings");
assert.deepEqual(Object.keys(micro), ["CodexMicroSettings"]);
assert.equal(micro.CodexMicroSettings({ codexMicro: null }), null);
let opened = 0;
const changes = [];
const service = { openInputMonitoringSettings() { opened++; } };
const microUi = micro.CodexMicroSettings({ codexMicro: service, permissionStatus: "denied", connectionStatus: "connection-failed", settings: { lightingBrightness: 60 }, onSettingChange(key, value) { changes.push([key, value]); } });
assert.equal(microUi.props["data-settings-page"], "codex-micro");
assert.match(text(microUi), /Codex Micro/);
assert.match(text(microUi), /connection failed/);
const microNodes = walk(microUi);
microNodes.find((node) => text(node) === "Open Input Monitoring settings").props.onClick();
microNodes.find((node) => node.props?.["aria-label"] === "Layout").props.onChange({ currentTarget: { value: "developer" } });
microNodes.find((node) => node.props?.type === "range").props.onChange({ currentTarget: { valueAsNumber: 42 } });
assert.deepEqual({ opened, changes }, { opened: 1, changes: [["layout", "developer"], ["lightingBrightness", 42]] });

const personalization = await load("personalization-settings");
assert.deepEqual(Object.keys(personalization), ["ChatGptPersonalizationSettings"]);
state.personalization = false;
assert.match(text(personalization.ChatGptPersonalizationSettings()), /unavailable/);
state.personalization = true;
let memoryEnabled;
let removedMemory;
let removedPhoto;
let saved = 0;
const personalizationUi = personalization.ChatGptPersonalizationSettings({ memories: [{ id: "m1", text: "Likes tea" }], referencePhotos: [{ id: "p1", name: "Portrait" }], onMemoryEnabledChange(value) { memoryEnabled = value; }, onRemoveMemory(id) { removedMemory = id; }, onRemoveReferencePhoto(id) { removedPhoto = id; }, onSave() { saved++; } });
assert.equal(personalizationUi.props["data-account-id"], "account-1");
assert.match(text(personalizationUi), /Computer History/);
const personalizationNodes = walk(personalizationUi);
personalizationNodes.find((node) => node.props?.type === "checkbox" && node.props.checked).props.onChange({ currentTarget: { checked: false } });
const removeButtons = personalizationNodes.filter((node) => node.type === "button" && text(node) === "Remove");
removeButtons[0].props.onClick();
removeButtons[1].props.onClick();
personalizationNodes.find((node) => node.type === "button" && text(node) === "Save").props.onClick();
assert.deepEqual({ memoryEnabled, removedMemory, removedPhoto, saved }, { memoryEnabled: false, removedMemory: "m1", removedPhoto: "p1", saved: 1 });

const appgen = await load("appgen-settings-page");
assert.deepEqual(Object.keys(appgen), ["n", "r", "t"]);
assert.equal(appgen.n({ projectId: "", onDeleted() {} }).props["data-redirect"], "/sites");
state.hooks = [];
state.hookIndex = 0;
let deleted = 0;
let savedInput;
const appgenProps = { projectId: "project-1", initialTitle: "Old title", initialEnvironmentDraft: { buildCommand: "npm run build" }, onDeleted() { deleted++; }, async onSave(input) { savedInput = input; } };
let appgenUi = appgen.t(appgenProps);
let appgenNodes = walk(appgenUi);
appgenNodes.find((node) => node.props?.name === "title").props.onChange({ currentTarget: { value: "New title" } });
appgenNodes.find((node) => node.props?.name === "outputDirectory").props.onChange({ currentTarget: { value: "dist" } });
state.hookIndex = 0;
appgenUi = appgen.t(appgenProps);
appgenNodes = walk(appgenUi);
await appgenNodes.find((node) => node.type === "button" && text(node) === "Save").props.onClick();
appgenNodes.find((node) => node.type === "button" && text(node) === "Delete site").props.onClick();
assert.deepEqual(savedInput, { title: "New title", environment: { buildCommand: "npm run build", outputDirectory: "dist" } });
assert.equal(deleted, 1);

console.log("31 device, personalization and AppGen settings assertions passed");
