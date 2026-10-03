import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  deploymentChannel,
  deploymentChannelApi,
  webmcpPolicyChannel,
} = require("../app/.vite/build/browser-page-preload/deployment-channel.js");

assert.equal(deploymentChannel.Dev, "dev");
assert.equal(deploymentChannel.Prod, "prod");
assert.equal(deploymentChannelApi.parse("  beta "), null);
assert.equal(deploymentChannelApi.parse("  nightly "), "nightly");
assert.equal(deploymentChannelApi.isInternal("internal-alpha"), true);
assert.equal(deploymentChannelApi.allowDebugMenu("prod"), false);
assert.equal(deploymentChannelApi.supportsReactScan("agent"), true);
assert.equal(webmcpPolicyChannel, "codex_desktop:get-browser-webmcp-policy");

console.log("8 preload deployment channel assertions passed");
