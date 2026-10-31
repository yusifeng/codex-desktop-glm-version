import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const sharedStub = `
const schema = () => ({
  optional() { return this; },
  loose() { return this; },
  safeParse(value) { return { success: true, data: value }; },
  parse(value) { return value; },
});
export const wf = () => schema();
export const Of = () => schema();
export const Mf = () => schema();
export const Ef = () => schema();
export const bs = (envId) => "remote-control:" + envId;
export class Ut { constructor(options) { this.options = options; } }
export const Wt = (url) => url.replace(/^http/, "ws");
export const eo = schema();
export const Qa = (error) => error?.keychainError ?? null;
export const $a = "KEYCHAIN_ERROR";
export const to = (payload) => payload;
`;
const bootstrapStub = `
export const vt = (options) => globalThis.__remoteControlFetch(options);
export class pt extends Error {}
export const mt = () => {};
export const ht = (url) => url;
export const _t = () => {};
export const xt = (_options, path) => "https://api.test" + path;
export const bt = (options) => globalThis.__remoteControlHeaders(options);
export const Y = "remote-control-enrollments";
`;
const loggerStub = `
export const memoizedTaggedLogger = () => () => ({ debug() {}, info() {}, warning() {}, error() {} });
`;

const bundled = await build({
  entryPoints: [
    new URL("../src/main/main-app/remote-control/client.ts", import.meta.url).pathname,
  ],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "node22",
  plugins: [
    {
      name: "remote-control-test-stubs",
      setup(buildApi) {
        buildApi.onResolve({ filter: /^@chunk\/(shared|bootstrap|logger)$/ }, (args) => ({
          path: args.path,
          namespace: "stub",
        }));
        buildApi.onLoad({ filter: /shared$/, namespace: "stub" }, () => ({
          contents: sharedStub,
          loader: "js",
        }));
        buildApi.onLoad({ filter: /bootstrap$/, namespace: "stub" }, () => ({
          contents: bootstrapStub,
          loader: "js",
        }));
        buildApi.onLoad({ filter: /logger$/, namespace: "stub" }, () => ({
          contents: loggerStub,
          loader: "js",
        }));
      },
    },
  ],
});
const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);

const apiOptions = {
  desktopOriginator: "desktop",
  devApiBaseUrl: "https://dev.test",
  prodApiBaseUrl: "https://prod.test",
};
const requests = [];
let responses = [];
globalThis.__remoteControlHeaders = async () => ({ authorization: "Bearer token" });
globalThis.__remoteControlFetch = async (options) => {
  requests.push(options);
  return responses.shift();
};

const environment = (envId, overrides = {}) => ({
  env_id: envId,
  display_name: "  Display " + envId + "  ",
  host_name: "host-" + envId,
  kind: "computer",
  client_type: "CODEX_DESKTOP",
  online: true,
  busy: false,
  os: "linux",
  arch: "x64",
  app_server_version: "1.2.3",
  ...overrides,
});
responses = [
  Response.json({ items: [environment("one")], cursor: "next page" }),
  Response.json({ items: [environment("two", { host_name: null })], cursor: null }),
];
const environments = await runtime.listRemoteControlEnvironments({
  appServerClient: {},
  clientId: "client/id",
  desktopApiOptions: apiOptions,
});
equal(environments.length, 2);
equal(environments[0], {
  hostId: "remote-control:one",
  displayName: "Display one",
  hostName: "host-one",
  hasReportedHostName: true,
  autoConnect: false,
  source: "remote-control",
  envId: "one",
  environmentKind: "computer",
  clientType: "CODEX_DESKTOP",
  online: true,
  busy: false,
  os: "linux",
  arch: "x64",
  appServerVersion: "1.2.3",
  installationId: null,
  lastSeenAt: null,
});
equal(environments[1].hostName, "Display two");
equal(environments[1].hasReportedHostName, false);
equal(requests[0].path, "/codex/remote/control/clients/client%2Fid/environments?limit=100");
equal(requests[1].path, "/codex/remote/control/clients/client%2Fid/environments?limit=100&cursor=next+page");

responses = [Response.json(environment("renamed"))];
const renamed = await runtime.renameRemoteControlEnvironment({
  appServerClient: {},
  desktopApiOptions: apiOptions,
  envId: "env/id",
  name: "New name",
});
equal(renamed.envId, "renamed");
equal(requests.at(-1).path, "/codex/remote/control/environments/env%2Fid");
equal(requests.at(-1).request.method, "PATCH");
equal(requests.at(-1).request.body, JSON.stringify({ name: "New name" }));

responses = [new Response(null, { status: 204 })];
await runtime.deleteRemoteControlEnvironment({
  appServerClient: {},
  desktopApiOptions: apiOptions,
  envId: "gone",
});
equal(requests.at(-1).request.method, "DELETE");

for (const [status, ErrorClass, detail] of [
  [404, runtime.RemoteControlFeatureUnavailableError, ""],
  [403, runtime.RemoteControlPermissionError, "permission detail"],
  [401, runtime.RemoteControlAuthError, ""],
]) {
  responses = [
    new Response(status === 403 ? JSON.stringify({ detail }) : "", {
      status,
      statusText: "failure",
    }),
  ];
  await assert.rejects(
    runtime.listRemoteControlEnvironments({
      appServerClient: {},
      clientId: null,
      desktopApiOptions: apiOptions,
    }),
    (error) => error instanceof ErrorClass && (status !== 403 || error.message === detail),
  );
  assertions += 1;
}

const claims = {
  sub: "subject",
  "https://api.openai.com/auth": {
    chatgpt_account_id: "account",
    chatgpt_account_user_id: "account-user",
    user_id: "auth-user",
  },
};
const token = `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
equal(runtime.resolveAuthIdentity({
  Authorization: `Bearer ${token}`,
  "chatgpt-account-id": "header-account",
}), {
  headerChatGptAccountId: "header-account",
  tokenAccountId: "account",
  tokenAccountUserId: "account-user",
  tokenAuthUserId: "auth-user",
  tokenSubject: "subject",
});
equal(runtime.enrollmentConnectionKey(apiOptions), [
  "desktop",
  "https://dev.test",
  "https://prod.test",
  "after-first-unlock-device-key-v1",
].join("\n"));

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
for (const token of [
  'require("./main-app/remote-control/client.js")',
  "authorizeRemoteControlEnvironments,",
  "RemoteControlTransport: RemoteControlWebsocketTransport",
  "listRemoteControlEnvironments,",
]) {
  equal(main.includes(token), true, `${token} must be wired`);
}
for (const removed of [
  "async function BEe(",
  "async function YEe(",
  "async function XEe(",
  "JEe = class extends",
  "async function fDe(",
]) {
  equal(main.includes(removed), false, `${removed} must be removed`);
}

console.log(`${assertions} main remote-control client runtime assertions passed`);
