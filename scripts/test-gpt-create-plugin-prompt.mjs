import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/gpt-create-plugin-prompt/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceCheck = (value, message) => { assert.ok(value, message); sourceAssertions += 1; };
const dependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
sourceCheck([...dependencies].sort().join(",") === "app-initial,app-shared,hosted-plugin-creation-actions,rolldown-runtime", "preserves all four static dependencies");
sourceCheck(!/import\s*\(/.test(source), "has no dynamic dependencies");
sourceCheck(!/\bany\b/.test(source), "does not introduce an explicit unsafe type");
sourceCheck(!/\b(?:appSharedChunk|appInitialChunk|creationActionsChunk)\s*\./.test(source), "does not consume namespace members");
sourceCheck(source.includes("useEffectEvent") && source.includes("[accountId, scope]"), "uses a stable effect event with minimal dependencies");

const state = (globalThis.__gptCreatePluginPromptTest = {
  currentAccount: "account-1", closes: 0, creates: 0, flags: { "2160578039": true, "1663164947": true }, initializers: [], navigations: [], signalDisabled: false, latestDisabled: false, watchers: [],
});
const jsx = { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const hooks = {
  useEffect(effect) { const cleanup = effect(); state.effectCleanup = cleanup; },
  useEffectEvent(callback) { return callback; },
};
state.scope = { watch(listener) { state.watchers.push(listener); return () => state.watchers.pop(); } };
const marker = (name) => `export const ${name}=()=>globalThis.__gptCreatePluginPromptTest.initializers.push("${name}");`;
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    marker("$3"), marker("FX"), marker("K2"), marker("Ph"), marker("QI"), marker("Zh"), marker("c_"), marker("zh"),
    "export const I3=()=>globalThis.__gptCreatePluginPromptTest.jsx;",
    "export const e6=()=>globalThis.__gptCreatePluginPromptTest.hooks;",
    "export const LX=()=>globalThis.__gptCreatePluginPromptTest.scope;",
    "export const HX=()=>globalThis.__gptCreatePluginPromptTest.currentAccount;",
    "export const BX=()=>({get:()=>globalThis.__gptCreatePluginPromptTest.signalDisabled});",
    "export const ZI={}; export const Ih='Dialog'; export const Lh='DialogText'; export const Oh='DialogBody'; export const Rh='DialogTitle'; export const Y2='FormattedMessage'; export const Yh='Button'; export const kh='DialogActions'; export const o_='Tooltip';",
  ].join("\n"),
  "app-initial": [
    marker("G6t"), marker("Qgn"), marker("iE"), marker("ifn"), marker("p0t"),
    "export const K6t='account-signal'; export const m0t='config-family'; export const rE='gpt-editor-route';",
    "export const ofn=id=>globalThis.__gptCreatePluginPromptTest.flags[id];",
    "export const o_n=()=>destination=>globalThis.__gptCreatePluginPromptTest.navigations.push(destination);",
    "export const lfn=()=>({getDynamicConfig:()=>({get:()=>globalThis.__gptCreatePluginPromptTest.latestDisabled})});",
  ].join("\n"),
  "hosted-plugin-creation-actions": `
    export const n=()=>globalThis.__gptCreatePluginPromptTest.initializers.push("hosted");
    export const t=props=>({type:"HostedActions",props});
  `,
};
state.jsx = jsx; state.hooks = hooks;
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "gpt-create-plugin-prompt-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let runtimeAssertions = 0;
const runtimeCheck = (value, message) => { assert.ok(value, message); runtimeAssertions += 1; };
const children = (node) => { const value = node?.props?.children; return Array.isArray(value) ? value : value == null ? [] : [value]; };
const findAll = (node, predicate, result = []) => { if (node == null || typeof node !== "object") return result; if (predicate(node)) result.push(node); for (const child of children(node)) findAll(child, predicate, result); return result; };
const renderPrompt = (hostedNode, creationState) => { const promptNode = hostedNode.props.children(creationState); return promptNode.type(promptNode.props); };
const props = { accountId: "account-1", onClose: () => { state.closes += 1; } };

runtimeCheck(Object.keys(module).join(",") === "GptCreatePluginPrompt", "preserves the sole public export");
runtimeCheck(state.initializers.length === 14 && state.initializers.includes("hosted"), "initializes all published dependency surfaces once");
state.currentAccount = "account-2";
runtimeCheck(module.GptCreatePluginPrompt(props) === null, "hides the prompt for a different active account");
state.watchers.at(-1)({ get: () => "account-3" });
runtimeCheck(state.closes === 1, "closes when the watched account changes");
state.currentAccount = "account-1";
let hostedNode = module.GptCreatePluginPrompt(props);
runtimeCheck(hostedNode.props.enabled === true && hostedNode.props.mode === "browse" && hostedNode.props.logSkillCreationEvent === false, "configures hosted creation actions for browse mode");
runtimeCheck(hostedNode.props.onNavigate === props.onClose, "closes on hosted navigation");

state.flags["1663164947"] = false; state.signalDisabled = true;
hostedNode = module.GptCreatePluginPrompt(props);
let dialog = renderPrompt(hostedNode, { canCreatePlugin: false, isCreatingPlugin: false, onCreatePlugin: () => { state.creates += 1; } });
let messages = findAll(dialog, (node) => node.type === "FormattedMessage");
const primaryTooltip = findAll(dialog, (node) => node.type === "Tooltip")[0];
runtimeCheck(primaryTooltip.props.tooltipContent.props.id.endsWith("creatorUnavailableTooltip"), "shows rollout-disabled plugin tooltip first");
runtimeCheck(messages.some((node) => node.props.id.endsWith("unavailableDescription")), "explains when neither GPT nor plugin creation is available");
runtimeCheck(findAll(dialog, (node) => node.type === "Button").length === 1, "hides the GPT action after GPT creation is disabled");
const form = findAll(dialog, (node) => node.type === "DialogBody")[0]; let prevented = 0; form.props.onSubmit({ preventDefault: () => { prevented += 1; } });
runtimeCheck(prevented === 1 && state.creates === 0, "prevents submit but does not create without permission");
dialog.props.onOpenChange(false); runtimeCheck(state.closes === 2, "closes when the dialog is dismissed");

state.flags["1663164947"] = true; state.signalDisabled = false; state.latestDisabled = false;
hostedNode = module.GptCreatePluginPrompt(props);
dialog = renderPrompt(hostedNode, { canCreatePlugin: true, isCreatingPlugin: false, onCreatePlugin: () => { state.creates += 1; } });
const buttons = findAll(dialog, (node) => node.type === "Button");
runtimeCheck(buttons.length === 2, "renders plugin and GPT actions while GPT creation remains available");
findAll(dialog, (node) => node.type === "DialogBody")[0].props.onSubmit({ preventDefault() {} });
runtimeCheck(state.creates === 1, "starts plugin creation from an allowed form submit");
buttons.find((node) => node.props.type === "button").props.onClick();
runtimeCheck(state.navigations[0] === "gpt-editor-route" && state.closes === 3, "closes and navigates to the GPT editor when still enabled");
state.latestDisabled = true; buttons.find((node) => node.props.type === "button").props.onClick();
runtimeCheck(state.navigations.length === 1 && state.closes === 3, "rechecks dynamic config before GPT navigation");
runtimeCheck(state.watchers.length >= 3, "subscribes to account changes for every mounted prompt");

console.log(`${sourceAssertions} source assertions, ${runtimeAssertions} runtime assertions passed for GPT create plugin prompt`);
