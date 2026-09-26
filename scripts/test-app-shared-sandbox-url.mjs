import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/sandbox-url.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const sandbox = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

equal(
  sandbox.createSandboxPartition("wallet-enrollment"),
  "codex-mcp-app-sandbox:wallet-enrollment",
  "creates an in-memory Electron partition",
);
equal(
  sandbox.createSandboxPartition("wallet-enrollment", { persist: true }),
  "persist:codex-mcp-app-sandbox:wallet-enrollment",
  "creates a persistent Electron partition",
);
equal(
  sandbox.createSandboxPartition("shared", { persist: false }),
  "codex-mcp-app-sandbox:shared",
  "honors an explicit non-persistent option",
);

equal(
  sandbox.getTrustedSandboxOrigin(
    "https://web-sandbox.oaiusercontent.com/path?app=other",
  ),
  "https://web-sandbox.oaiusercontent.com",
  "accepts the root sandbox host",
);
equal(
  sandbox.getTrustedSandboxOrigin(
    "https://wallet.web-sandbox.oaiusercontent.com/?app=skybridge",
  ),
  "https://wallet.web-sandbox.oaiusercontent.com",
  "accepts sandbox subdomains",
);
equal(
  sandbox.getTrustedSandboxOrigin(
    new URL("codex-sandbox://wallet.web-sandbox.oaiusercontent.com/"),
  ),
  "codex-sandbox://wallet.web-sandbox.oaiusercontent.com",
  "accepts codex-sandbox URLs",
);
equal(
  sandbox.getTrustedSandboxOrigin(
    "https://wallet.web-sandbox.oaiusercontent.com/?app=skybridge&locale=en",
    { requireSkybridge: true },
  ),
  "https://wallet.web-sandbox.oaiusercontent.com",
  "accepts a valid Skybridge entry URL",
);

for (const [value, options, message] of [
  ["not a URL", undefined, "rejects malformed URLs"],
  [
    "http://web-sandbox.oaiusercontent.com/",
    undefined,
    "rejects insecure HTTP",
  ],
  [
    "https://web-sandbox.oaiusercontent.com:444/",
    undefined,
    "rejects explicit ports",
  ],
  [
    "https://user@web-sandbox.oaiusercontent.com/",
    undefined,
    "rejects credentials",
  ],
  [
    "https://web-sandbox.oaiusercontent.com.evil.example/",
    undefined,
    "rejects suffix attacks",
  ],
  ["https://oaiusercontent.com/", undefined, "rejects parent domains"],
  [
    "https://wallet.web-sandbox.oaiusercontent.com/path?app=skybridge",
    { requireSkybridge: true },
    "requires the Skybridge root path",
  ],
  [
    "https://wallet.web-sandbox.oaiusercontent.com/?app=other",
    { requireSkybridge: true },
    "requires the Skybridge app parameter",
  ],
]) {
  equal(sandbox.getTrustedSandboxOrigin(value, options), null, message);
}

equal(
  sandbox.initializeSandboxUrls(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared sandbox URL behavior: ${assertions}/${assertions} assertions passed`,
);
