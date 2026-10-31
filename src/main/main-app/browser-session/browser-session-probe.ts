type BrowserSessionProbeDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  schema: any;
  crypto: any;
  http: any;
  electron: any;
  loadBrowserStateAddon(options: { electronAppPath: string; resourcesPath: string | null }): any;
  resolveElectronResourcesPath(options: { env: NodeJS.ProcessEnv; resourcesPath?: string }): string | null;
  allowDebugMenu(channel: string): boolean;
  platform?: NodeJS.Platform;
  architecture?: string;
};

const FOCUS_POLL_INTERVAL_MS = 50;
const PROBE_TIMEOUT_MS = 5_000;
const DESKTOP_SESSION_PATH = "/codex/desktop-session";
const DEFAULT_AUTH_ORIGIN = "https://chatgpt.com";
const CHALLENGE_PATH = "/backend-api/codex/desktop-session/challenges";
const CODE_REDEMPTION_PATH = "/backend-api/codex/desktop-session/codes";
const CALLBACK_HOST = "127.0.0.1";
const CALLBACK_PATH = "/browser-session";
const STANDARD_CALLBACK_PARAMETERS = ["avatar_url", "code", "email", "error", "name", "state"];

/** Owns browser-session lookup admission, callback-server lifecycle, challenge, and redemption. */
export function createBrowserSessionProbeRuntime(dependencies: BrowserSessionProbeDependencies) {
  const debugEnabled = dependencies.allowDebugMenu("prod");
  const callbackParameters = new Set([
    ...STANDARD_CALLBACK_PARAMETERS,
    ...(debugEnabled
      ? ["debug_auth_status", "debug_has_email", "debug_has_session_user"]
      : []),
  ]);
  const challengeSchema = dependencies.schema.wf({
    challenge: dependencies.schema.Of().regex(/^[A-Za-z0-9_-]{43}$/),
  });
  const errorSchema = dependencies.schema.wf({ detail: dependencies.schema.Of() });
  const profileSchema = dependencies.schema.wf({
    profile: dependencies.schema
      .wf({
        avatar_url: dependencies.schema.Of().nullable().optional(),
        email: dependencies.schema.Of(),
        name: dependencies.schema.Of().nullable(),
      })
      .nullable(),
  });
  let browserStateAddon: any;

  function getBrowserStateAddon() {
    if (browserStateAddon !== undefined) return browserStateAddon;
    try {
      browserStateAddon = dependencies.loadBrowserStateAddon({
        electronAppPath: dependencies.electron.app.getAppPath(),
        resourcesPath: dependencies.resolveElectronResourcesPath({
          env: process.env,
          resourcesPath: process.resourcesPath,
        }),
      });
    } catch {
      browserStateAddon = null;
    }
    return browserStateAddon;
  }

  function getDefaultBrowserState() {
    const addon = getBrowserStateAddon();
    if (addon == null) return { browserHasVisibleWindow: false, browserIsRunning: false };
    try {
      return addon.getDefaultWebBrowserState();
    } catch {
      return { browserHasVisibleWindow: false, browserIsRunning: false };
    }
  }

  function startSourceWindowFocusPolling({ focusSourceWindow, sourceWindow }: any) {
    let interval: any = null;
    const stopPolling = () => {
      if (interval != null) {
        clearInterval(interval);
        interval = null;
      }
    };
    const focusIfNeeded = () => {
      try {
        if (sourceWindow.isDestroyed()) {
          stopPolling();
          return;
        }
        if (sourceWindow.isFocused()) return;
        focusSourceWindow();
      } catch {
        stopPolling();
      }
    };
    interval = setInterval(focusIfNeeded, FOCUS_POLL_INTERVAL_MS);
    interval.unref();
    return {
      stop(shouldFocus: boolean) {
        if (shouldFocus) focusIfNeeded();
        stopPolling();
      },
    };
  }

  function logDebug(stage: string, details: Record<string, unknown> = {}, callback?: any) {
    if (!debugEnabled) return;
    const event = { source: "electron", stage, details };
    console.log(`[browser-session] ${JSON.stringify(event)}`);
    try {
      callback?.(event)?.[Symbol.dispose]();
    } catch {
      // Debug reporting must not affect the probe lifecycle.
    }
  }

  function getSingleSearchParameter(url: URL, name: string) {
    const values = url.searchParams.getAll(name);
    return values.length === 1 ? (values[0] ?? null) : null;
  }

  function getBooleanSearchParameter(url: URL, name: string) {
    const value = getSingleSearchParameter(url, name);
    return value === "true" || (value !== "false" && null);
  }

  function normalizeAvatarUrl(value: string | null | undefined) {
    if (value == null || value.length > 4096) return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.toString() : null;
    } catch {
      return null;
    }
  }

  function parseDebugBrowserSession(url: URL) {
    if (!debugEnabled) return undefined;
    const authStatus = getSingleSearchParameter(url, "debug_auth_status");
    const hasEmail = getBooleanSearchParameter(url, "debug_has_email");
    const hasSessionUser = getBooleanSearchParameter(url, "debug_has_session_user");
    return authStatus != null && hasEmail != null && hasSessionUser != null
      ? { authStatus, hasEmail, hasSessionUser }
      : undefined;
  }

  function parseCallbackRequest(
    requestUrl: string,
    callbackOrigin: string,
    state: string,
    securityLevel: "high" | "low",
  ) {
    let url: URL;
    try {
      url = new URL(requestUrl, callbackOrigin);
    } catch {
      return undefined;
    }
    if (
      url.origin !== callbackOrigin ||
      url.pathname !== CALLBACK_PATH ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== "" ||
      getSingleSearchParameter(url, "state") !== state ||
      [...url.searchParams.keys()].some((key) => !callbackParameters.has(key))
    ) return undefined;

    const error = getSingleSearchParameter(url, "error");
    const browserSession = parseDebugBrowserSession(url);
    if (securityLevel === "low") {
      const email = getSingleSearchParameter(url, "email");
      const name = getSingleSearchParameter(url, "name");
      const avatarUrl = getSingleSearchParameter(url, "avatar_url");
      if (
        (error === "browser_authentication_required" ||
          error === "browser_profile_missing_email" ||
          error === "browser_session_lookup_disabled") &&
        email == null &&
        name == null &&
        avatarUrl == null
      ) return { error };
      const normalizedEmail = email?.trim() ?? "";
      if (error != null || normalizedEmail.length === 0 || normalizedEmail.length > 320)
        return undefined;
      const profile = {
        avatarUrl: normalizeAvatarUrl(avatarUrl),
        email: normalizedEmail,
        name: name?.trim().slice(0, 256) || null,
      };
      return browserSession == null ? { profile } : { profile, browserSession };
    }

    const code = getSingleSearchParameter(url, "code");
    if (error === "browser_authentication_required" && code == null) return { error };
    if (error == null && code != null && /^[A-Za-z0-9_-]{43}$/.test(code))
      return browserSession == null ? { code } : { code, browserSession };
    return undefined;
  }

  function getAuthOrigin() {
    if (process.env.NODE_ENV !== "development") return DEFAULT_AUTH_ORIGIN;
    const configured = process.env.VITE_CODEX_DESKTOP_AUTH_ORIGIN?.trim();
    if (!configured) return DEFAULT_AUTH_ORIGIN;
    try {
      const url = new URL(configured);
      if (
        url.origin === configured.replace(/\/$/, "") &&
        (url.protocol === "https:" ||
          (url.protocol === "http:" &&
            (url.hostname === "localhost" || url.hostname === "127.0.0.1")))
      ) return url.origin;
    } catch {
      // Invalid development overrides fall back to the production origin.
    }
    return DEFAULT_AUTH_ORIGIN;
  }

  function parseProbeUrl(value: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    return url.origin !== getAuthOrigin() ||
      url.pathname !== DESKTOP_SESSION_PATH ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== "" ||
      url.search !== ""
      ? null
      : url;
  }

  function createPkcePair() {
    const codeVerifier = dependencies.crypto.randomBytes(32).toString("base64url");
    return {
      codeVerifier,
      codeChallenge: dependencies.crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url"),
    };
  }

  async function createChallenge({
    bundleIdentifier,
    callbackUrl,
    codeChallenge,
    fetchRequest,
    generateDeviceCheckToken,
    log,
    origin,
    state,
  }: any) {
    log("device_check_token_requested");
    let deviceToken;
    try {
      deviceToken = await generateDeviceCheckToken();
    } catch {
      log("device_check_token_failed");
      return null;
    }
    log("device_check_token_completed", { tokenGenerated: deviceToken != null });
    if (deviceToken == null) return null;
    let response;
    try {
      response = await fetchRequest(new URL(CHALLENGE_PATH, origin).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundle_id: bundleIdentifier,
          callback_url: callbackUrl,
          code_challenge: codeChallenge,
          device_token: deviceToken,
          state,
        }),
      });
    } catch {
      log("challenge_request_failed");
      return null;
    }
    let message = null;
    if (!response.ok) {
      const parsed = errorSchema.safeParse(await response.json().catch(() => null));
      message = parsed.success ? parsed.data.detail : null;
    }
    log("challenge_response_received", { message, ok: response.ok, status: response.status });
    if (response.status >= 500) {
      log("challenge_internal_server_error", { message, status: response.status });
      return null;
    }
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type");
    if (!contentType?.toLowerCase().startsWith("application/json")) {
      log("challenge_response_unexpected_content_type", {
        contentType,
        redirected: response.redirected,
      });
      return null;
    }
    let body;
    try {
      body = await response.json();
    } catch {
      log("challenge_response_invalid_json", { contentType });
      return null;
    }
    const parsed = challengeSchema.safeParse(body);
    log("challenge_response_parsed", { valid: parsed.success });
    return parsed.success ? parsed.data.challenge : null;
  }

  async function redeemCode({ code, codeVerifier, fetchRequest, log, origin }: any) {
    log("redemption_requested");
    const response = await fetchRequest(
      new URL(`${CODE_REDEMPTION_PATH}/${code}/redeem`, origin).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code_verifier: codeVerifier }),
      },
    );
    log("redemption_response_received", { ok: response.ok, status: response.status });
    if (!response.ok) return null;
    const parsed = profileSchema.safeParse(await response.json());
    log("redemption_response_parsed", {
      profilePresent: parsed.success && parsed.data.profile != null,
      valid: parsed.success,
    });
    if (!parsed.success || parsed.data.profile == null) return null;
    const profile = parsed.data.profile;
    const email = profile.email.trim();
    return email.length === 0 || email.length > 320
      ? null
      : {
          avatarUrl: normalizeAvatarUrl(profile.avatar_url),
          email,
          name: profile.name?.trim().slice(0, 256) || null,
        };
  }

  class BrowserSessionProbe extends dependencies.RpcHandlerBase {
    sourceWindow: any;
    focusSourceWindow: () => void;
    deviceCheck: any;
    probeState: { hasOpenedTab: boolean };
    fetchRequest: any;
    cancelProbeById = new Map<string, () => void>();

    constructor(
      sourceWindow: any,
      focusSourceWindow: () => void,
      deviceCheck: any,
      probeState: { hasOpenedTab: boolean },
      fetchRequest = (url: string, options: any) => dependencies.electron.net.fetch(url, options),
    ) {
      super();
      this.sourceWindow = sourceWindow;
      this.focusSourceWindow = focusSourceWindow;
      this.deviceCheck = deviceCheck;
      this.probeState = probeState;
      this.fetchRequest = fetchRequest;
    }

    getLookupEligibility() {
      const macOS = (dependencies.platform ?? process.platform) === "darwin";
      const arm64 = (dependencies.architecture ?? process.arch) === "arm64";
      const deviceCheck = this.deviceCheck.isSupported();
      const { browserHasVisibleWindow, browserIsRunning } = macOS
        ? getDefaultBrowserState()
        : { browserHasVisibleWindow: false, browserIsRunning: false };
      const eligibleWithoutDeviceCheck = macOS && arm64 && browserIsRunning && browserHasVisibleWindow;
      const result = {
        arm64,
        browserHasVisibleWindow,
        browserIsRunning,
        deviceCheck,
        eligible: eligibleWithoutDeviceCheck && deviceCheck,
        eligibleWithoutDeviceCheck,
        macOS,
      };
      logDebug("lookup_eligibility", result);
      return result;
    }

    cancelProbe(id: string) {
      logDebug("probe_cancel_requested", { hasPendingProbe: this.cancelProbeById.has(id) });
      this.cancelProbeById.get(id)?.();
    }

    [Symbol.dispose]() {
      for (const cancel of this.cancelProbeById.values()) cancel();
    }

    async probe(id: string, rawUrl: string, securityLevel: "high" | "low" = "high", debug?: any) {
      const log = (stage: string, details: Record<string, unknown> = {}) =>
        logDebug(stage, details, debug);
      log("probe_requested", { securityLevel });
      const probeUrl = parseProbeUrl(rawUrl);
      if (probeUrl == null) {
        log("probe_skipped", { reason: "invalid_session_probe_url" });
        return null;
      }
      const eligibility = this.getLookupEligibility();
      if (securityLevel === "high" ? !eligibility.eligible : !eligibility.eligibleWithoutDeviceCheck) {
        log("probe_skipped", { reason: "ineligible" });
        return null;
      }
      if (this.probeState.hasOpenedTab) {
        log("probe_skipped", { reason: "probe_tab_already_opened_in_process" });
        return null;
      }
      const state = securityLevel === "low"
        ? dependencies.crypto.randomBytes(32).toString("base64url")
        : dependencies.crypto.randomUUID();
      const { codeChallenge, codeVerifier } = createPkcePair();
      this.cancelProbe(id);

      return new Promise((resolve) => {
        let callbackOrigin: string | null = null;
        let callbackAccepted = false;
        let finished = false;
        let focusPoller: any = null;
        let openedTab = false;
        let restoreAlwaysOnTop: (() => void) | null = null;
        let timeout: any = null;
        const server = dependencies.http.createServer((request: any, response: any) => {
          const callback = callbackAccepted || callbackOrigin == null || request.method !== "GET" || request.url == null
            ? undefined
            : parseCallbackRequest(request.url, callbackOrigin, state, securityLevel);
          if (callback === undefined) {
            log("callback_rejected", {
              callbackOriginReady: callbackOrigin != null,
              hasRequestUrl: request.url != null,
              method: request.method ?? null,
            });
            response.writeHead(400, { "Cache-Control": "no-store", Connection: "close" });
            response.end();
            return;
          }
          callbackAccepted = true;
          response.once("close", () => server.closeAllConnections());
          server.close();
          log("callback_accepted");
          if ("error" in callback) {
            if (callback.error === "browser_session_lookup_disabled")
              log("browser_session_lookup_disabled", { reason: callback.error });
            else
              log(
                securityLevel === "low" ? "browser_session_lookup_failed" : "challenge_completion_failed",
                { reason: callback.error },
              );
            response.writeHead(200, {
              "Cache-Control": "no-store",
              Connection: "close",
              "Content-Type": "text/html; charset=utf-8",
            });
            response.end("<!doctype html><script>window.close()<\/script>");
            finish(null);
            return;
          }
          if (callback.browserSession != null)
            log("browser_session_observed", callback.browserSession);
          response.writeHead(200, {
            "Cache-Control": "no-store",
            Connection: "close",
            "Content-Type": "text/html; charset=utf-8",
          });
          response.end("<!doctype html><script>window.close()<\/script>");
          if ("profile" in callback) {
            finish(callback.profile);
            return;
          }
          redeemCode({
            code: callback.code,
            codeVerifier,
            fetchRequest: this.fetchRequest,
            log,
            origin: probeUrl.origin,
          })
            .then((profile) => {
              log("redemption_completed", { profileFound: profile != null });
              finish(profile);
            })
            .catch(() => {
              log("redemption_failed");
              finish(null);
            });
        });
        const cancel = () => {
          log("probe_cancelled");
          finish(null, false);
        };
        const finish = (profile: any, shouldFocusSourceWindow = true) => {
          if (finished) return;
          finished = true;
          if (this.cancelProbeById.get(id) === cancel) this.cancelProbeById.delete(id);
          if (timeout != null) clearTimeout(timeout);
          if (server.listening) server.close();
          if (!callbackAccepted) server.closeAllConnections();
          focusPoller?.stop(shouldFocusSourceWindow);
          focusPoller = null;
          restoreAlwaysOnTop?.();
          restoreAlwaysOnTop = null;
          if (openedTab) this.probeState.hasOpenedTab = false;
          log("probe_finished", {
            profileFound: profile != null,
            shouldFocusSourceWindow,
          });
          resolve(profile);
        };

        this.cancelProbeById.set(id, cancel);
        timeout = setTimeout(() => {
          log("probe_timed_out");
          finish(null);
        }, PROBE_TIMEOUT_MS);
        timeout.unref();
        server.on("error", () => {
          log("callback_server_failed");
          finish(null);
        });
        server.listen(0, CALLBACK_HOST, () => {
          if (finished) {
            log("callback_server_closed_before_ready");
            server.close();
            return;
          }
          const address = server.address();
          if (address == null || typeof address === "string") {
            log("callback_server_address_failed");
            finish(null);
            return;
          }
          log("callback_server_ready");
          callbackOrigin = `http://${CALLBACK_HOST}:${address.port}`;
          server.unref();

          const openBrowser = async () => {
            if (this.probeState.hasOpenedTab) {
              log("probe_skipped", { reason: "probe_tab_opened_while_starting_browser" });
              finish(null);
              return;
            }
            this.probeState.hasOpenedTab = true;
            openedTab = true;
            const sourceWindow = this.sourceWindow;
            if (!sourceWindow.isDestroyed() && !sourceWindow.isAlwaysOnTop()) {
              sourceWindow.setAlwaysOnTop(true);
              restoreAlwaysOnTop = () => {
                if (!sourceWindow.isDestroyed()) sourceWindow.setAlwaysOnTop(false);
              };
            }
            if (!sourceWindow.isDestroyed()) {
              focusPoller = startSourceWindowFocusPolling({
                focusSourceWindow: this.focusSourceWindow,
                sourceWindow,
              });
            }
            try {
              log("browser_open_requested");
              await dependencies.electron.shell.openExternal(probeUrl.toString(), { activate: false });
              log("browser_open_completed");
            } catch {
              log("browser_open_failed");
              finish(null);
            }
          };

          if (securityLevel === "low") {
            probeUrl.searchParams.set("callback_port", String(address.port));
            probeUrl.searchParams.set("state", state);
            void openBrowser();
            return;
          }
          log("challenge_requested");
          createChallenge({
            bundleIdentifier: this.deviceCheck.bundleIdentifier,
            callbackUrl: `${callbackOrigin}${CALLBACK_PATH}`,
            codeChallenge,
            fetchRequest: this.fetchRequest,
            generateDeviceCheckToken: this.deviceCheck.generateToken,
            log,
            origin: probeUrl.origin,
            state,
          })
            .then(async (challenge) => {
              log("challenge_completed", { challengeCreated: challenge != null });
              if (challenge == null || finished) {
                finish(null);
                return;
              }
              probeUrl.searchParams.set("challenge", challenge);
              await openBrowser();
            })
            .catch(() => {
              log("challenge_failed");
              finish(null);
            });
        });
      });
    }
  }

  return {
    BrowserSessionProbe,
    createChallenge,
    createPkcePair,
    getAuthOrigin,
    normalizeAvatarUrl,
    parseCallbackRequest,
    parseProbeUrl,
    redeemCode,
    startSourceWindowFocusPolling,
  };
}
