import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const react = { useRef: value => ({ current: value }), useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; } };
globalThis.__jsx = jsx;
globalThis.__react = react;

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => modulePath === "app-shared"
        ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx; export const e6=()=>globalThis.__react;" }
        : { loader: "js", contents: "export default {};" });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const work = await load("work-mode-upsell-modal");
let workClosed = 0;
let selectedPlan = null;
const workModal = work.WorkModeUpsellModal({ accountKind: "business", onClose: () => workClosed++, onUpgrade: (_event, plan) => { selectedPlan = plan; } });
assert.equal(workModal.type, "dialog");
assert.equal(workModal.props.children[1].props.children, "Meet ChatGPT Work");
assert.equal(workModal.props.children[3].props.children, "Unlock with Business");
workModal.props.children[3].props.onClick({});
assert.equal(workClosed, 1);
assert.equal(selectedPlan, "business");

const quietHoursReleaseAssertions = assertReleaseOwner("quiet-hours-active-dialog");

const modelPickerReleaseAssertions = assertReleaseOwner("model-picker-upsell-modal");

const firstLimitReleaseAssertions = assertReleaseOwner("first-limit-dialog");

const remote = await load("remote-connection-editor-modal");
const unavailable = remote.RemoteConnectionEditorModal({ hostId: "missing", onClose() {} });
assert.equal(unavailable.props.children[0].props.children, "Loading connection");
const missing = remote.RemoteConnectionEditorModal({ connections: [], hostId: "missing", onClose() {} });
assert.equal(missing.props.children[0].props.children, "Connection unavailable");
let savedHost = null;
let editorClosed = 0;
const editor = remote.RemoteConnectionEditorModal({ connection: { displayName: "Server", host: "example.com", hostId: "remote-1" }, hostId: "remote-1", onClose() { editorClosed++; }, onSave: (connection) => { savedHost = connection.host; } });
assert.equal(editor.props["data-host-id"], "remote-1");
const editorForm = editor.props.children[1];
editorForm.props.children[1].props.children[1].props.onChange({ currentTarget: { value: "new.example.com" } });
await editorForm.props.onSubmit({ preventDefault() {} });
assert.equal(savedHost, "new.example.com");
assert.equal(editorClosed, 1);
const colorOnly = remote.RemoteConnectionEditorModal({ connection: { displayName: "Laptop", hostId: "remote-2", kind: "remote-control", color: "#112233" }, hostId: "remote-2", onClose() {}, onSave() {} });
assert.equal(colorOnly.props["data-connection-kind"], "remote-control");
assert.equal(colorOnly.props.children[1].props.children.filter(Boolean).some(node => node.props?.children?.[0] === "Host"), false);

console.log(`account modals cluster complete (${modelPickerReleaseAssertions + quietHoursReleaseAssertions + firstLimitReleaseAssertions} release assertions)`);
