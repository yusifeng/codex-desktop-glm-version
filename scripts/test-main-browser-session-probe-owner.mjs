import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/browser-session/browser-session-probe.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserSessionProbeRuntime } = await import(
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

function valueSchema(validate) {
  return {
    safeParse(value) {
      const result = validate(value);
      return result.ok ? { success: true, data: result.data } : { success: false };
    },
    regex(pattern) {
      return valueSchema((value) =>
        typeof value === "string" && pattern.test(value)
          ? { ok: true, data: value }
          : { ok: false });
    },
    nullable() {
      return valueSchema((value) => value === null
        ? { ok: true, data: null }
        : validate(value));
    },
    optional() {
      return valueSchema((value) => value === undefined
        ? { ok: true, data: undefined }
        : validate(value));
    },
  };
}

const schema = {
  Of() {
    return valueSchema((value) => typeof value === "string"
      ? { ok: true, data: value }
      : { ok: false });
  },
  wf(shape) {
    return Object.assign(
      valueSchema((value) => {
        if (value == null || typeof value !== "object" || Array.isArray(value)) return { ok: false };
        const data = {};
        for (const [key, child] of Object.entries(shape)) {
          const parsed = child.safeParse(value[key]);
          if (!parsed.success) return { ok: false };
          if (parsed.data !== undefined) data[key] = parsed.data;
        }
        return { ok: true, data };
      }),
      {},
    );
  },
};

class RpcHandlerBase {}
class FakeServer extends EventEmitter {
  listening = false;
  closeCalls = 0;
  closeAllCalls = 0;
  constructor(handler) {
    super();
    this.handler = handler;
  }
  listen(_port, host, callback) {
    this.host = host;
    this.listening = true;
    callback();
  }
  address() { return { port: 4321 }; }
  unref() { this.unrefCalled = true; }
  close() {
    this.listening = false;
    this.closeCalls += 1;
  }
  closeAllConnections() { this.closeAllCalls += 1; }
}

const createdServers = [];
const openedUrls = [];
let addonLoads = 0;
const baseDependencies = {
  RpcHandlerBase,
  schema,
  crypto: {
    randomBytes() { return { toString: () => "s".repeat(43) }; },
    randomUUID() { return "uuid-state"; },
    createHash() {
      return { update() { return this; }, digest() { return "c".repeat(43); } };
    },
  },
  http: {
    createServer(handler) {
      const server = new FakeServer(handler);
      createdServers.push(server);
      return server;
    },
  },
  electron: {
    app: { getAppPath: () => "/app" },
    net: { fetch: () => { throw new Error("unexpected default fetch"); } },
    shell: {
      async openExternal(url, options) { openedUrls.push({ url, options }); },
    },
  },
  loadBrowserStateAddon() {
    addonLoads += 1;
    return {
      getDefaultWebBrowserState() {
        return { browserHasVisibleWindow: true, browserIsRunning: true };
      },
    };
  },
  resolveElectronResourcesPath: () => "/resources",
  allowDebugMenu: () => false,
  platform: "darwin",
  architecture: "arm64",
};

const runtime = createBrowserSessionProbeRuntime(baseDependencies);
equal(runtime.normalizeAvatarUrl("https://images.example/avatar.png"), "https://images.example/avatar.png", "HTTPS avatar is accepted");
equal(runtime.normalizeAvatarUrl("http://images.example/avatar.png"), null, "HTTP avatar is rejected");
equal(runtime.normalizeAvatarUrl("not a url"), null, "invalid avatar URL is rejected");
equal(runtime.normalizeAvatarUrl(`https://example.com/${"x".repeat(4090)}`), null, "oversized avatar URL is rejected");

const originalNodeEnv = process.env.NODE_ENV;
const originalAuthOrigin = process.env.VITE_CODEX_DESKTOP_AUTH_ORIGIN;
process.env.NODE_ENV = "production";
equal(runtime.getAuthOrigin(), "https://chatgpt.com", "production auth origin is fixed");
equal(runtime.parseProbeUrl("https://chatgpt.com/codex/desktop-session")?.pathname, "/codex/desktop-session", "canonical probe URL is accepted");
equal(runtime.parseProbeUrl("https://chatgpt.com/codex/desktop-session?q=1"), null, "probe query is rejected before mutation");
equal(runtime.parseProbeUrl("https://evil.example/codex/desktop-session"), null, "foreign probe origin is rejected");
equal(runtime.parseProbeUrl("not-a-url"), null, "invalid probe URL is rejected");
process.env.NODE_ENV = "development";
process.env.VITE_CODEX_DESKTOP_AUTH_ORIGIN = "http://localhost:5173";
equal(runtime.getAuthOrigin(), "http://localhost:5173", "loopback development origin is admitted");
process.env.VITE_CODEX_DESKTOP_AUTH_ORIGIN = "http://remote.example";
equal(runtime.getAuthOrigin(), "https://chatgpt.com", "remote insecure development origin is rejected");
process.env.NODE_ENV = originalNodeEnv;
if (originalAuthOrigin === undefined) delete process.env.VITE_CODEX_DESKTOP_AUTH_ORIGIN;
else process.env.VITE_CODEX_DESKTOP_AUTH_ORIGIN = originalAuthOrigin;

const callbackOrigin = "http://127.0.0.1:4321";
const state = "state-1";
const code = "a".repeat(43);
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&code=${code}`, callbackOrigin, state, "high"), { code }, "high-security callback accepts one valid code");
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&error=browser_authentication_required`, callbackOrigin, state, "high"), { error: "browser_authentication_required" }, "high-security authentication error is explicit");
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&code=short`, callbackOrigin, state, "high"), undefined, "short authorization code is rejected");
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&state=duplicate&code=${code}`, callbackOrigin, state, "high"), undefined, "duplicate state is rejected");
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&code=${code}&extra=1`, callbackOrigin, state, "high"), undefined, "unknown callback parameter is rejected");
equal(runtime.parseCallbackRequest(`https://evil.example/browser-session?state=${state}&code=${code}`, callbackOrigin, state, "high"), undefined, "foreign callback origin is rejected");
equal(runtime.parseCallbackRequest(`/wrong?state=${state}&code=${code}`, callbackOrigin, state, "high"), undefined, "wrong callback path is rejected");

equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&email=%20user%40example.com%20&name=%20Ada%20&avatar_url=https%3A%2F%2Fimg.example%2Fa.png`, callbackOrigin, state, "low"), {
  profile: { avatarUrl: "https://img.example/a.png", email: "user@example.com", name: "Ada" },
}, "low-security callback normalizes profile fields");
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&error=browser_session_lookup_disabled`, callbackOrigin, state, "low"), { error: "browser_session_lookup_disabled" }, "lookup-disabled callback is preserved");
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&email=`, callbackOrigin, state, "low"), undefined, "empty profile email is rejected");

const debugRuntime = createBrowserSessionProbeRuntime({
  ...baseDependencies,
  allowDebugMenu: () => true,
});
equal(debugRuntime.parseCallbackRequest(`/browser-session?state=${state}&code=${code}&debug_auth_status=ready&debug_has_email=true&debug_has_session_user=false`, callbackOrigin, state, "high"), {
  code,
  browserSession: { authStatus: "ready", hasEmail: true, hasSessionUser: false },
}, "debug callback metadata is projected only when complete");
equal(runtime.parseCallbackRequest(`/browser-session?state=${state}&code=${code}&debug_auth_status=ready`, callbackOrigin, state, "high"), undefined, "debug parameters are forbidden in production mode");

const pkce = runtime.createPkcePair();
equal(pkce, { codeVerifier: "s".repeat(43), codeChallenge: "c".repeat(43) }, "PKCE verifier and SHA-256 challenge are paired");

function response({ ok = true, status = 200, contentType = "application/json", body, redirected = false }) {
  return {
    ok,
    status,
    redirected,
    headers: { get(name) { return name === "content-type" ? contentType : null; } },
    async json() {
      if (body instanceof Error) throw body;
      return body;
    },
  };
}

const challengeEvents = [];
const challengeRequests = [];
const challengeResult = await runtime.createChallenge({
  bundleIdentifier: "com.openai.codex",
  callbackUrl: `${callbackOrigin}/browser-session`,
  codeChallenge: "c".repeat(43),
  fetchRequest: async (...args) => {
    challengeRequests.push(args);
    return response({ body: { challenge: "h".repeat(43) } });
  },
  generateDeviceCheckToken: async () => "device-token",
  log: (...args) => challengeEvents.push(args),
  origin: "https://chatgpt.com",
  state,
});
equal(challengeResult, "h".repeat(43), "valid challenge response is returned");
equal(challengeRequests[0][0], "https://chatgpt.com/backend-api/codex/desktop-session/challenges", "challenge uses the canonical endpoint");
equal(JSON.parse(challengeRequests[0][1].body), {
  bundle_id: "com.openai.codex",
  callback_url: `${callbackOrigin}/browser-session`,
  code_challenge: "c".repeat(43),
  device_token: "device-token",
  state,
}, "challenge request preserves security fields");
equal(challengeEvents[0][0], "device_check_token_requested", "device token stage is logged first");
equal(challengeEvents.at(-1), ["challenge_response_parsed", { valid: true }], "challenge schema result is logged");

equal(await runtime.createChallenge({
  bundleIdentifier: "bundle", callbackUrl: "callback", codeChallenge: "challenge",
  fetchRequest: async () => { throw new Error("must not fetch"); },
  generateDeviceCheckToken: async () => null,
  log() {}, origin: "https://chatgpt.com", state,
}), null, "missing device token suppresses challenge request");
equal(await runtime.createChallenge({
  bundleIdentifier: "bundle", callbackUrl: "callback", codeChallenge: "challenge",
  fetchRequest: async () => response({ ok: false, status: 503, body: { detail: "down" } }),
  generateDeviceCheckToken: async () => "token",
  log() {}, origin: "https://chatgpt.com", state,
}), null, "server failure returns no challenge");
equal(await runtime.createChallenge({
  bundleIdentifier: "bundle", callbackUrl: "callback", codeChallenge: "challenge",
  fetchRequest: async () => response({ contentType: "text/html", body: {} }),
  generateDeviceCheckToken: async () => "token",
  log() {}, origin: "https://chatgpt.com", state,
}), null, "unexpected challenge content type is rejected");

const redemptionRequests = [];
const redeemed = await runtime.redeemCode({
  code,
  codeVerifier: "verifier",
  fetchRequest: async (...args) => {
    redemptionRequests.push(args);
    return response({ body: { profile: { avatar_url: "https://img.example/a", email: " user@example.com ", name: " Ada " } } });
  },
  log() {},
  origin: "https://chatgpt.com",
});
equal(redeemed, { avatarUrl: "https://img.example/a", email: "user@example.com", name: "Ada" }, "redemption normalizes server profile");
equal(redemptionRequests[0][0], `https://chatgpt.com/backend-api/codex/desktop-session/codes/${code}/redeem`, "redemption uses code-specific endpoint");
equal(JSON.parse(redemptionRequests[0][1].body), { code_verifier: "verifier" }, "redemption sends only verifier");
equal(await runtime.redeemCode({
  code, codeVerifier: "verifier", fetchRequest: async () => response({ ok: false, status: 401, body: {} }), log() {}, origin: "https://chatgpt.com",
}), null, "failed redemption returns null");
equal(await runtime.redeemCode({
  code, codeVerifier: "verifier", fetchRequest: async () => response({ body: { profile: null } }), log() {}, origin: "https://chatgpt.com",
}), null, "missing redemption profile returns null");

const focusWindow = { destroyed: false, focused: false, isDestroyed() { return this.destroyed; }, isFocused() { return this.focused; } };
let focusCalls = 0;
const focusPoller = runtime.startSourceWindowFocusPolling({
  sourceWindow: focusWindow,
  focusSourceWindow() { focusCalls += 1; },
});
await new Promise((resolve) => setTimeout(resolve, 65));
ok(focusCalls >= 1, "focus polling restores an unfocused source window");
focusWindow.focused = true;
focusPoller.stop(true);
const stoppedFocusCalls = focusCalls;
await new Promise((resolve) => setTimeout(resolve, 65));
equal(focusCalls, stoppedFocusCalls, "stopping focus polling clears the interval");

const sourceWindow = {
  destroyed: false,
  focused: false,
  alwaysOnTop: false,
  transitions: [],
  isDestroyed() { return this.destroyed; },
  isFocused() { return this.focused; },
  isAlwaysOnTop() { return this.alwaysOnTop; },
  setAlwaysOnTop(value) { this.alwaysOnTop = value; this.transitions.push(value); },
};
let focusedSource = 0;
const probeState = { hasOpenedTab: false };
const probe = new runtime.BrowserSessionProbe(
  sourceWindow,
  () => { focusedSource += 1; sourceWindow.focused = true; },
  { bundleIdentifier: "bundle", generateToken: async () => "token", isSupported: () => true },
  probeState,
  async () => { throw new Error("low-security probe must not fetch"); },
);
equal(probe.getLookupEligibility(), {
  arm64: true,
  browserHasVisibleWindow: true,
  browserIsRunning: true,
  deviceCheck: true,
  eligible: true,
  eligibleWithoutDeviceCheck: true,
  macOS: true,
}, "probe eligibility combines platform, browser visibility, and device check");
probe.getLookupEligibility();
equal(addonLoads, 1, "native browser-state addon is lazily cached");

equal(await probe.probe("invalid", "https://evil.example/"), null, "invalid URL skips probe before server creation");
const lowProbePromise = probe.probe("low-1", "https://chatgpt.com/codex/desktop-session", "low");
await new Promise((resolve) => setImmediate(resolve));
equal(createdServers.at(-1).host, "127.0.0.1", "probe callback server binds loopback only");
equal(probeState.hasOpenedTab, true, "opened browser tab is guarded process-wide");
equal(sourceWindow.transitions, [true], "source window is temporarily always-on-top");
equal(openedUrls.at(-1).options, { activate: false }, "browser opens without activation");
const opened = new URL(openedUrls.at(-1).url);
equal(opened.searchParams.get("callback_port"), "4321", "low probe passes callback port");
equal(opened.searchParams.get("state"), "s".repeat(43), "low probe passes generated state");

const responseWrites = [];
const callbackResponse = {
  once(event, callback) { this[event] = callback; },
  writeHead(...args) { responseWrites.push(["head", ...args]); },
  end(...args) { responseWrites.push(["end", ...args]); },
};
createdServers.at(-1).handler({
  method: "GET",
  url: `/browser-session?state=${"s".repeat(43)}&email=user%40example.com&name=Ada`,
}, callbackResponse);
equal(await lowProbePromise, { avatarUrl: null, email: "user@example.com", name: "Ada" }, "low callback resolves the profile");
equal(responseWrites[0][1], 200, "accepted callback receives success response");
equal(probeState.hasOpenedTab, false, "finished probe releases process-wide tab guard");
equal(sourceWindow.transitions, [true, false], "finished probe restores always-on-top state");
ok(focusedSource >= 1, "successful finish restores source-window focus");
equal(probe.cancelProbeById.size, 0, "finished probe removes its cancellation identity");

sourceWindow.focused = false;
const cancelPromise = probe.probe("cancel-1", "https://chatgpt.com/codex/desktop-session", "low");
await new Promise((resolve) => setImmediate(resolve));
probe.cancelProbe("cancel-1");
equal(await cancelPromise, null, "explicit cancellation resolves probe with null");
equal(probeState.hasOpenedTab, false, "cancellation releases tab guard");
equal(probe.cancelProbeById.size, 0, "cancellation identity is removed");

const linuxRuntime = createBrowserSessionProbeRuntime({
  ...baseDependencies,
  platform: "linux",
  architecture: "x64",
});
const linuxProbe = new linuxRuntime.BrowserSessionProbe(
  sourceWindow,
  () => {},
  { isSupported: () => true },
  { hasOpenedTab: false },
);
equal(linuxProbe.getLookupEligibility().eligible, false, "non-macOS platform is ineligible");
equal(await linuxProbe.probe("linux", "https://chatgpt.com/codex/desktop-session", "low"), null, "ineligible probe skips callback server");

ok(assertions >= 55, "browser session probe owner has broad security, network, and lifecycle coverage");
console.log(`${assertions} main browser session probe owner assertions passed`);
