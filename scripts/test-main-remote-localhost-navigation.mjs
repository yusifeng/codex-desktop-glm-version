import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const ownerText = fs.readFileSync(new URL("../src/main/main-app/browser-sidebar/remote-localhost-navigation.ts", import.meta.url), "utf8");
const ownerRuntime = await transform(ownerText, { loader: "ts", format: "cjs", target: "es2022" });
const ownerModule = { exports: {} };
Function("module", "exports", ownerRuntime.code)(ownerModule, ownerModule.exports);
const { createRemoteLocalhostNavigationForwarder } = ownerModule.exports;

const calls = [];
const forward = createRemoteLocalhostNavigationForwarder({
  createLogger: () => () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
  getLocalhostPort(value) {
    const parsed = new URL(value);
    return parsed.hostname === "localhost" && parsed.port ? Number(parsed.port) : null;
  },
  isSshHostConfig: (config) => config?.kind === "ssh",
});
let shouldFail = false;
const registry = {
  getConnection(hostId) {
    calls.push(["connection", hostId]);
    return {
      async startRemoteLocalhostPortForward(port) {
        calls.push(["forward", port]);
        if (shouldFail) throw new Error("forward failed");
        return 49152;
      },
    };
  },
};
const options = (hostId, url, config = { kind: "ssh" }) => ({
  appServerConnectionRegistry: registry,
  getHostConfigForHostId: () => config,
  hostId,
  url,
});

assert.equal(await forward(options(null, "http://localhost:3000/a")), "http://localhost:3000/a");
assert.equal(await forward(options("local", "http://localhost:3000/a")), "http://localhost:3000/a");
assert.equal(await forward(options("durable", "https://example.com/a")), "https://example.com/a");
assert.equal(await forward(options("durable", "http://localhost:3000/a")), null);
assert.equal(
  await forward(options("remote-1", "http://localhost:3000/a", { kind: "other" })),
  "http://localhost:3000/a",
);
assert.equal(await forward(options("remote-1", "https://example.com/a")), "https://example.com/a");
assert.equal(
  await forward(options("remote-1", "http://localhost:3000/a?x=1")),
  "http://localhost:49152/a?x=1",
);
assert.deepEqual(calls.filter(([kind]) => kind === "forward"), [["forward", 3000]]);
shouldFail = true;
assert.equal(await forward(options("remote-1", "http://localhost:4000/a")), null);
const warning = calls.find(([kind]) => kind === "warning");
assert.equal(warning[2].safe.remotePort, 4000);
assert.equal(warning[2].sensitive.hostId, "remote-1");

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /var OZ = createRemoteLocalhostNavigationForwarder\(\{/);
assert.doesNotMatch(main, /async function OZ\(/);

console.log("remote localhost navigation assertions: 13");
