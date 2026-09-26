import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/request-protocol.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const protocol = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

const expectedConstants = {
  BROWSER_FORM_FILL_PATH: "/flora/browser/form-fill",
  CODEX_SURFACE_HEADER: "X-Codex-Surface",
  ATTACH_AUTH_HEADER: "X-OpenAI-Attach-Auth",
  ATTACH_DESKTOP_SURFACE_HEADER: "X-OpenAI-Attach-Desktop-Surface",
  ATTACH_DEVICE_CHECK_TOKEN_HEADER: "X-OpenAI-Attach-DeviceCheck-Token",
  ATTACH_INTEGRITY_STATE_HEADER: "X-OpenAI-Attach-Integrity-State",
  EXPECTED_ACCOUNT_ID_HEADER: "X-OpenAI-Expected-Account-Id",
};

let assertions = 0;
for (const [name, expected] of Object.entries(expectedConstants)) {
  assert.equal(protocol[name], expected, `restores ${name}`);
  assertions += 1;
}
assert.deepEqual(
  protocol.SERVER_TIMING_HEADERS,
  [
    "s-cf-origin-ttfb-msec",
    "s-cf-quic-rtt-msec",
    "s-cf-tcp-rtt-msec",
    "s-sa-server-ttfb-msec",
    "x-oai-request-id",
  ],
  "restores the server timing allowlist",
);
assertions += 1;
assert.equal(
  protocol.initializeRequestProtocol(),
  undefined,
  "initializes request protocol constants",
);
assertions += 1;

console.log(
  `app-shared request protocol behavior: ${assertions}/${assertions} assertions passed`,
);
