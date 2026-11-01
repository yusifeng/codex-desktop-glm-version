import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__pullRequestActionsOwnerTest = { calls: [], factories: [], generated: [] };
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/pull-request-actions/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "pull-request-action-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ loader: "js", contents:
      value === "app-shared" ? `
        export const ZI={id:'scope'}; export const FX=()=>{}; export const QI=()=>{};
        export const JX=(scope,factory)=>{const value={scope,factory,index:globalThis.__pullRequestActionsOwnerTest.factories.length};globalThis.__pullRequestActionsOwnerTest.factories.push(value);return value};
        export const rZ=(scope,factory)=>({scope,factory,derived:true});
      ` : value === "app-initial" ? `
        export const $en={id:'inline-scope'}; export const gmn=()=>{};export const nrn=()=>{};export const Yy=()=>{};export const i5t=()=>{};export const Y6=()=>{};export const Ry=()=>{};export const Hy=()=>{};export const Oy=()=>{};export const itn=()=>{};export const $fn=()=>{};export const nun=()=>{};
        export const pnt={pullRequestMessageGeneration:{generate:async input=>{globalThis.__pullRequestActionsOwnerTest.generated.push(input);return {body:' Generated body '}}}};
        export const Xy=async(resource,payload)=>{globalThis.__pullRequestActionsOwnerTest.calls.push({resource,payload});if(resource==='gh-pr-diff')return {status:'success',headRevision:'rev-1',unifiedDiff:'+line'};if(resource==='gh-pr-summary')return {status:'success',headRevision:'rev-1',baseBranch:'main',url:'https://github.com/openai/codex/pull/7'};return {status:'success'}};
        export const Zy=promise=>promise; export const n5t=value=>[value.hostname,value.owner,value.repository,value.number].join('/').toLowerCase(); export const Z8t=value=>value.toLowerCase(); export const s5t=url=>url.includes('/pull/7')?{hostname:'github.com',owner:'openai',repository:'codex',number:7}:null;
        export const Znn=comment=>comment.id; export const rrn=(left,right)=>left===right; export const Vy=(request,provider,resource)=>[provider,resource,request.pullRequest.number]; export const $ln=key=>[key];
      ` : "export {};" }));
  } }],
});
const actions = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
actions.t();
assert.equal(state.factories.length, 9);
assert.equal(actions.r.index, 0); assert.equal(actions.i.index, 1); assert.equal(actions.s.index, 2);
assert.equal(actions.n.index, 3); assert.equal(actions.d.index, 4); assert.equal(actions.l.index, 5);
assert.equal(actions.u.index, 6); assert.equal(actions.o.index, 7); assert.equal(actions.c.index, 8);

const request = { account: { hostId: "local", hostname: "github.com", login: "david" }, pullRequest: { hostname: "github.com", owner: "openai", repository: "codex", number: 7 } };
const detail = { authorLogin: "david", baseBranch: "main", headBranch: "feature", headRevision: "rev-1", isAuthor: true, pullRequest: request.pullRequest };
const body = await actions.p({ appServerVersion: "1", body: "Existing", detail, pullRequestInstructions: "Keep tests", request, title: "Restore actions" });
assert.equal(body, "Generated body");
assert.deepEqual(state.calls.slice(0, 2).map(({ resource }) => resource), ["gh-pr-diff", "gh-pr-summary"]);
assert.match(state.generated[0].prompt, /Head: feature/);
assert.match(state.generated[0].prompt, /Canonical pull request diff:\n\+line/);
assert.equal(state.generated[0].hostId, "local");

const changed = actions._({ currentComments: [{ id: "draft", content: [{ content_type: "text", text: "" }], position: { line: 2, path: "a.ts", side: "right" }, replyToReviewThreadId: "thread" }], nextComments: [{ id: "draft", content: [{ content_type: "text", text: "ready" }], position: { line: 2, path: "a.ts", side: "right" }, replyToReviewThreadId: "thread" }] });
assert.equal(changed.length, 1);
assert.equal(actions.g({ comments: changed, filePaths: ["a.ts"] }).get("a.ts"), 1);
assert.deepEqual(actions.h("rev-1", changed[0]), { commentKey: "draft", revision: "rev-1" });
assert.equal(new actions.f("head_changed").name, "PullRequestDescriptionGenerationError");

console.log("23 pull request actions owner assertions passed");
