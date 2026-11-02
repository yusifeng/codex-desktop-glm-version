import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = await esbuild.build({
  entryPoints: [path.join(root, "src/main/shared/streams-runtime.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "logger-mock",
    setup(plugin) {
      plugin.onResolve({ filter: /^@chunk\/logger$/ }, () => ({ path: "logger", namespace: "mock" }));
      plugin.onResolve({ filter: /^\.\/(sql-git-registry|wsl-paths)$/ }, ({ path: request }) => ({ path: request, namespace: "mock" }));
      plugin.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
        loader: "js",
        contents: `
          export const memoizedTaggedLogger=()=>()=>({debug(){},info(){},warning(){},error(){},trace(){}});
          export const sanitizedProcessEnv=(env)=>({...env});
          export const principalOfToken=(token)=>{try{const payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));const claims=payload['https://api.openai.com/auth'];return {accountId:claims.chatgpt_account_id,userId:claims.user_id};}catch{return null;}};
        `,
      }));
    },
  }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString("base64")}`);

assert.deepEqual(runtime.unique([1, 2, 1, 3, 2]), [1, 2, 3]);
assert.deepEqual(runtime.uniqueBy([{ id: 1, v: "a" }, { id: 1, v: "b" }, { id: 2, v: "c" }], (entry) => entry.id), [
  { id: 1, v: "a" }, { id: 2, v: "c" },
]);
assert.deepEqual(runtime.chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
assert.deepEqual(runtime.chunk([1, 2], 0), [[1], [2]]);
const streamOf = (text) => new ReadableStream({
  start(controller) { controller.enqueue(new TextEncoder().encode(text)); controller.close(); },
});
assert.deepEqual(await runtime.readProcessResult({
  wait: async () => ({ exitCode: 7 }), stdout: streamOf("output"), stderr: streamOf("warning"),
}), { exitCode: 7, stdout: "output", stderr: "warning" });
assert.deepEqual([...await runtime.readHostFile(streamOf("bytes"))], [...new TextEncoder().encode("bytes")]);

const localA = runtime.hostConfigKey({ kind: "local", id: "local", websocket_url: "ws://one" });
const localB = runtime.hostConfigKey({ kind: "local", id: "local", websocket_url: "ws://two" });
assert.notEqual(localA, localB);
assert.equal(localA, runtime.hostConfigKey({ kind: "local", id: "local", websocket_url: "ws://one" }));
assert.notEqual(runtime.hostConfigKey({ kind: "wsl", id: "wsl", distro: "Ubuntu" }), runtime.hostConfigKey({ kind: "wsl", id: "wsl", distro: "Debian" }));

const token = [
  Buffer.from("{}").toString("base64url"),
  Buffer.from(JSON.stringify({ exp: 4_102_444_800, "https://api.openai.com/auth": { chatgpt_account_id: "acct", user_id: "user" } })).toString("base64url"),
  "signature",
].join(".");
let disposed = false;
assert.deepEqual(await runtime.resolveAuthPrincipal(
  async () => ({ authMethod: "chatgpt", authToken: token }),
  () => () => { disposed = true; },
), { kind: "chatgpt", accountId: "acct", userId: "user" });
assert.equal(disposed, true);
assert.deepEqual(await runtime.resolveAuthPrincipal(async () => ({ authMethod: "apiKey" }), () => () => {}), { kind: "execution-storage", authMode: "apiKey" });
assert.equal(await runtime.resolveAuthPrincipal(async () => ({ requiresOpenaiAuth: true }), () => () => {}), null);

const summary = runtime.summarizeDescendantProcesses([
  { ageSeconds: 10, command: "codex app-server", cpuPercent: 3, depth: 1, kind: "app_server", parentPid: 1, pid: 2, rootChildPid: 2, rssKb: 50 },
  { ageSeconds: 20, command: "git status", cpuPercent: 2, depth: 2, kind: "git", parentPid: 2, pid: 3, rootChildPid: 2, rssKb: 25 },
  { ageSeconds: null, command: "git diff", cpuPercent: null, depth: 1, kind: "git", parentPid: 1, pid: 4, rootChildPid: 4, rssKb: null },
]);
assert.deepEqual({ totalCount: summary.totalCount, directCount: summary.directCount, totalCpuPercent: summary.totalCpuPercent, totalRssKb: summary.totalRssKb, oldestAgeSeconds: summary.oldestAgeSeconds }, { totalCount: 3, directCount: 2, totalCpuPercent: 5, totalRssKb: 75, oldestAgeSeconds: 20 });
assert.deepEqual(summary.byKind.map(({ kind, count, directCount }) => ({ kind, count, directCount })), [
  { kind: "app_server", count: 1, directCount: 1 },
  { kind: "git", count: 2, directCount: 1 },
]);

const main = await import("node:fs/promises").then(({ readFile }) => readFile(path.join(root, "src/main-recovered/main-C-Mhak1n.ts"), "utf8"));
for (const alias of ["en", "tn", "nn", "an", "sn", "ln", "bc", "xc", "xi", "Qn", "mn", "$", "Yi", "Gr"])
  assert.doesNotMatch(main, new RegExp(`\\bn\\.${alias.replace("$", "\\$")}(?![\\w$])`));
const windowsAccount = await import("node:fs/promises").then(({ readFile }) => readFile(path.join(root, "src/main/main-app/platform/windows-account.ts"), "utf8"));
assert.match(windowsAccount, /in as registerProcessListProvider/);
const declarations = await import("node:fs/promises").then(({ readFile }) => readFile(path.join(root, "src/main/types/chunk-modules.d.ts"), "utf8"));
assert.match(declarations, /registerProcessListProvider as in/);
assert.doesNotMatch(declarations, /resolveAuthPrincipal as in/);

console.log("shared streams runtime assertions passed (39 assertions)");
