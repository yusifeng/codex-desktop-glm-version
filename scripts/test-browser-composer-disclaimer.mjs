import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__browserDisclaimerTest = {
  jsx: { Fragment: Symbol("Fragment"), jsx: (type, props, key) => typeof type === "function" ? type(props ?? {}) : ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => typeof type === "function" ? type(props ?? {}) : ({ type, props: props ?? {}, key }) },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/browser-composer-disclaimer-core/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: request }) => ({ path: request.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: request }) => ({ loader: "js", contents: request === "app-shared" ? "export const I3=()=>globalThis.__browserDisclaimerTest.jsx;" : request === "app-initial" ? "export const i_n=()=>({search:''});export const uht=()=>({data:null});export const yln=()=>false;" : "export {};" }));
  } }],
});
const disclaimer = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
disclaimer.n();
const personal = { structure: "personal", id: "personal" };
const normal = disclaimer.t({ account: personal, placement: "thread" });
assert.equal(normal.type, "div");
assert.equal(normal.props["data-disclaimer-kind"], "personal");
assert.match(normal.props.className, /px-toolbar/);
assert.match(normal.props.children, /Check important info/);
assert.equal(disclaimer.t({ account: personal, placement: "home" }), null);
const temporary = disclaimer.t({ account: personal, placement: "home", isTemporaryChat: true, hasUserMessage: false });
assert.equal(temporary.props["data-disclaimer-kind"], "temporary-chat");
assert.match(temporary.props.children, /30 days/);
const finance = disclaimer.t({ account: personal, regulatedConnectorKindOverride: "finance" });
assert.equal(finance.props["data-disclaimer-kind"], "finance");
assert.match(finance.props.children, /investment adviser/);
const health = disclaimer.t({ account: personal, regulatedConnectorKindOverride: "health" });
assert.match(health.props.children, /diagnosis or treatment/);
const encryptedK12 = disclaimer.t({ account: { structure: "workspace", id: "school", name: "School", planType: "k12", encrypted: true, dataLoaded: true } });
assert.equal(encryptedK12.props["data-disclaimer-kind"], "encrypted-k12-workspace");
assert.match(encryptedK12.props.children, /School workspace data/);
const research = disclaimer.t({ account: { structure: "workspace", id: "work", trainingAllowed: true, dataLoaded: true } });
assert.equal(research.props["data-disclaimer-kind"], "workspace-research-partner");
assert.equal(research.props.children.props.children[1].type, "a");
assert.match(research.props.children.props.children[1].props.href, /20001245/);
assert.equal(disclaimer.t({ account: { structure: "workspace", id: "hidden", hideStandardDisclaimer: true, dataLoaded: true } }), null);
console.log("browser composer disclaimer assertions passed");
