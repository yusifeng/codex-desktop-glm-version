import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const incentivesBuild = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/plugins/incentives-client.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createPluginIncentivesClientRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(incentivesBuild.outputFiles[0].text).toString("base64")}#plugin-incentives`
);

const identity = { accountId: "account-1", userId: "user-1" };
const token = (overrides = {}) => {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    "https://api.openai.com/auth": {
      chatgpt_account_id: identity.accountId,
      chatgpt_user_id: identity.userId,
    },
    ...overrides,
  };
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
};
let currentToken = token();
const authCalls = [];
const fetchCalls = [];
let fetchHandler = async () => assert.fail("fetch handler not configured");
const { PluginIncentivesClient } = createPluginIncentivesClientRuntime({
  runtime: {
    Uf: class {},
    Hs: "x-client-version",
    wf: z.object,
    hf: z.array,
    Of: z.string,
    Cf: z.number,
    df: z.enum,
    Lf: () => z.string(),
  },
  authHeaders: {
    mt: (headers, authToken, options) => {
      headers.Authorization = `Bearer ${authToken}`;
      headers.Originator = options.desktopOriginator;
    },
  },
});
const authClient = {
  getAuthToken: async ({ refreshToken }) => {
    authCalls.push(refreshToken);
    return currentToken;
  },
};
const client = new PluginIncentivesClient({
  localClient: authClient,
  clientForHost: () => authClient,
  desktopOriginator: "desktop-test",
  fetch: async (request, signal) => {
    fetchCalls.push({ request, signal });
    return fetchHandler(request, signal);
  },
});
const request = { campaignId: "campaign-1", hostId: "local", identity };
const offer = {
  campaign_id: "campaign-1",
  connector_id: "connector-1",
  plugin_id: "plugin-1",
  reward_credits: 100,
  remaining_redemptions: 2,
  claim_status: null,
  claim_expires_at: null,
  reward_granted_at: null,
  reward_starts_at: null,
  reward_expires_at: null,
};
const success = (data) => ({ response: { json: async () => data, body: { cancel: async () => {} } } });

fetchHandler = async () => success(offer);
assert.deepEqual(await client.read(request), { kind: "offer", offer });
assert.equal(fetchCalls.at(-1).request.method, "GET");
assert.equal(fetchCalls.at(-1).request.url, "/incentives/campaign-1");
assert.equal(fetchCalls.at(-1).request.headers.Authorization, `Bearer ${currentToken}`);
assert.equal(fetchCalls.at(-1).request.headers.Originator, "desktop-test");

fetchHandler = async () => success({ ...offer, campaign_id: "wrong" });
assert.deepEqual(await client.enroll(request), { kind: "retryable" });
assert.equal(fetchCalls.at(-1).request.method, "POST");
assert.equal(fetchCalls.at(-1).request.url, "/incentives/campaign-1/enroll");

fetchHandler = async () => success({ campaign_ids: ["one", "two"] });
assert.deepEqual(await client.listClaims(request), { kind: "claims", campaignIds: ["one", "two"] });
assert.equal(await client.checkIdentity(request), "matched");

fetchHandler = async () => ({ status: 404, error: "missing" });
assert.deepEqual(await client.read(request), { kind: "unavailable" });
fetchHandler = async () => ({ status: 409, error: JSON.stringify({ detail: "capacity_exhausted" }) });
assert.deepEqual(await client.read(request), { kind: "capacity-exhausted" });

let attempts = 0;
fetchHandler = async () => ++attempts === 1 ? { status: 401, error: "expired" } : success(offer);
assert.equal((await client.read(request)).kind, "offer");
assert.equal(attempts, 2);
assert.equal(authCalls.includes(true), true);

let bodyCancelled = 0;
fetchHandler = async () => {
  currentToken = token({ exp: 1 });
  return { response: { json: async () => offer, body: { cancel: async () => bodyCancelled++ } } };
};
assert.deepEqual(await client.read(request), { kind: "identity-changed" });
assert.equal(bodyCancelled, 1);
assert.equal(await client.checkIdentity(request), "identity-changed");
currentToken = token();

assert.equal(client.acknowledgeReceipt("receipt-1"), true);
assert.equal(client.acknowledgeReceipt("receipt-1"), false);
const secondClient = new PluginIncentivesClient({
  localClient: authClient,
  clientForHost: () => authClient,
  desktopOriginator: "desktop-test",
  fetch: fetchHandler,
});
assert.equal(secondClient.acknowledgeReceipt("receipt-1"), false);

client[Symbol.dispose]();
assert.equal(fetchCalls[0].signal.aborted, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /w6e = createPluginIncentivesClientRuntime\(\{/);
assert.doesNotMatch(main, /w6e = class/);
assert.doesNotMatch(main, /function V0\(/);

console.log("plugin incentives client assertions: 27");
