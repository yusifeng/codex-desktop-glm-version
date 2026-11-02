#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const endpoint = process.env.CODEX_RENDERER_DEBUG_ENDPOINT ?? "http://127.0.0.1:9223";
const fixtureRoot = mkdtempSync(join(tmpdir(), "codex-packaged-git-e2e-"));
const repositoryRoot = join(fixtureRoot, "repository");
const worktreesRoot = join(fixtureRoot, "worktrees");

function git(args, cwd = repositoryRoot) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

async function connectRenderer() {
  const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
  const page = pages.find((candidate) =>
    candidate.type === "page" && candidate.url.startsWith("app://-/") && !candidate.url.includes("initialRoute="),
  );
  if (page == null) throw new Error(`No primary app renderer at ${endpoint}`);
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    const waiter = pending.get(message.id);
    if (waiter == null) return;
    pending.delete(message.id);
    if (message.error != null) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  const command = (method, params = {}) => {
    const id = nextId++;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { reject, resolve }));
  };
  const evaluate = async (expression) => {
    const result = await command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails != null)
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  await command("Runtime.enable");
  return { evaluate, close: () => socket.close() };
}

async function requestGitWorker(evaluate, method, params, timeoutMs = 120_000) {
  return evaluate(`(() => new Promise((resolve, reject) => {
    const bridge = window.electronBridge;
    if (bridge?.sendWorkerMessageFromView == null || bridge?.subscribeToWorkerMessages == null) {
      reject(new Error('Electron Git worker bridge is unavailable'));
      return;
    }
    const id = 'packaged-e2e-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    let unsubscribe = () => {};
    const finish = (callback, value) => {
      clearTimeout(timer);
      unsubscribe();
      callback(value);
    };
    const timer = setTimeout(() => finish(reject, new Error('Timed out waiting for Git worker: ' + ${JSON.stringify(method)})), ${timeoutMs});
    unsubscribe = bridge.subscribeToWorkerMessages('git', (message) => {
      if (message?.type !== 'worker-response' || message.workerId !== 'git' || message.response?.id !== id) return;
      const response = message.response;
      if (response.method !== ${JSON.stringify(method)}) {
        finish(reject, new Error('Mismatched Git worker response method: ' + response.method));
      } else if (response.result?.type === 'error') {
        finish(reject, new Error(response.result.error?.message ?? 'Git worker request failed'));
      } else {
        finish(resolve, response.result?.value);
      }
    });
    bridge.sendWorkerMessageFromView('git', {
      type: 'worker-request',
      workerId: 'git',
      request: {
        enqueuedAtMs: Date.now(),
        id,
        method: ${JSON.stringify(method)},
        params: ${JSON.stringify(params)},
      },
    }).catch((error) => finish(reject, error));
  }))()`);
}

let renderer;
try {
  mkdirSync(repositoryRoot);
  mkdirSync(worktreesRoot);
  git(["init", "-b", "main"]);
  git(["config", "user.name", "Codex Packaged E2E"]);
  git(["config", "user.email", "codex-packaged-e2e@example.invalid"]);
  writeFileSync(join(repositoryRoot, "fixture.txt"), "initial\n");
  git(["add", "fixture.txt"]);
  git(["commit", "-m", "initial fixture"]);
  writeFileSync(join(repositoryRoot, "fixture.txt"), "initial\nworker mutation\n");

  renderer = await connectRenderer();
  const commit = await requestGitWorker(renderer.evaluate, "commit", {
    cwd: repositoryRoot,
    message: "packaged worker commit",
    includeUnstaged: true,
    operationSource: "packaged_e2e",
  });
  if (commit?.status !== "success" || typeof commit.commitSha !== "string")
    throw new Error(`Unexpected commit result: ${JSON.stringify(commit)}`);
  const actualHead = git(["rev-parse", "HEAD"]);
  if (actualHead !== commit.commitSha.trim())
    throw new Error(`Worker commit SHA mismatch: ${commit.commitSha} != ${actualHead}`);
  if (!readFileSync(join(repositoryRoot, "fixture.txt"), "utf8").includes("worker mutation"))
    throw new Error("Committed fixture mutation is missing");

  const worktree = await requestGitWorker(renderer.evaluate, "create-worktree", {
    cwd: repositoryRoot,
    name: "packaged-e2e",
    startingState: { type: "branch", branchName: "main", remoteRef: null },
    upstreamRefreshMode: "never",
    localEnvironmentConfigPath: null,
    streamId: `packaged-e2e-${Date.now()}`,
    allowSetupFailure: true,
    setUpSyncedBranch: false,
    worktreesRoot,
    useWorkspaceDir: false,
    operationSource: "packaged_e2e",
  });
  if (typeof worktree?.worktreeGitRoot !== "string")
    throw new Error(`Unexpected worktree result: ${JSON.stringify(worktree)}`);
  const worktreeHead = git(["rev-parse", "HEAD"], worktree.worktreeGitRoot);
  if (worktreeHead !== actualHead)
    throw new Error(`Created worktree HEAD mismatch: ${worktreeHead} != ${actualHead}`);
  const porcelain = git(["worktree", "list", "--porcelain"]);
  if (!porcelain.includes(worktree.worktreeGitRoot))
    throw new Error(`Created worktree is absent from git worktree list: ${worktree.worktreeGitRoot}`);

  console.log(JSON.stringify({
    mode: "packaged-git-worker",
    status: "passed",
    commitSha: actualHead,
    worktreeGitRoot: worktree.worktreeGitRoot,
  }, null, 2));
} finally {
  renderer?.close();
  rmSync(fixtureRoot, { recursive: true, force: true });
}
