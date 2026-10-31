import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/environment-config/service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const runtime = await import(`data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };

equal(runtime.environmentConfigPath({ method: "POST", body: {} }), "/v1/environment-configs");
equal(runtime.environmentConfigPath({ method: "POST", configId: "a/b", body: { expected_revision: 1 } }), "/v1/environment-configs/a%2Fb/draft/approve");
equal(runtime.environmentConfigPath({ method: "POST", configId: "id", body: { operation_id: "operation" } }), "/v1/environment-configs/id/draft/approve/complete");
equal(runtime.environmentConfigPath({ method: "PATCH", configId: "id", body: { base_version_id: "base" } }), "/v1/environment-configs/id/draft");
equal(runtime.environmentConfigPath({ method: "GET", configId: "id" }), "/v1/environment-configs/id");
const redacted = runtime.redactEnvironmentDiagnostic("Bearer token Authorization: secret sk-abcdefgh https://secret.test\nnext");
equal(redacted.includes("token"), false);
equal(redacted.includes("secret.test"), false);
equal(redacted.includes("\n"), false);
equal(runtime.redactEnvironmentDiagnostic("x".repeat(600)).length, 512);

class RpcHandlerBase {}
const requestSchema = { safeParse: (value) => value?.invalid ? ({ success: false }) : ({ success: true, data: value }) };
const responseSchema = { safeParse: (value) => value?.invalidResponse ? ({ success: false }) : ({ success: true, data: value }) };
const emptySchema = { safeParse: (value) => ({ success: value === undefined, data: value }) };
const diagnosticSchema = {
  safeParse: (value) => Number.isInteger(value?.error?.code) && typeof value?.error?.message === "string"
    ? ({ success: true, data: value })
    : ({ success: false }),
};
const schemas = {
  deleteRequest: requestSchema,
  emptyResponse: emptySchema,
  saveValueRequest: requestSchema,
  saveValueResponse: responseSchema,
  listResponse: responseSchema,
  configRequest: requestSchema,
  configResponse: responseSchema,
  vpnRequest: requestSchema,
  vpnResponse: responseSchema,
  personalSecretsRequest: requestSchema,
  personalSecretsListResponse: responseSchema,
  personalSecretsWriteResponse: responseSchema,
  personalSecretsPreflightRequest: requestSchema,
  personalSecretsPreflightResponse: responseSchema,
  approvalRequest: requestSchema,
  readOperationRequest: requestSchema,
  operationResponse: responseSchema,
  outboundListRequest: requestSchema,
  outboundListResponse: responseSchema,
  outboundRequest: requestSchema,
  outboundResponse: responseSchema,
  failureDiagnostic: diagnosticSchema,
};

let token = { accountId: "account", userId: "user" };
let tokenSequence = null;
const fetchCalls = [];
const timeoutCalls = [];
const warnings = [];
let now = 1_000;
let fetchOverride = null;
const responseFor = (route, options) => {
  if (fetchOverride != null) return fetchOverride(route, options);
  if (options.method === "DELETE") return new Response(null, { status: 204 });
  if (route.includes("scope=user")) return new Response(JSON.stringify({ data: ["user"], nextCursor: "user-next" }), { status: 200 });
  if (route.includes("scope=workspace")) return new Response(JSON.stringify({ data: ["workspace"], nextCursor: null }), { status: 200 });
  return new Response(JSON.stringify({ route, method: options.method }), { status: 200 });
};
const httpClient = {
  async getAuthToken() { return tokenSequence?.shift() ?? token; },
  async fetch(route, options) {
    fetchCalls.push([route, options]);
    const response = await responseFor(route, options);
    return { response };
  },
};
const EnvironmentConfigService = runtime.createEnvironmentConfigServiceClass({
  RpcHandlerBase,
  createHttpClient: () => httpClient,
  accountIdFromToken: (value) => value?.accountId,
  identityFromToken: (value) => value,
  loggerFactory: () => () => ({ warning: (...args) => warnings.push(args) }),
  timeoutSignal: (milliseconds) => { timeoutCalls.push(milliseconds); return { milliseconds }; },
  now: () => { now += 25; return now; },
  schemas,
});
const service = new EnvironmentConfigService(async () => token, { host: true });
const auth = { accountId: "account", userId: "user" };

equal(await service.delete({ ...auth, method: "DELETE", configId: "config/id" }), { ok: true });
equal(fetchCalls.at(-1)[0], "/v1/environment-configs/config%2Fid");
equal(await service.delete({ invalid: true }), { ok: false, error: "invalid-request" });
equal(await service.saveEnvironmentValue({ ...auth, method: "POST", body: { value: "x" } }), {
  ok: true,
  data: { route: "/v1/environment-values", method: "POST" },
});

equal(await service.list(auth), {
  ok: true,
  page: { data: ["user", "workspace"], nextCursor: { user: "user-next", workspace: null } },
});
const listCallCount = fetchCalls.length;
equal(await service.list({ ...auth, cursor: { user: "next/value" } }), {
  ok: true,
  page: { data: ["user"], nextCursor: { user: "user-next", workspace: null } },
});
equal(fetchCalls.length, listCallCount + 1, "missing workspace cursor skips that scope");
equal(fetchCalls.at(-1)[0].includes("cursor=next%2Fvalue"), true);

equal((await service.request({ ...auth, method: "POST", configId: "config", body: { expected_revision: 3 } })).ok, true);
equal(fetchCalls.at(-1)[0], "/v1/environment-configs/config/draft/approve");
equal(timeoutCalls.at(-1), 600_000);
equal(fetchCalls.at(-1)[1].body, JSON.stringify({ expected_revision: 3 }));
await service.request({ ...auth, method: "POST", configId: "config", body: { operation_id: "operation" } });
equal(fetchCalls.at(-1)[0], "/v1/environment-configs/config/draft/approve/complete");
await service.request({ ...auth, method: "PATCH", configId: "config", body: { base_version_id: "base" } });
equal(fetchCalls.at(-1)[0], "/v1/environment-configs/config/draft");
equal(timeoutCalls.at(-1), 30_000);
equal(await service.request({ invalid: true }), { ok: false, error: "invalid-request" });

await service.requestVpn({ ...auth, method: "GET", configId: "vpn" });
equal(fetchCalls.at(-1)[0], "/v1/environment-configs/vpn/vpn");
await service.requestPersonalSecrets({ ...auth, method: "GET", cursor: "cursor/value", namespace: "sensitive" });
equal(fetchCalls.at(-1)[0], "/v1/personal-secrets?cursor=cursor%2Fvalue&namespace=sensitive");
await service.requestPersonalSecrets({ ...auth, method: "POST", body: {} });
equal(fetchCalls.at(-1)[0], "/v1/personal-secrets");
await service.preflightPersonalSecrets({ ...auth, configId: "pre/flight" });
equal(fetchCalls.at(-1)[0], "/v1/personal-secrets/preflight?environment_config_id=pre%2Fflight");
await service.requestApproval({ ...auth, method: "POST", configId: "approval", body: { idempotency_key: "idem" } });
equal(fetchCalls.at(-1)[0], "/v1/environment-configs/approval/draft/approve/begin");
equal(timeoutCalls.at(-1), 30_000, "approval begin uses the short timeout");
await service.readOperation({ ...auth, operationId: "op/value" });
equal(fetchCalls.at(-1)[0], "/v1/environment-operations/op%2Fvalue");
await service.listOutboundIdentityConnections({ ...auth, configId: "outbound" });
equal(fetchCalls.at(-1)[0], "/v1/environment-configs/outbound/outbound-identity-connections");
await service.requestOutboundIdentityConnection({ ...auth, method: "POST", body: {} });
equal(fetchCalls.at(-1)[0], "/v1/outbound-identity-connections");
await service.requestOutboundIdentityConnection({ ...auth, method: "GET", connectionId: "connection/value" });
equal(fetchCalls.at(-1)[0], "/v1/outbound-identity-connections/connection%2Fvalue");

token = { accountId: "other", userId: "user" };
const callsBeforeAuthFailure = fetchCalls.length;
equal(await service.request({ ...auth, method: "GET", configId: "config" }), { ok: false, error: "authentication" });
equal(fetchCalls.length, callsBeforeAuthFailure, "initial identity mismatch blocks the network request");
token = { accountId: "account", userId: "user" };
tokenSequence = [token, { accountId: "account", userId: "changed" }];
equal(await service.request({ ...auth, method: "GET", configId: "config" }), { ok: false, error: "authentication" });
tokenSequence = null;

fetchOverride = () => new Response(JSON.stringify({
  error: { code: 401, message: "Bearer private Authorization: secret https://private.test\nsecond" },
}), { status: 400, headers: { "content-type": "application/problem+json", "x-request-id": "request-123" } });
const httpFailure = await service.request({ ...auth, method: "GET", configId: "secret/config" });
equal(httpFailure.ok, false);
equal(httpFailure.error, "http");
equal(httpFailure.message.includes("private"), false);
equal(httpFailure.message.includes("private.test"), false);
equal(warnings.at(-1)[1].safe.route, "/v1/environment-configs/:configId");
equal(warnings.at(-1)[1].sensitive.requestId, "request-123");

fetchOverride = () => new Response(JSON.stringify({ error: { code: 500, message: "x".repeat(9_000) } }), {
  status: 500,
  headers: { "content-type": "application/json" },
});
equal("message" in await service.request({ ...auth, method: "GET", configId: "oversized" }), false, "streamed diagnostics over 8 KiB are discarded");
fetchOverride = () => new Response(JSON.stringify({ error: { code: 500, message: "small" } }), {
  status: 500,
  headers: { "content-type": "application/json", "content-length": "9000" },
});
equal("message" in await service.request({ ...auth, method: "GET", configId: "declared-large" }), false, "declared oversized diagnostics are not read");

const warningsBeforePlainHttp = warnings.length;
await service.requestOutboundIdentityConnection({ ...auth, method: "GET", connectionId: "connection" });
equal(warnings.length, warningsBeforePlainHttp, "non-diagnostic endpoints return HTTP status without logging a body");

fetchOverride = () => { throw Error("Bearer private api_key=secret https://private.test"); };
const unavailable = await service.request({ ...auth, method: "GET", configId: "config" });
equal(unavailable.error, "unavailable");
equal(unavailable.message.includes("private.test"), false);
equal(warnings.at(-1)[1].safe.errorName, "Error");

fetchOverride = () => new Response(JSON.stringify({ invalidResponse: true }), { status: 200 });
equal(await service.request({ ...auth, method: "GET", configId: "config" }), { ok: false, error: "invalid-response" });
fetchOverride = null;

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(main.includes("EnvironmentConfigService = createEnvironmentConfigServiceClass({"), true);
for (const symbol of ["Vk", "Kk", "Hk", "qk", "Jk", "Uk", "Wk", "Gk"]) equal(new RegExp(`\\b${symbol}\\b`).test(main), false, `${symbol} must be removed`);
equal(windowContext.includes("environmentConfigs: new EnvironmentConfigService("), true);

console.log(`${assertions} main environment config service assertions passed`);
