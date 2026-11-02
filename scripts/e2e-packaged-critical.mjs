#!/usr/bin/env node
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url);
const endpoint = process.env.CODEX_RENDERER_DEBUG_ENDPOINT ?? "http://127.0.0.1:9223";
const port = new URL(endpoint).port || "9223";

async function endpointIsReady() {
  try {
    const pages = await fetch(`${endpoint}/json/list`).then((response) => response.json());
    return pages.some((page) => page.type === "page" && page.url === "app://-/index.html");
  } catch {
    return false;
  }
}

if (await endpointIsReady()) {
  throw new Error(`A renderer is already listening at ${endpoint}; close it before the managed packaged E2E run`);
}

let outputTail = "";
const app = spawn("./scripts/run.sh", [`--remote-debugging-port=${port}`], {
  cwd: root,
  detached: process.platform !== "win32",
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});
for (const stream of [app.stdout, app.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    outputTail = `${outputTail}${chunk}`.slice(-40_000);
  });
}

let appExit = null;
app.once("exit", (code, signal) => {
  appExit = { code, signal };
});

async function waitForStartup() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (appExit != null) throw new Error(`Packaged app exited during startup: ${JSON.stringify(appExit)}\n${outputTail}`);
    if (await endpointIsReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for packaged renderer at ${endpoint}\n${outputTail}`);
}

async function stopApp() {
  const signalApp = (signal) => {
    if (process.platform === "win32") app.kill(signal);
    else {
      try { process.kill(-app.pid, signal); } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    }
  };
  if (appExit == null) signalApp("SIGTERM");
  const deadline = Date.now() + 10_000;
  while (appExit == null && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (appExit == null) signalApp("SIGKILL");
  app.stdout.destroy();
  app.stderr.destroy();
}

try {
  await waitForStartup();
  await new Promise((resolve, reject) => {
    const suite = spawn(process.execPath, ["scripts/e2e-critical.mjs"], {
      cwd: root,
      env: { ...process.env, CODEX_RENDERER_DEBUG_ENDPOINT: endpoint },
      stdio: "inherit",
    });
    suite.once("error", reject);
    suite.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Critical suite failed with ${signal ?? `exit ${code}`}\n${outputTail}`));
    });
  });
  console.log(JSON.stringify({ mode: "packaged-critical", endpoint, startup: "passed", status: "passed" }, null, 2));
} finally {
  await stopApp();
}
