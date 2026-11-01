import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__sharedRuntimeUtilitiesTest = { aboutYouInitializations: 0, jsx: { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } }, memorySummary(props) { return { type: "memory-summary", props }; }, savedMemories(props) { return { type: "saved-memories", props }; } };
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
      name: "shared-runtime-utilities-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8), namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => {
          const name = path.basename(importPath);
          const contents = name === "app-shared"
            ? `export const I3=()=>globalThis.__sharedRuntimeUtilitiesTest.jsx;
               export const $O={FIVE_MINUTES:300000}; export const VJ=()=>true;
               export const ek=()=>{}; export const wL=()=>{};`
            : name === "app-initial"
              ? `const option=(kind,id,input={})=>({kind,id,input,queryKey:[kind,id]});
                 export const B$=()=>{},G6t=()=>{},HEt=()=>{},HZt=()=>{},Lv=()=>{},s6t=()=>{},uDt=()=>{};
                 export const Ifn={}; export const FEt=id=>option("link",id); export const X3t=id=>option("details",id);
                 export const cDt=input=>option("remote",input.appIds.join(","),input); export const z$=input=>option("local",input.appIds.join(","),input);
                 export const Iv=value=>new Set(value?.map?.(item=>typeof item==="string"?item:item.id)??[]);
                 export const Rv=hostId=>hostId!=="local"; export const W6t=()=>"scope-account";`
              : name === "app-connect-modal"
                ? `export const h=()=>{},s=()=>{};
                   export const o=()=>["drive","slack"]; export const p=(_id,connectors)=>connectors.map(item=>item.id);
                   const available=input=>input.companionConnectors.flatMap((item,index)=>item!=null&&input.companionLinks[index]==null?[input.connectors?.find(connector=>connector.id===item.id)??item]:[]);
                   export const a=available,d=available;`
                : name === "saved-memories"
                  ? "export const t=globalThis.__sharedRuntimeUtilitiesTest.savedMemories;"
                  : name === "about-you-summary"
                    ? "export const i=()=>globalThis.__sharedRuntimeUtilitiesTest.aboutYouInitializations++,n=globalThis.__sharedRuntimeUtilitiesTest.memorySummary;"
                    : "export {};";
          return { contents, loader: "js" };
        });
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); output.push(value); visit(value.props?.children); }; visit(root); return output; }
function find(root, predicate) { return nodes(root).find(predicate); }

// chatgpt-saved-memories-panel: 2
const saved = await bundle("chatgpt-saved-memories-panel");
assert.deepEqual(Object.keys(saved), ["SavedMemoriesDialog"]);
assert.equal(saved.SavedMemoriesDialog({ accountId: "a" }).type, "saved-memories");

// chatgpt-about-you-summary-panel: 2
const summary = await bundle("chatgpt-about-you-summary-panel");
assert.deepEqual(Object.keys(summary), ["MemorySummaryDialog"]);
assert.equal(globalThis.__sharedRuntimeUtilitiesTest.aboutYouInitializations, 1);
assert.equal(summary.MemorySummaryDialog({ accountId: "a" }).type, "memory-summary");

// chatgpt-projects-runtime: 6
const projects = await bundle("chatgpt-projects-runtime");
assert.deepEqual(Object.keys(projects), ["a", "i", "n", "o", "r", "t"]);
assert.match(projects.t.$type, /FileLimitUpgradeClicked$/);
assert.match(projects.n.$type, /SettingsOpened$/);
assert.match(projects.a.$type, /SaveInitiated$/);
assert.match(projects.r.$type, /SaveCompleted$/);
assert.match(projects.i.$type, /SaveFailed$/);

// format-bytes: 7
const bytes = await bundle("format-bytes");
assert.deepEqual(Object.keys(bytes), ["n", "t"]);
const numberCalls = []; const intl = { formatNumber(value, options) { numberCalls.push({ value, options }); return `${value} ${options.unit}`; } };
assert.equal(bytes.t(0, intl), "0 byte");
assert.equal(bytes.t(Number.NaN, intl), "0 byte");
assert.equal(bytes.t(512, intl), "512 byte");
assert.equal(bytes.t(1024, intl), "1 kilobyte");
assert.equal(bytes.t(1024 ** 2, intl), "1 megabyte");
assert.equal(numberCalls.at(-1).options.maximumFractionDigits, 1);

// analytics-runtime: 8
const analytics = await bundle("analytics-runtime");
assert.deepEqual(Object.keys(analytics), ["a", "i", "n", "r", "t"]);
const events = []; const scope = { log(descriptor, payload) { events.push({ descriptor, payload }); } };
analytics.a(scope);
assert.equal(events[0].descriptor, "chatgpt_post_share_modal_shown");
analytics.n(scope, "success", { source: "button" });
assert.equal(events[1].descriptor, "chatgpt_post_share_copy_success");
assert.equal(events[1].payload.source, "button");
analytics.r(scope, { promptTextLength: 12, shareId: "share", sourceConversationIsWorkMode: true });
assert.equal(events[2].payload.originalPromptTextLength, "12");
assert.equal(events[2].payload.sourceConversationIsWorkMode, "true");
analytics.i(scope, { promptTextLength: 12 }, 5);
assert.equal(events[3].descriptor, "chatgpt_share_prompt_link_submitted");
assert.equal(events[3].payload.submittedPromptTextLength, "5");

// read-error: 6
const readError = await bundle("read-error");
assert.deepEqual(Object.keys(readError), ["n", "t"]);
assert.equal(readError.t({}).props.role, "alert");
assert.equal(readError.t({}).props.children[0], "Unable to load this section");
let retried = 0; const readUi = readError.t({ children: "Failed", onRetry() { retried++; } });
find(readUi, node => node.type === "button").props.onClick();
assert.equal(retried, 1);
assert.equal(find(readError.t({ loading: true, onRetry() {} }), node => node.type === "button").props.disabled, true);
assert.equal(find(readError.t({ loading: true, onRetry() {} }), node => node.type === "button").props.children, "Trying again…");

// browser-mfa-jwt: 7
const jwt = await bundle("browser-mfa-jwt");
assert.deepEqual(Object.keys(jwt), ["n", "t"]);
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encode({ alg: "none" })}.${encode({ sub: "user", unicode: "你好" })}.signature`;
assert.equal(jwt.n(token).sub, "user");
assert.equal(jwt.n(token).unicode, "你好");
assert.equal(jwt.n(token, { header: true }).alg, "none");
assert.throws(() => jwt.n("bad"), /missing part/);
assert.throws(() => jwt.n("bad.%%%%.sig"), /Invalid token/);
assert.throws(() => jwt.n("bad.bm90LWpzb24.sig"), /invalid json/);

// app-connect-availability: 7
const availability = await bundle("app-connect-availability");
assert.deepEqual(Object.keys(availability), ["i", "n", "r", "t"]);
const connectors = [{ id: "drive", label: "Drive" }, { id: "slack", label: "Slack" }];
const queryCalls = [];
const cached = [];
const queryClient = {
  async fetchQuery(options) {
    queryCalls.push(options);
    if (options.kind === "link") return options.id === "slack" ? { id: "linked" } : null;
    if (options.kind === "details") return { id: options.id, label: options.id };
    if (options.kind === "local") return [{ id: "drive" }];
    if (options.kind === "remote") return [{ id: "slack" }];
    throw new Error("unexpected query");
  },
  setQueryData(queryKey, value) { cached.push({ queryKey, value }); },
};
const availabilityScope = { get: () => ({ appRead: true }) };
assert.deepEqual(await availability.i({ appId: "primary", hostId: "local", primaryLink: { id: "linked" }, connectors, queryClient, scope: availabilityScope }), []);
assert.deepEqual(cached, [{ queryKey: ["link", "primary"], value: { id: "linked" } }]);
const available = await availability.i({ appId: "primary", hostId: "local", connectors, queryClient, scope: availabilityScope, freshLinkChecks: true });
assert.equal(queryCalls.find(call => call.kind === "link" && call.id === "primary").staleTime, 0);
assert.deepEqual(available, [connectors[0]]);
assert.deepEqual(await availability.n({ appId: "primary", hostId: "remote", queryClient, scope: availabilityScope }), []);
const noAppsClient = { ...queryClient, fetchQuery: async options => options.kind === "local" ? [] : queryClient.fetchQuery(options) };
assert.deepEqual(await availability.n({ appId: "primary", hostId: "local", queryClient: noAppsClient, scope: availabilityScope }), []);
assert.equal(typeof availability.r, "function");

console.log("46 shared runtime utilities cluster assertions passed");
