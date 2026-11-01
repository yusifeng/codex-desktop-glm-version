import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

async function importBundled(entryPoint) {
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

const diagnostics = await importBundled(
  path.join(root, "src/main/main-app/diagnostics/rollout-diagnostics.ts"),
);
const startTimeMs = Date.parse("2026-11-01T00:00:00.000Z");
const endTimeMs = Date.parse("2026-11-01T10:00:00.000Z");

const missing = await diagnostics.collectRolloutDiagnostics({
  codexHome: path.join(tmpdir(), `missing-rollout-diagnostics-${process.pid}`),
  params: { startTimeMs, endTimeMs },
});
equal(missing, {
  startTimeMs,
  endTimeMs,
  maxRollouts: 128,
  scannedRolloutCount: 0,
  parsedRolloutCount: 0,
  rolloutCountWithCompletedTurns: 0,
  rolloutCountWithEstimatedTurns: 0,
  completedTurnCount: 0,
  estimatedTurnCount: 0,
  totalOutputTokens: 0,
  totalReasoningOutputTokens: 0,
  totalGeneratedTokens: 0,
  observedCompletedTurnWallTimeMs: 0,
  estimatedStandardMs: 0,
  estimatedFastMs: 0,
  estimatedSavedMs: 0,
});

const fixtureRoot = await mkdtemp(path.join(tmpdir(), "codex-rollout-diagnostics-"));
try {
  const day = path.join(fixtureRoot, "sessions", "2026", "11", "01");
  await mkdir(day, { recursive: true });
  const event = (timestamp, payload) =>
    JSON.stringify({ timestamp, type: "event_msg", payload });
  const completedRollout = path.join(day, "rollout-1.jsonl");
  await writeFile(completedRollout, [
    "not-json",
    JSON.stringify({ type: "response_item", payload: {} }),
    event("2026-11-01T01:00:00.000Z", { type: "task_started" }),
    event("2026-11-01T01:00:00.500Z", {
      type: "token_count",
      info: { last_token_usage: { output_tokens: 10, reasoning_output_tokens: 5 } },
    }),
    event("2026-11-01T01:00:02.000Z", { type: "task_complete" }),
    event("2026-11-01T02:00:00.000Z", { type: "task_started" }),
    event("2026-11-01T02:00:01.000Z", { type: "task_complete" }),
    event("2026-11-01T11:00:00.000Z", { type: "task_started" }),
    event("2026-11-01T11:00:01.000Z", { type: "task_complete" }),
    "",
  ].join("\n"));
  const emptyRollout = path.join(day, "rollout-2.jsonl");
  await writeFile(emptyRollout, `${JSON.stringify({ type: "ignored" })}\n`);
  const staleRollout = path.join(day, "rollout-stale.jsonl");
  await writeFile(staleRollout, `${event("2026-11-01T03:00:00.000Z", { type: "task_complete" })}\n`);
  await utimes(completedRollout, (startTimeMs + 1_000) / 1_000, (startTimeMs + 1_000) / 1_000);
  await utimes(emptyRollout, (startTimeMs + 2_000) / 1_000, (startTimeMs + 2_000) / 1_000);
  await utimes(staleRollout, (startTimeMs - 1_000) / 1_000, (startTimeMs - 1_000) / 1_000);

  equal(await diagnostics.collectRolloutDiagnostics({
    codexHome: fixtureRoot,
    params: { startTimeMs, endTimeMs, maxRollouts: 2.9 },
  }), {
    startTimeMs,
    endTimeMs,
    maxRollouts: 2,
    scannedRolloutCount: 2,
    parsedRolloutCount: 2,
    rolloutCountWithCompletedTurns: 1,
    rolloutCountWithEstimatedTurns: 1,
    completedTurnCount: 2,
    estimatedTurnCount: 1,
    totalOutputTokens: 10,
    totalReasoningOutputTokens: 5,
    totalGeneratedTokens: 15,
    observedCompletedTurnWallTimeMs: 3_000,
    estimatedStandardMs: 270,
    estimatedFastMs: 180,
    estimatedSavedMs: 90,
  });

  const newestOnly = await diagnostics.collectRolloutDiagnostics({
    codexHome: fixtureRoot,
    params: { startTimeMs, endTimeMs, maxRollouts: 0 },
  });
  equal(newestOnly.maxRollouts, 1);
  equal(newestOnly.scannedRolloutCount, 1);
  equal(newestOnly.parsedRolloutCount, 1);
  equal(newestOnly.completedTurnCount, 0);
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}

class WorkersRpcTarget {
  workersRuntimeMarker() { return "workers-runtime"; }
}
globalThis[Symbol.for("workers-module")] = { RpcTarget: WorkersRpcTarget };
const rpc = await importBundled(path.join(root, "src/main/shared/rpc-core.ts"));
equal(new rpc.RpcTarget().workersRuntimeMarker(), "workers-runtime");
equal(rpc.Uf, rpc.RpcTarget);
equal(rpc.ABORTED, { status: "aborted" });
equal(Object.isFrozen(rpc.ABORTED), true);
equal("connectRpc" in rpc, false);

{
  let requestSignal;
  const dispatcher = new rpc.AbortableFetchDispatcher(
    (_url, _options, signal) => new Promise((_resolve, reject) => {
      requestSignal = signal;
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    }),
  );
  const pending = dispatcher.fetch("https://example.com", {}, null);
  dispatcher.cancel("https://example.com");
  equal(requestSignal.aborted, true);
  await assert.rejects(pending, /aborted/);
  assertions += 1;
}

const main = fs.readFileSync(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
const fsDiagnostics = fs.readFileSync(
  path.join(root, "src/main/shared/fs-diagnostics.ts"),
  "utf8",
);
const rpcSource = fs.readFileSync(path.join(root, "src/main/shared/rpc-core.ts"), "utf8");
equal(main.includes('require("./main-app/diagnostics/rollout-diagnostics.js")'), true);
equal(main.includes("collectRolloutDiagnostics({ codexHome: V.codexHome, params })"), true);
equal(main.includes("resolveCodexHomeRequest: (params) => n.et("), false);
equal(fsDiagnostics.includes("function collectRolloutDiagnostics"), false);
equal(fsDiagnostics.includes("function countFilesWithBudget"), false);
equal(rpcSource.includes("not wired: RPC wire protocol"), false);

console.log(`${assertions} main rollout diagnostics runtime assertions passed`);
