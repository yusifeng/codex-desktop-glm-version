import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function resetState() {
  globalThis.__utilityCluster = {
    analytics: [], counts: [], clients: [], posts: [], signals: [], visible: true,
    taskSources: {
      CHATGPT_TASKS_INTERACTION_SOURCE_SHARED_TASK_SHEET: "shared-sheet",
      CHATGPT_TASKS_INTERACTION_SOURCE_TASKS_PAGE_TASK_ROW: "task-row",
      CHATGPT_TASKS_INTERACTION_SOURCE_EDITOR: "editor",
      CHATGPT_TASKS_INTERACTION_SOURCE_SHARING_SHEET: "sharing-sheet",
    },
  };
  return globalThis.__utilityCluster;
}
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "utility-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
        if (value === "app-shared") return { contents: `
          const s=globalThis.__utilityCluster; const noop=()=>{};
          export const H3=noop,wL=noop,FX=noop,QI=noop,ZI={}; export const vW="OpenAI-Account-User-ID";
          export const pZ=(_scope,value)=>(s.signals.push(value),{value});
        `, loader: "js" };
        if (value === "app-initial") return { contents: `
          const s=globalThis.__utilityCluster; const noop=()=>{};
          export const cJt=noop,AKt=noop,Evt=noop; export const Ovt=()=>s.visible;
          export const DKt={sentinelToken:"X-Sentinel",timing:"X-Timing"};
          export const rJt={safePost:async(path,options)=>(s.posts.push({path,options}),{id:"inquiry-1"})};
          export const cc=noop,ypn=noop,xpn=(scope,event,payload)=>s.analytics.push({scope,event,payload});
          export const sc={count:(...args)=>s.counts.push(args)};
        `, loader: "js" };
        if (value === "persona-runtime") return { contents: `
          export default {Client:class {constructor(options){this.options=options;globalThis.__utilityCluster.clients.push(this)}open(){this.opened=true}destroy(){this.destroyed=true}}};
        `, loader: "js" };
        if (value === "chatgpt-tasks-runtime") return { contents: `
          const state=globalThis.__utilityCluster; export const i=state.taskSources,n={event:"task"},s=()=>{};
          export const r=new Proxy({}, {get:(_target,key)=>String(key)});
        `, loader: "js" };
        return { contents: "export {};", loader: "js" };
      });
    }}] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

let state = resetState();
const persona = await bundle("pepper-persona");
persona.t();
let loaded = 0, completed = 0, errors = 0;
const dispose = persona.n({ accountId: "acct", onLoad: () => loaded++, onComplete: () => completed++, onError: () => errors++ });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.posts[0].path, "/compliance/age_verification/persona/inquiries");
assert.equal(state.posts[0].options.additionalHeaders["ChatGPT-Account-ID"], "acct");
assert.equal(state.clients.length, 1);
assert.equal(state.clients[0].opened, true);
state.clients[0].options.onLoad();
assert.equal(loaded, 1);
state.clients[0].options.onComplete();
assert.equal(completed, 1);
assert.equal(state.clients[0].destroyed, true);
dispose();
assert.equal(errors, 0);

state = resetState();
const games = await bundle("codex-micro-mini-games");
games.s();
assert.equal(state.signals.length, 1);
assert.equal(games.o(() => 0), "brick-breaker");
assert.equal(games.o(() => 0.4), "asteroids");
assert.equal(games.o(() => 0.99), "snake");
assert.equal(games.l({ key: "AG00", act: 1 }), true);
assert.equal(games.l({ key: "AG00", act: 0 }), false);
assert.equal(games.u({ game: "asteroids" }, { key: "AG00", act: 1 }), true);
assert.equal(games.u({ game: "snake" }, { key: "AG00", act: 1 }), false);
assert.equal(games.a(null), null);
const slots = games.a({ game: "asteroids" });
assert.equal(slots.length, 6);
assert.equal(slots[0].status, "working");
assert.equal(slots[1].status, "off");
assert.equal(games.i(games.c, { angle: 0.2, distance: 0.1 }, 10).state, games.c);
const started = games.i(games.c, { angle: 0.2, distance: 0.5 }, 10);
assert.equal(started.progress, 0);
assert.equal(started.state.startedAt, 10);
const progressed = games.i(started.state, { angle: 0.3, distance: 0.5 }, 20);
assert.equal(progressed.captured, true);
assert.ok(progressed.progress > 0);
const element = { isConnected: true };
let removed = 0;
const unregister = games.d("game-1", element, () => removed++);
assert.equal(games.r(), "game-1");
unregister();
await new Promise((resolve) => queueMicrotask(resolve));
assert.equal(removed, 1);

state = resetState();
globalThis.window = { SentinelSDK: { requirementsToken: () => "requirement" } };
const integrity = await bundle("account-action-integrity");
integrity.r();
const headers = await integrity.t("purchase");
assert.deepEqual(headers, {});
const checkout = await integrity.n("checkout_session_approval");
assert.match(checkout["X-Sentinel"], /k9d4s6v3b2/);
assert.equal(checkout["X-Timing"], "[1,null]");

state = resetState();
const sharing = await bundle("share-analytics");
sharing.t();
const scope = {};
sharing.n(scope, "task_share_button_clicked", "task-1", "scheduled_page", { success: true });
assert.equal(state.analytics.length, 1);
assert.equal(state.analytics[0].payload.taskId, "task-1");
assert.equal(state.analytics[0].payload.source, "task-row");
assert.equal(state.counts[0][2].source, "tasks_page_task_row");
assert.equal(state.counts[0][2].success, "true");
sharing.r(scope, "shared_task_sheet_viewed", "post-1", { success: false });
assert.equal(state.analytics[1].payload.sharePostId, "post-1");
assert.equal(state.analytics[1].payload.source, "shared-sheet");
assert.equal(state.counts[1][2].source, "shared_task_sheet");
assert.equal(state.counts[1][2].success, "false");

console.log("39 integrity, persona, mini-game and sharing assertions passed");
