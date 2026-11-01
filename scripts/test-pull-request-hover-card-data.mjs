import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__hoverCardDataTest = { scopeValue: "conversation-1" };
state.initialized = [];
state.jsx = { jsx: (type, props) => ({ type, props }) };
const shared = [
  'export const $3=()=>globalThis.__hoverCardDataTest.initialized.push("$3");',
  'export const FX=()=>globalThis.__hoverCardDataTest.initialized.push("FX");',
  'export const wL=()=>globalThis.__hoverCardDataTest.initialized.push("wL");',
  'export const I3=()=>globalThis.__hoverCardDataTest.jsx;',
  'export const l3=(left,right)=>JSON.stringify(left)===JSON.stringify(right);',
  'export const rZ=(root,derive,options)=>(globalThis.__hoverCardDataTest.options=options,{root,derive,options});',
  'export const BX=(signal,input)=>signal.derive(input,{scope:{value:globalThis.__hoverCardDataTest.scopeValue},get:(token,params)=>globalThis.__hoverCardDataTest.get(token,params)});',
  'export const _H=url=>{try{return {host:new URL(url).hostname}}catch{return null}};',
].join("\n");
const initial = [
  'export const S$=()=>globalThis.__hoverCardDataTest.initialized.push("S$");',
  'export const CSt=()=>globalThis.__hoverCardDataTest.initialized.push("CSt");',
  'export const wy=()=>globalThis.__hoverCardDataTest.initialized.push("wy");',
  'export const jy=()=>globalThis.__hoverCardDataTest.initialized.push("jy");',
  'export const Oy=()=>globalThis.__hoverCardDataTest.initialized.push("Oy");',
  'export const itn=()=>globalThis.__hoverCardDataTest.initialized.push("itn");',
  'export const byt=()=>globalThis.__hoverCardDataTest.initialized.push("byt");',
  'export const i5t=()=>globalThis.__hoverCardDataTest.initialized.push("i5t");',
  'export const yy=()=>globalThis.__hoverCardDataTest.initialized.push("yy");',
  'export const $en="route"; export const My="provider"; export const gy="account"; export const ky="summary";',
  'export const Ty="details"; export const Syt="cwd"; export const Dyt="host"; export const SSt="origins";',
  'export const x$="PullRequestHoverCard"; export const rtn=value=>value;',
  'export const Z8t=value=>value.toLowerCase(); export const of=data=>data.statusValue;',
  'export const sf=value=>({visual:true,...value});',
].join("\n");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/pull-request-review-hover-card-data/index.ts")],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "hover-card-data-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
      contents: importPath === "rolldown-runtime" ? "export {};" : importPath === "app-shared" ? shared : initial,
      loader: "js",
    }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(state.initialized, ["$3", "FX", "S$", "wL", "CSt", "wy", "jy", "Oy", "itn", "byt", "i5t", "yy"]);
assert.equal(state.options.isEqual({ id: 1 }, { id: 1 }), true);

const target = { pullRequest: { hostname: "github.com", owner: "openai", repository: "codex" } };
state.get = token => {
  if (token === "provider") return { source: "github", isFallback: false };
  if (token === "account") return { data: { status: "success", account: { id: "account" } } };
  if (token === "summary") return { data: { status: "success", title: "Fix recovery", headRevision: "abc", statusValue: "open", canMerge: true, ciStatus: "success", mergeBlocker: null } };
  if (token === "details") return { data: { status: "success", headRevision: "abc", authorLogin: "dev", authorAvatarUrl: "avatar", additions: 12, deletions: 3, changedFiles: 4 } };
};
let tree = module.PullRequestReviewHoverCardData({ conversationId: "conversation-1", hostId: "local", target });
assert.equal(tree.type, "PullRequestHoverCard");
assert.deepEqual(tree.props.preview, {
  kind: "ready", title: "Fix recovery", status: "open",
  visualState: { visual: true, status: "open", canMerge: true, ciStatus: "success", hasMergeConflicts: false },
  authorLogin: "dev", authorAvatarUrl: "avatar", additions: 12, deletions: 3, changedFiles: 4,
});

state.get = token => {
  if (token === "cwd") return "/repo";
  if (token === "host") return "local";
  if (token === "origins") return { data: { origins: [{ dir: "/repo", originUrl: "https://git.example.com/acme/repo.git" }] } };
  if (token === "provider") return { source: "gitlab", isFallback: true };
  if (token === "account") return { data: { status: "success", account: {} } };
  if (token === "summary") return { data: { status: "success", title: "Enterprise", headRevision: "new", statusValue: "merged" } };
  if (token === "details") return { data: { status: "success", headRevision: "old", additions: 100, deletions: 50, changedFiles: 8 } };
};
tree = module.PullRequestReviewHoverCardData({
  conversationId: "conversation-1", hostId: "local",
  target: { pullRequest: { hostname: "GIT.EXAMPLE.COM", owner: "acme", repository: "repo" } },
});
assert.equal(tree.props.preview.kind, "ready");
assert.equal(tree.props.preview.additions, null);
assert.equal(tree.props.preview.deletions, null);
assert.equal(tree.props.preview.changedFiles, null);

state.scopeValue = "another-conversation";
tree = module.PullRequestReviewHoverCardData({
  conversationId: "conversation-1", hostId: "local",
  target: { pullRequest: { hostname: "git.example.com", owner: "acme", repository: "repo" } },
});
assert.deepEqual(tree.props.preview, { kind: "unavailable" });
console.log("pull-request hover-card data tests passed");
