#!/usr/bin/env node
import { spawn } from "node:child_process";

const marker = process.env.CODEX_E2E_MARKER ??
  `E2E_REPLY_${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;

async function run(script, args = []) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: new URL("..", import.meta.url),
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} ${args[0] ?? ""} failed with ${signal ?? `exit ${code}`}`));
    });
  });
}

await run("scripts/e2e-electron-renderer.mjs", ["smoke-readonly"]);
await run("scripts/e2e-packaged-git-worker.mjs");
await run("scripts/e2e-electron-renderer.mjs", ["iab-navigation", "https://example.com/"]);
await run("scripts/e2e-electron-renderer.mjs", ["send-reply", marker]);
console.log(JSON.stringify({ mode: "critical", marker, status: "passed" }, null, 2));
