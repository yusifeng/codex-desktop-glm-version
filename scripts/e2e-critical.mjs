#!/usr/bin/env node
import { spawn } from "node:child_process";

const marker = process.env.CODEX_E2E_MARKER ??
  `E2E_REPLY_${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;

async function run(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/e2e-electron-renderer.mjs", ...args], {
      cwd: new URL("..", import.meta.url),
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${args[0]} failed with ${signal ?? `exit ${code}`}`));
    });
  });
}

await run(["smoke-readonly"]);
await run(["send-reply", marker]);
console.log(JSON.stringify({ mode: "critical", marker, status: "passed" }, null, 2));
