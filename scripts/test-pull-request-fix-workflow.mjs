import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/pull-request-fix-workflow/index.ts")],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => modulePath === "app-shared" ? {
      loader: "js",
      contents: `
        export const FX=()=>{},ZI={};
        export const pZ=(_scope,value)=>{const signal={kind:"signal",value};globalThis.__prFixSignals.push(signal);return signal};
        export const sZ=(_scope,derive)=>({kind:"derived",derive});
        export const I3=()=>globalThis.__jsx;
      `,
    } : { loader: "js", contents: "export {};" });
  } }],
});

globalThis.__jsx = jsx;
globalThis.__prFixSignals = [];
const mod = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
mod.p();
assert.equal(globalThis.__prFixSignals.length, 4);

function createScope() {
  const values = new Map();
  let focusCount = 0;
  const scope = {
    get(signal) { return signal.kind === "derived" ? signal.derive({ get: (nested) => scope.get(nested) }) : values.has(signal) ? values.get(signal) : signal.value; },
    set(signal, value) { values.set(signal, value); },
    focusComposer() { focusCount += 1; },
    focusCount: () => focusCount,
    values,
  };
  return scope;
}

const [repairStateSignal, attachmentsSignal, composerSignal, generatedPromptSignal] = globalThis.__prFixSignals;
const target = { cwd: "/repo", hostId: "local", root: "/repo" };
const otherTarget = { cwd: "/other", hostId: "remote", root: "/other" };
const comment = { authorLogin: "alice", body: "Please rename this", line: 8, path: "src/a.ts", side: "RIGHT", startLine: 7, startSide: "RIGHT", reviewThreadId: "thread-1", replies: [{ authorLogin: "bob", body: "Agreed" }] };
const fallbackAttachment = { content: [{ content_type: "text", text: "x" }], position: { line: 4, path: "src/b.ts", side: "LEFT" }, type: "comment" };

assert.deepEqual(mod.d([comment, { ...comment, reviewThreadId: "resolved", isResolved: true }, { body: "general" }]), [comment]);
assert.equal(mod.u({ ...fallbackAttachment, reviewThreadId: "thread-x" }), "thread-x");
assert.equal(mod.u(fallbackAttachment), "src/b.ts:LEFT:4");
assert.equal(mod.f({}), "missing-conversation");
assert.equal(mod.f({ conversationId: "c" }), "missing-pr-info");
assert.equal(mod.f({ conversationId: "c", baseBranch: "main", headBranch: "feature", prNumber: 12 }), null);
assert.equal(mod.l(target, { cwd: "/different", hostId: "local", root: "/REPO/" }), true);
assert.equal(mod.l(target, otherTarget), false);
assert.equal(mod.n({ name: "test", status: "failing", link: "https://ci/1" }), "https://ci/1");
assert.equal(mod.n({ name: "test", status: "failing", workflow: "build" }), "build:test");
assert.equal(mod.v(createScope(), { comment: fallbackAttachment, target }).localWorkspaceRoot, "/repo");

const commentScope = createScope();
assert.equal(mod._(commentScope, { baseBranch: "main", comments: [comment], conversationId: "conversation-1", focusComposer: true, headBranch: "feature", number: 12, repo: "org/repo", target }), true);
let attached = commentScope.get(attachmentsSignal)["conversation-1"];
assert.equal(attached.length, 1);
assert.match(attached[0].content[0].text, /@alice:\nPlease rename this/);
assert.match(attached[0].content[0].text, /@bob:\nAgreed/);
assert.equal(attached[0].localWorkspaceRoot, "/repo");
assert.equal(commentScope.focusCount(), 1);
assert.match(commentScope.get(composerSignal), /org\/repo PR 12/);
assert.equal(commentScope.get(generatedPromptSignal), commentScope.get(composerSignal));
assert.equal(mod._(commentScope, { baseBranch: "main", comments: [comment], conversationId: "conversation-1", focusComposer: false, headBranch: "feature", number: 12, target }), true);
assert.equal(commentScope.get(attachmentsSignal)["conversation-1"].length, 1);
assert.equal(mod.g(commentScope, { commentAttachment: attached[0], conversationId: "conversation-1", guidance: "  keep API stable  " }), true);
attached = commentScope.get(attachmentsSignal)["conversation-1"];
assert.equal(attached[0].localPullRequestCommentGuidance, "keep API stable");
assert.equal(mod.g(commentScope, { commentAttachment: attached[0], conversationId: "conversation-1", guidance: "keep API stable" }), false);
assert.equal(mod.g(commentScope, { commentAttachment: attached[0], conversationId: "conversation-1", guidance: " " }), true);
assert.equal(commentScope.get(attachmentsSignal)["conversation-1"][0].localPullRequestCommentGuidance, undefined);
assert.equal(mod.h(commentScope, { baseBranch: "main", commentAttachments: attached, conversationId: "conversation-1", headBranch: "feature", number: 12, target }), true);
assert.equal(commentScope.get(attachmentsSignal)["conversation-1"].length, 0);

const checkScope = createScope();
const checks = [{ name: "unit", status: "failing", workflow: "ci" }, { name: "lint", status: "passing", workflow: "ci" }];
assert.equal(mod.i(checkScope, { attached: true, checks, pullRequestNumber: 12, target }), true);
assert.equal(checkScope.get(repairStateSignal).pullRequestChecks.length, 1);
assert.equal(mod.i(checkScope, { attached: true, checks, pullRequestNumber: 12, target }), true);
assert.equal(checkScope.get(repairStateSignal).pullRequestChecks.length, 1);
assert.equal(mod.i(checkScope, { attached: false, checks, pullRequestNumber: 12, target: otherTarget }), false);
assert.equal(mod.i(checkScope, { attached: false, checks, pullRequestNumber: 12, target }), true);
assert.equal(checkScope.get(repairStateSignal).pullRequestChecks.length, 0);
assert.equal(mod.o(checkScope, { baseBranch: "main", checks, headBranch: "feature", number: 12, target }), true);
assert.match(checkScope.get(composerSignal), /latest runs, annotations, and logs/);
assert.equal(checkScope.focusCount(), 1);
assert.equal(mod.o(checkScope, { baseBranch: "main", checks: [{ name: "ok", status: "passing" }], headBranch: "feature", number: 12, target }), false);

const conflictScope = createScope();
const conflict = { baseBranch: "main", headBranch: "feature", number: 12, repo: "org/repo", url: "https://github/pr/12" };
assert.equal(mod.c(conflictScope, conflict, target), true);
assert.equal(conflictScope.get(repairStateSignal).pullRequestMergeConflict.url, conflict.url);
assert.match(conflictScope.get(composerSignal), /resolve the attached merge conflict blocker/);
assert.equal(conflictScope.focusCount(), 1);
assert.equal(mod.c(conflictScope, null, target), false);

const allScope = createScope();
assert.equal(mod.s(allScope, { baseBranch: "main", conversationId: "conversation-2", headBranch: "feature", target, pullRequestStatus: { activityItems: [comment], checks, mergeBlocker: "conflicts", number: 12, repo: "org/repo", url: conflict.url } }), true);
const allPrompt = allScope.get(composerSignal);
assert.match(allPrompt, /failing CI check/);
assert.match(allPrompt, /merge conflicts/);
assert.match(allPrompt, /review comment/);
assert.equal(allScope.get(repairStateSignal).pullRequestChecks.length, 1);
assert.equal(allScope.get(repairStateSignal).pullRequestMergeConflict.url, conflict.url);
assert.equal(allScope.get(attachmentsSignal)["conversation-2"].length, 1);
assert.equal(mod.s(createScope(), { baseBranch: "main", conversationId: null, headBranch: "feature", target, pullRequestStatus: { activityItems: [comment], checks: [], number: 12 } }), false);

mod.S();
const mergeButton = mod.x({ isMergePending: true, onMerge: () => {} });
assert.equal(mergeButton.type, "button");
assert.equal(mergeButton.props.disabled, true);
assert.equal(mergeButton.props["aria-busy"], true);
assert.equal(mergeButton.props.children, "Updating pull request…");
assert.equal(mod.y({ detail: { isAuthor: false, state: "open" } }), null);
assert.equal(mod.y({ detail: { isAuthor: true, state: "merged" } }), null);
assert.equal(mod.y({ detail: { isAuthor: true, state: "open" } }).type, mod.x);

console.log("pull request fix workflow: 60 assertions");
