import assert from "node:assert/strict";
import path from "node:path";
import crypto from "node:crypto";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/remote/remote-control-step-up.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createRemoteControlStepUpRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

function fixture({ busyPorts = [], env = {}, randomValues = [] } = {}) {
  const servers = [];
  const timers = [];
  const clearedTimers = [];
  const openedUrls = [];
  const fetches = [];
  let randomIndex = 0;
  const dependencies = {
    schema: {
      Of: () => ({ min: () => ({}) }),
      wf: () => ({
        loose: () => ({
          parse(value) {
            if (typeof value?.access_token !== "string" || value.access_token.length === 0)
              throw Error("invalid access token");
            return value;
          },
        }),
      }),
    },
    http: {
      createServer(handler) {
        const server = {
          handler,
          port: null,
          closed: false,
          errorHandler: null,
          once(event, callback) {
            if (event === "error") this.errorHandler = callback;
            return this;
          },
          listen(port, host, callback) {
            this.port = port;
            this.host = host;
            if (busyPorts.includes(port)) {
              const error = Error("busy");
              error.code = "EADDRINUSE";
              queueMicrotask(() => this.errorHandler(error));
            } else queueMicrotask(callback);
          },
          close() { this.closed = true; },
        };
        servers.push(server);
        return server;
      },
    },
    crypto: {
      randomBytes(length) {
        const value = randomValues[randomIndex++] ?? Buffer.alloc(length, randomIndex);
        return Buffer.isBuffer(value) ? value : Buffer.from(value);
      },
      createHash: crypto.createHash,
    },
    env,
    async fetchToken(input, init) {
      fetches.push({ input, init });
      return { ok: true, status: 200, json: async () => ({ access_token: "token-default" }) };
    },
    async openExternalUrl(url) { openedUrls.push(url); return true; },
    setTimer(callback, timeoutMs) {
      const timer = { callback, timeoutMs };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) { clearedTimers.push(timer); },
  };
  return {
    dependencies,
    state: { clearedTimers, fetches, openedUrls, servers, timers },
  };
}

function responseFixture() {
  return {
    status: null,
    headers: null,
    body: null,
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body) { this.body = body; },
  };
}

const base = fixture({ env: { CODEX_APP_SERVER_LOGIN_ISSUER: " https://issuer.example/// " } });
const runtime = createRemoteControlStepUpRuntime(base.dependencies);
equal(runtime.normalizeIssuer("https://issuer.example///"), "https://issuer.example", "issuer normalization removes trailing slashes");
equal(runtime.resolveIssuer(), "https://issuer.example///", "issuer environment override is trimmed");
equal(runtime.randomBase64Url(3), "AQEB", "random bytes are encoded as base64url");
const pkce = runtime.createPkce();
ok(pkce.codeVerifier.length > 0, "PKCE creates verifier");
equal(pkce.codeChallenge, crypto.createHash("sha256").update(pkce.codeVerifier).digest("base64url"), "PKCE challenge hashes verifier");

const authorizationUrl = new URL(runtime.buildAuthorizationUrl({
  issuer: "https://issuer.example/",
  clientId: "client",
  redirectUri: "http://localhost/callback",
  codeChallenge: "challenge",
  state: "state",
  originator: "desktop",
  accountId: "workspace-1",
}));
equal(authorizationUrl.origin, "https://issuer.example", "authorization URL uses normalized issuer");
equal(authorizationUrl.pathname, "/oauth/authorize", "authorization URL uses OAuth endpoint");
equal(authorizationUrl.searchParams.get("response_type"), "code", "authorization URL requests code flow");
equal(authorizationUrl.searchParams.get("scope"), "codex.remote_control.enroll", "authorization URL requests enrollment scope");
equal(authorizationUrl.searchParams.get("code_challenge_method"), "S256", "authorization URL uses S256 PKCE");
equal(authorizationUrl.searchParams.get("reauth"), "remote_control", "authorization URL requests remote-control reauth");
equal(authorizationUrl.searchParams.get("allowed_workspace_id"), "workspace-1", "authorization URL limits allowed workspace");
equal(authorizationUrl.searchParams.get("current_workspace_id"), "workspace-1", "authorization URL marks current workspace");

let tokenRequest;
equal(await runtime.exchangeAuthorizationCode({
  code: "auth-code",
  codeVerifier: "verifier",
  clientId: "client",
  issuer: "https://issuer.example/",
  redirectUri: "http://localhost/callback",
  fetchToken: async (input, init) => {
    tokenRequest = { input, init };
    return { ok: true, status: 200, json: async () => ({ access_token: "token-1" }) };
  },
}), { access_token: "token-1" }, "token exchange parses access token response");
equal(tokenRequest.input, "https://issuer.example/oauth/token", "token exchange uses normalized token endpoint");
equal(tokenRequest.init.method, "POST", "token exchange uses POST");
equal(tokenRequest.init.headers, { "Content-Type": "application/x-www-form-urlencoded" }, "token exchange sends form content type");
const tokenBody = new URLSearchParams(tokenRequest.init.body);
equal(tokenBody.get("grant_type"), "authorization_code", "token exchange sends authorization grant");
equal(tokenBody.get("code_verifier"), "verifier", "token exchange sends PKCE verifier");
await assert.rejects(() => runtime.exchangeAuthorizationCode({
  code: "bad",
  codeVerifier: "v",
  clientId: "c",
  issuer: "https://issuer.example",
  redirectUri: "http://localhost",
  fetchToken: async () => ({ ok: false, status: 401 }),
}), /status 401/);
assertions += 1;

const plainResponse = responseFixture();
runtime.writeTextResponse(plainResponse, 400, "Bad Request");
equal(plainResponse.status, 400, "text response writes status");
equal(plainResponse.headers.Connection, "close", "text response closes connection");
equal(plainResponse.body, "Bad Request", "text response writes body");
const page = runtime.successPageHtml();
ok(page.includes("Remote control authorized"), "success page includes title");
ok(page.includes("codex://settings/connections"), "success page returns to connection settings");
const successResponse = responseFixture();
runtime.writeSuccessResponse(successResponse);
equal(successResponse.status, 200, "success response writes status 200");
equal(successResponse.headers["Content-Type"], "text/html; charset=utf-8", "success response writes HTML content type");

const callbackFixture = fixture({ busyPorts: [1455] });
const callbackRuntime = createRemoteControlStepUpRuntime(callbackFixture.dependencies);
const callback = await callbackRuntime.createCallbackServer({ state: "expected", timeoutMs: 5000 });
equal(callback.redirectUri, "http://localhost:1457/auth/callback", "callback falls back to second port when first is busy");
equal(callbackFixture.state.servers[0].closed, true, "busy callback server is closed");
equal(callbackFixture.state.timers[0].timeoutMs, 5000, "callback installs requested timeout");
const callbackServer = callbackFixture.state.servers[1];

let response = responseFixture();
callbackServer.handler({ url: null }, response);
equal(response.status, 400, "callback rejects missing URL");
response = responseFixture();
callbackServer.handler({ url: "/wrong?state=expected" }, response);
equal(response.status, 404, "callback rejects wrong path");
response = responseFixture();
callbackServer.handler({ url: "/auth/callback?state=wrong&code=code" }, response);
equal(response.body, "State mismatch", "callback rejects state mismatch");
response = responseFixture();
callbackServer.handler({ url: "/auth/callback?state=expected" }, response);
equal(response.body, "Missing authorization code", "callback rejects missing code without settling");
response = responseFixture();
callbackServer.handler({ url: "/auth/callback?state=expected&code=accepted" }, response);
equal(await callback.authorizationCode, "accepted", "valid callback resolves authorization code");
equal(response.status, 200, "valid callback returns success page");
equal(callbackFixture.state.clearedTimers.length, 1, "valid callback clears timeout");
callback.close();
equal(callbackServer.closed, true, "callback close shuts down selected server");

const oauthErrorFixture = fixture();
const oauthErrorRuntime = createRemoteControlStepUpRuntime(oauthErrorFixture.dependencies);
const oauthCallback = await oauthErrorRuntime.createCallbackServer({ state: "state", timeoutMs: 100 });
const oauthErrorResponse = responseFixture();
oauthErrorFixture.state.servers[0].handler({
  url: "/auth/callback?state=state&error=denied&error_description=No+access",
}, oauthErrorResponse);
await assert.rejects(oauthCallback.authorizationCode, /denied: No access/);
assertions += 1;
equal(oauthErrorResponse.body, "Remote control login failed", "OAuth error returns failure response");
oauthCallback.close();

const timeoutFixture = fixture();
const timeoutRuntime = createRemoteControlStepUpRuntime(timeoutFixture.dependencies);
const timeoutCallback = await timeoutRuntime.createCallbackServer({ state: "state", timeoutMs: 10 });
timeoutFixture.state.timers[0].callback();
await assert.rejects(timeoutCallback.authorizationCode, /Timed out/);
assertions += 1;
timeoutCallback.close();

const cancelFixture = fixture();
const cancelRuntime = createRemoteControlStepUpRuntime(cancelFixture.dependencies);
const cancelCallback = await cancelRuntime.createCallbackServer({ state: "state", timeoutMs: 10 });
cancelCallback.close();
await assert.rejects(cancelCallback.authorizationCode, /cancelled/);
assertions += 1;
equal(cancelFixture.state.servers[0].closed, true, "cancel closes callback server");

const exhaustedFixture = fixture({ busyPorts: [1455, 1457] });
const exhaustedRuntime = createRemoteControlStepUpRuntime(exhaustedFixture.dependencies);
await assert.rejects(
  () => exhaustedRuntime.createCallbackServer({ state: "state", timeoutMs: 10 }),
  /already in use/,
);
assertions += 1;
equal(exhaustedFixture.state.servers.every(({ closed }) => closed), true, "all busy candidate servers are closed");

const endToEndFixture = fixture({ randomValues: [Buffer.alloc(32, 7), Buffer.alloc(32, 9)] });
let endToEndTokenRequest;
const endToEndRuntime = createRemoteControlStepUpRuntime({
  ...endToEndFixture.dependencies,
  async openExternalUrl(url) {
    endToEndFixture.state.openedUrls.push(url);
    const authorize = new URL(url);
    const state = authorize.searchParams.get("state");
    endToEndFixture.state.servers[0].handler({
      url: `/auth/callback?state=${encodeURIComponent(state)}&code=end-code`,
    }, responseFixture());
    return true;
  },
  async fetchToken(input, init) {
    endToEndTokenRequest = { input, init };
    return { ok: true, status: 200, json: async () => ({ access_token: "end-token" }) };
  },
});
equal(await endToEndRuntime.requestRemoteControlEnrollmentStepUpToken({
  accountId: "account-1",
  desktopApiOptions: { desktopOriginator: "desktop-app" },
}), "end-token", "end-to-end step-up returns exchanged access token");
const openedAuthorize = new URL(endToEndFixture.state.openedUrls[0]);
equal(openedAuthorize.searchParams.get("originator"), "desktop-app", "end-to-end authorize URL includes desktop originator");
equal(openedAuthorize.searchParams.get("allowed_workspace_id"), "account-1", "end-to-end authorize URL includes account restriction");
equal(new URLSearchParams(endToEndTokenRequest.init.body).get("code"), "end-code", "end-to-end token exchange uses callback code");
equal(endToEndFixture.state.servers[0].closed, true, "end-to-end flow closes callback server in finally");

const openFailureFixture = fixture();
const openFailureRuntime = createRemoteControlStepUpRuntime({
  ...openFailureFixture.dependencies,
  openExternalUrl: async () => false,
});
await assert.rejects(() => openFailureRuntime.requestRemoteControlEnrollmentStepUpToken({
  accountId: null,
  desktopApiOptions: { desktopOriginator: "desktop" },
}), /Failed to open/);
assertions += 1;
equal(openFailureFixture.state.servers[0].closed, true, "browser-open failure still closes callback server");

ok(assertions >= 45, "remote-control step-up owner has broad PKCE, URL, token, callback, timeout, and cleanup coverage");
console.log(`${assertions} main remote-control step-up owner assertions passed`);
