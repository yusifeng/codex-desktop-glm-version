import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__localThreadTest = {
  clientContext: { value: { clientThreadId: "side-client" } },
  derivedResolvers: [],
  initialized: [],
  markedRead: [],
  placementCalls: [],
  queryReads: [],
  queries: new Map(),
  scopeValues: new Map(),
  scopeWatchers: [],
  resume: { hasResumeFailed: false, isResuming: false, isUnavailable: false, isWriterConflict: false, retryResume() {} },
};
state.jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/local-conversation-thread/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{ name: "local-thread-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => {
      if (importPath === "app-shared") return { loader: "js", contents: `
        export const ZI={kind:'scope'};export const $3=()=>globalThis.__localThreadTest.initialized.push('shared');
        export const I3=()=>globalThis.__localThreadTest.jsx;export const K2=()=>{};export const FX=()=>{};export const wL=()=>{};export const QI=()=>{};export const UX=props=>props.children;
        export const Yh='button';export const BX=(signal,key)=>{globalThis.__localThreadTest.queryReads.push({signal:signal?.kind,key});return globalThis.__localThreadTest.queries.get(String(signal?.kind)+':'+String(key));};
        export const e6=()=>({useEffect(effect){effect();}});
        const scopeGet=(signal,parameter)=>globalThis.__localThreadTest.scopeValues.get(String(signal?.kind)+':'+(parameter==null?'':JSON.stringify(parameter)));
        export const LX=signal=>signal?.kind==='client-context'?globalThis.__localThreadTest.clientContext:{get:scopeGet,set(){},watch(listener){globalThis.__localThreadTest.scopeWatchers.push(listener);listener({get:scopeGet});return()=>{}}};
        export const rZ=(scope,resolver)=>{globalThis.__localThreadTest.derivedResolvers.push(resolver);return {kind:'derived-family',resolve:(key,get)=>resolver(key,{get})}};
      ` };
      if (importPath === "app-initial") return { loader: "js", contents: `
        export const C=()=>globalThis.__localThreadTest.initialized.push('initial');
        export const $en={kind:'app-scope'},Ltn={kind:'submitted'},y_t={kind:'source'},zZt={kind:'available'},wQt={kind:'host'},wtn={kind:'client-context'},XZt={kind:'active'},o0t={kind:'persisted'},UQt={kind:'thread-state'},ewt={kind:'persisted-unread'},WQt={kind:'turn-summary'},GPt={kind:'read-enabled'},eQt={kind:'receipt'},M_={kind:'projection'},E_t={kind:'active-interest'},kht={kind:'placement'};
        export const jht=(...args)=>{globalThis.__localThreadTest.placementCalls.push(args);return {args}};
        export const Ugn=(scope,hostId)=>({markConversationAsRead:id=>globalThis.__localThreadTest.markedRead.push({hostId,id})});
        export default {};
      ` };
      if (importPath === "app-primary") return { loader: "js", contents: "export const d=()=>globalThis.__localThreadTest.initialized.push('primary');export default {};" };
      if (importPath === "use-resume-conversation-if-needed") return { loader: "js", contents: "export const n=(id,access)=>({...globalThis.__localThreadTest.resume,resumeConversationId:id,access});export const t=()=>globalThis.__localThreadTest.initialized.push('resume');export default {};" };
      if (importPath === "scroll-to-match") return { loader: "js", contents: "export const n=()=>{};export default {};" };
      if (importPath === "thread-scroll-controller-context-value") return { loader: "js", contents: "export const r=()=>{};export default {};" };
      if (importPath === "local-conversation-turn") return { loader: "js", contents: "export const t=props=>({type:'rendered-turn',props});export default {};" };
      if (importPath === "thread-scroll-layout") return { loader: "js", contents: "export const n=()=>{};export const t=props=>props.children;export default {};" };
      if (importPath === "virtualized-turn-list") return { loader: "js", contents: "export const t=({entries,RowComponent})=>entries.map(entry=>RowComponent({entry}));export default {};" };
      if (["open-automation-side-panel-tab","google-drive-resource-icon","result-card","gitlab-merge-request-form-dialog"].includes(importPath)) return { loader: "js", contents: "export default {};" };
      return { loader: "js", contents: "export default {};" };
    });
  } }],
});
const thread = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#local-thread`);

function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

assert.deepEqual(Object.keys(thread), ["_", "a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
assert.equal(thread.m({ agentNickname: " @reviewer ", conversationId: "abcdefghijk" }), "reviewer");
assert.equal(thread.m({ agentNickname: "", conversationId: "abcdefghijk", useGeneratedFallback: true }), "agent-abcdefgh");
assert.equal(thread.u({ activeTabId: "plan:1", isRightPanelExpanded: true }), true);
assert.equal(thread.u({ activeTabId: "background-agent:1", isRightPanelExpanded: true }), false);

thread.c();
assert.equal(thread.l.kind, "derived-family");
const familyGet = (signal, key) => signal.kind === "submitted" && key === "existing" ? { status: "ready" } : signal.kind === "source" ? { clientThreadId: "client", launchMode: key === "stable" ? "create-stable-worktree" : "create" } : null;
assert.equal(thread.l.resolve("existing", familyGet), "existing");
assert.equal(thread.l.resolve("new", familyGet), "client");
assert.equal(thread.l.resolve("stable", familyGet), null);

state.queries.set("available:main", true);
state.queries.set("host:main", "host-1");
state.queries.set("projection:[object Object]", {
  renderEntries: [{ turnKey: "complete", turn: { turnId: "complete", items: [{ type: "agentMessage", text: "complete assistant" }] } }],
  visibleTurnEntries: [{ turnKey: "lightweight", turn: { turnId: "lightweight", items: [{ type: "userMessage", text: "user only" }] } }],
});
const openedAgents = [];
let view = thread.t({ conversationId: "main", header: "Header", hostMcpApps: true, onOpenBackgroundAgent: agent => openedAgents.push(agent) });
assert.equal(view.props["data-local-conversation-thread"], "main");
assert.equal(view.props["data-host-id"], "host-1");
assert.deepEqual(state.queryReads.find(({ signal }) => signal === "active-interest")?.key, { hostId: "host-1", threadId: "main" });
assert.ok(find(view, node => node.props?.["data-thread-composer"] === true));
assert.ok(find(view, node => node.props?.["data-host-mcp-apps"] === true));
assert.equal(find(view, node => node.type === "rendered-turn").props.turn.turnId, "complete", "the renderer must prefer complete renderEntries over lightweight visibleTurnEntries");
const transcriptContainer = find(view, node => node.props?.["data-local-conversation-thread-container"] === true);
transcriptContainer.props.onClickCapture({ target: { closest: () => ({ getAttribute: () => "child-1" }) } });
assert.deepEqual(openedAgents, [{ conversationId: "child-1" }]);

state.queries.set("available:explicit", true);
state.queries.set("host:explicit", "host-explicit");
state.queries.set("derived-family:side-client", "explicit");
const explicitSideThread = thread.i({ showSummaryPanel: false });
assert.equal(explicitSideThread.props["data-conversation-id"], "explicit", "a mapped server conversation must replace the pending client-thread identity");
assert.equal(state.placementCalls.at(-1).length, 3, "established main threads must use the three-argument placement contract");
assert.equal(state.placementCalls.at(-1)[2], "explicit", "the established conversation must also backfill a missing route conversation id");

state.resume = { hasResumeFailed: false, isResuming: false, isUnavailable: false, isWriterConflict: true, retryResume() {} };
view = thread.t({ conversationId: "main" });
assert.ok(find(view, node => node.props?.["data-thread-state"] === "writer-conflict"));
assert.equal(find(view, node => node.props?.["data-thread-composer"] === true), undefined);

state.resume = { hasResumeFailed: false, isResuming: false, isUnavailable: true, isWriterConflict: false, retryResume() {} };
state.queries.set("projection:[object Object]", { renderEntries: [], visibleTurnEntries: [] });
view = thread.t({ conversationId: "main", threadAccess: "shared" });
assert.equal(view.props["data-thread-state"], "unavailable");

const reads = [];
view = thread.n({ conversationId: "main", hostId: "host-1", trackReadState: true, onMarkRead: id => reads.push(id) });
view.props.onKeyDownCapture({ type: "keydown", key: "Shift" });
view.props.onPointerDownCapture({ type: "pointerdown" });
assert.deepEqual(reads, ["main", "main"], "mount and pointer interaction mark the thread read; modifier-only keydown does not");

state.scopeValues.set("available:\"watch\"", true);
state.scopeValues.set("host:\"watch\"", "host-watch");
state.scopeValues.set("read-enabled:", true);
state.scopeValues.set('thread-state:{"hostId":"host-watch","threadId":"watch"}', { summary: { hasUnreadTurn: true }, requests: [{ id: "request-1" }] });
state.scopeValues.set('turn-summary:{"hostId":"host-watch","threadId":"watch"}', { lastTurnId: "turn-1", lastTurnStatus: "completed" });
thread.n({ conversationId: "watch", hostId: "host-watch", trackReadState: true });
assert.deepEqual(state.markedRead.at(-1), { hostId: "host-watch", id: "watch" });

state.queries.set("available:expired", false);
assert.match(text(thread.r({ conversationId: "expired" })), /Side chat expired/);
assert.match(text(thread.f({ clientThreadId: "client", submittedThreadStart: { prompt: "hello", status: "failed" }, onRetry() {} })), /Could not start this chat/);

thread.s();
thread.p();
assert.ok(state.initialized.includes("resume"));
console.log("local conversation thread cluster assertions passed");
