import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

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

const quiet = await load("quiet-hours-active-dialog");
let quietClosed = false;
const quietModal = quiet.QuietHoursActiveDialog({ accountId: "a", userId: "u", timeZone: "UTC", nextAllowedAt: new Date("2026-09-27T10:00:00Z"), onClose: () => { quietClosed = true; } });
assert.equal(quietModal.props["data-account-id"], "a");
assert.equal(quietModal.props.children[0].props.children, "Time for a break");
assert.match(quietModal.props.children[1].props.children, /10:00/);
quietModal.props.children[2].props.onClick();
assert.equal(quietClosed, true);
assert.equal(quiet.QuietHoursActiveDialog({ accountId: "a", userId: "u", timeZone: "UTC", eligible: false, onClose() {} }), null);

const model = await load("model-picker-upsell-modal");
let cta = null;
const modelModal = model.ModelPickerUpsellModal({ model: { displayName: "GPT", model: "gpt" }, rateLimitStatus: { model_picker_upsell: { title: "Upgrade model access", message: "More capacity", ctas: [{ id: "upgrade", label: "Upgrade" }] } }, onClose() {}, onSelectCta: (id) => { cta = id; } });
assert.equal(modelModal.type, "dialog");
assert.equal(modelModal.props.children[1].props.children, "Upgrade model access");
assert.equal(modelModal.props.children[2].props.children, "More capacity");
modelModal.props.children[3].props.children[0].props.onClick();
assert.equal(cta, "upgrade");
assert.equal(model.ModelPickerUpsellModal({ model: { displayName: "GPT", model: "gpt" }, rateLimitStatus: {}, onClose() {} }), null);

const first = await load("first-limit-dialog");
let upgradeVariant = null;
const firstModal = first.FirstLimitDialog({ presentation: { variant: "limit_reached" }, onClose() {}, onUpgradeAfterClose: (presentation) => { upgradeVariant = presentation.variant; } });
assert.equal(firstModal.props.children[0].props.children, "You’ve reached a limit");
assert.match(firstModal.props.children[1].props.children, /Free plan/);
assert.equal(firstModal.props.children[3].props.children, "Upgrade");
firstModal.props.children[3].props.onClick();
assert.equal(upgradeVariant, "limit_reached");
const thinking = first.FirstLimitDialog({ presentation: { variant: "thinking", resetDay: "today", resetTime: new Date("2026-09-27T10:00:00Z") }, onClose() {} });
assert.match(thinking.props.children[1].props.children, /today/);

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

console.log("account modals cluster complete");
