type RemoteControlStepUpDependencies = {
  schema: any;
  http: any;
  crypto: any;
  env: NodeJS.ProcessEnv;
  fetchToken(input: string, init: any): Promise<any>;
  openExternalUrl(url: string): Promise<boolean | void>;
  setTimer(callback: () => void, timeoutMs: number): any;
  clearTimer(handle: any): void;
};

/** Owns remote-control enrollment OAuth PKCE and loopback callback lifecycle. */
export function createRemoteControlStepUpRuntime(dependencies: RemoteControlStepUpDependencies) {
  const clientId = "app_EMoamEEZ73f0CkXaXp7hrann";
  const defaultIssuer = "https://auth.openai.com";
  const issuerEnvironmentKey = "CODEX_APP_SERVER_LOGIN_ISSUER";
  const callbackPorts = [1455, 1457];
  const callbackPath = "/auth/callback";
  const defaultTimeoutMs = 600000;
  const enrollmentScope = "codex.remote_control.enroll";
  const reauthenticationMode = "remote_control";
  const returnUrl = "codex://settings/connections";
  const accessTokenSchema = dependencies.schema.wf({
    access_token: dependencies.schema.Of().min(1),
  }).loose();

  function normalizeIssuer(issuer: string) {
    return issuer.replace(/\/+$/, "");
  }

  function resolveIssuer() {
    return dependencies.env[issuerEnvironmentKey]?.trim() || defaultIssuer;
  }

  function randomBase64Url(byteLength: number) {
    return dependencies.crypto.randomBytes(byteLength).toString("base64url");
  }

  function createPkce() {
    const codeVerifier = randomBase64Url(32);
    return {
      codeVerifier,
      codeChallenge: dependencies.crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url"),
    };
  }

  function buildAuthorizationUrl({
    issuer,
    clientId: authorizationClientId,
    redirectUri,
    codeChallenge,
    state,
    originator,
    accountId,
  }: any) {
    const url = new URL("/oauth/authorize", normalizeIssuer(issuer));
    const search = new URLSearchParams({
      response_type: "code",
      client_id: authorizationClientId,
      redirect_uri: redirectUri,
      scope: enrollmentScope,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      originator,
      reauth: reauthenticationMode,
      max_age: "0",
      codex_cli_simplified_flow: "true",
    });
    if (accountId != null) {
      search.set("allowed_workspace_id", accountId);
      search.set("current_workspace_id", accountId);
    }
    url.search = search.toString();
    return url.toString();
  }

  async function exchangeAuthorizationCode({
    code,
    codeVerifier,
    clientId: tokenClientId,
    issuer,
    redirectUri,
    fetchToken,
  }: any) {
    const response = await fetchToken(new URL("/oauth/token", normalizeIssuer(issuer)).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: tokenClientId,
        code_verifier: codeVerifier,
      }).toString(),
    });
    if (!response.ok)
      throw Error(`Remote control step-up token exchange failed with status ${response.status}.`);
    return accessTokenSchema.parse(await response.json());
  }

  function writeTextResponse(response: any, status: number, text: string) {
    response.writeHead(status, {
      "Content-Type": "text/plain; charset=utf-8",
      Connection: "close",
    });
    response.end(text);
  }

  function successPageHtml() {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light dark">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Remote control authorized · ChatGPT</title>
    <style>
      :root {
        --background: #ffffff;
        --surface: #ffffff;
        --text-primary: #0d0d0d;
        --text-secondary: rgb(0 0 0 / 60%);
        --text-tertiary: rgb(0 0 0 / 29%);
        --border: rgb(0 0 0 / 5%);
        --button: #0d0d0d;
        --button-hover: #2f2f2f;
        --button-text: #ffffff;
        --card-shadow: 0 10px 15px -3px rgb(0 0 0 / 8%), 0 4px 6px -4px rgb(0 0 0 / 8%);
      }
      * { box-sizing: border-box; }
      body {
        align-items: center;
        background: var(--background);
        color: var(--text-primary);
        display: flex;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        justify-content: center;
        margin: 0;
        min-height: 100vh;
        padding: 24px;
      }
      .success-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: var(--card-shadow);
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 576px;
        padding: 32px;
        text-align: center;
        width: 100%;
      }
      .codex-icon { color: var(--text-primary); height: 64px; margin: 0 auto; width: 64px; }
      .copy { display: flex; flex-direction: column; gap: 12px; }
      h1 { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; line-height: 36px; margin: 0; }
      p { color: var(--text-secondary); font-size: 16px; line-height: 24px; margin: 0; }
      .actions { align-items: center; display: flex; flex-direction: column; gap: 12px; }
      .return-link {
        align-items: center;
        background: var(--button);
        border: 1px solid transparent;
        border-radius: 9999px;
        color: var(--button-text);
        display: inline-flex;
        font-size: 14px;
        font-weight: 500;
        justify-content: center;
        min-height: 44px;
        padding: 0 22px;
        text-decoration: none;
      }
      .return-link:hover { background: var(--button-hover); }
      .return-link:focus-visible { outline: 1.5px solid var(--text-primary); outline-offset: 2.5px; }
      .close-hint { color: var(--text-tertiary); font-size: 13px; line-height: 18px; }
      @media (prefers-color-scheme: dark) {
        :root {
          --background: #212121;
          --surface: #2f2f2f;
          --text-primary: #f2f2f2;
          --text-secondary: rgb(255 255 255 / 70%);
          --text-tertiary: rgb(255 255 255 / 58%);
          --border: rgb(255 255 255 / 5%);
          --button: #f9f9f9;
          --button-hover: #ececec;
          --button-text: #0d0d0d;
          --card-shadow: 0 10px 15px -3px rgb(0 0 0 / 24%), 0 4px 6px -4px rgb(0 0 0 / 24%);
        }
      }
      @media (max-width: 520px) {
        .success-card { padding: 24px; }
        h1 { font-size: 26px; line-height: 32px; }
      }
    </style>
  </head>
  <body>
    <main class="success-card">
      <svg class="codex-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13.333 11.418C13.7002 11.418 13.9978 11.7159 13.998 12.083C13.998 12.4503 13.7003 12.748 13.333 12.748H10.833C10.4657 12.748 10.168 12.4503 10.168 12.083C10.1682 11.7159 10.4659 11.418 10.833 11.418H13.333Z" fill="currentColor" />
        <path d="M6.74121 7.34668C7.0561 7.15796 7.46442 7.26036 7.65332 7.5752L8.90332 9.6582C9.02949 9.86874 9.02961 10.1323 8.90332 10.3428L7.65332 12.4258C7.46441 12.7403 7.05597 12.8427 6.74121 12.6543C6.42637 12.4654 6.32396 12.0561 6.5127 11.7412L7.55664 10L6.5127 8.25879C6.324 7.94395 6.4265 7.53562 6.74121 7.34668Z" fill="currentColor" />
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.00195 1.75C10.1157 1.75021 11.1362 2.15467 11.9238 2.82227C12.1849 2.77516 12.455 2.74903 12.7295 2.74902C15.2262 2.74978 17.2507 4.77449 17.251 7.27148C17.2509 7.54581 17.2238 7.81473 17.1768 8.0752C17.8448 8.86317 18.2499 9.88479 18.25 10.999C18.2496 12.9609 16.9996 14.6284 15.2549 15.2549C14.6285 16.9998 12.9608 18.2497 10.999 18.25C9.88486 18.25 8.86411 17.8448 8.07617 17.1768C7.8155 17.2239 7.54592 17.2509 7.27148 17.251C4.77445 17.2507 2.7504 15.2257 2.75 12.7285C2.75003 12.4539 2.77608 12.1848 2.82324 11.9238C2.20237 11.1913 1.80895 10.2574 1.75684 9.23438L1.75 9.00098C1.75022 7.03932 2.99952 5.36992 4.74414 4.74316C5.37104 2.99851 7.04034 1.75002 9.00195 1.75ZM9.00195 3.07812C7.52474 3.07814 6.27967 4.08156 5.91504 5.44531C5.85362 5.67419 5.67418 5.85363 5.44531 5.91504C4.08208 6.27984 3.07836 7.52408 3.07812 9.00098C3.07826 9.88321 3.43594 10.682 4.01465 11.2607C4.1816 11.4283 4.24663 11.6728 4.18555 11.9014C4.11505 12.1653 4.07719 12.4429 4.07715 12.7285C4.07755 14.4925 5.50753 15.9225 7.27148 15.9229C7.55712 15.9228 7.83548 15.886 8.09961 15.8154L8.18652 15.7979C8.38833 15.7722 8.59297 15.8403 8.73926 15.9863C9.31801 16.5649 10.1168 16.9218 10.999 16.9219C12.4759 16.9216 13.7203 15.9183 14.085 14.5547L14.1133 14.4707C14.1918 14.2821 14.3542 14.1386 14.5547 14.085C15.9181 13.7203 16.9225 12.4758 16.9229 10.999C16.9228 10.1168 16.5648 9.31802 15.9863 8.73926C15.819 8.57175 15.7544 8.3274 15.8154 8.09863C15.886 7.83454 15.9238 7.5568 15.9238 7.27148C15.9235 5.50751 14.4924 4.07762 12.7285 4.07715C12.4424 4.0772 12.164 4.11412 11.9004 4.18457C11.672 4.24541 11.4282 4.18048 11.2607 4.01367C10.7183 3.47141 9.98306 3.12271 9.16699 3.08105L9.00195 3.07812Z" fill="currentColor" />
      </svg>
      <div class="copy">
        <h1>Remote control authorized</h1>
        <p>You can return to ChatGPT to finish connecting this device.</p>
      </div>
      <div class="actions">
        <a class="return-link" href="${returnUrl}">Return to ChatGPT</a>
        <p class="close-hint">This tab is safe to close.</p>
      </div>
    </main>
    <script>window.location.href = ${JSON.stringify(returnUrl)};<\/script>
  </body>
</html>`;
  }

  function writeSuccessResponse(response: any) {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      Connection: "close",
    });
    response.end(successPageHtml());
  }

  async function createCallbackServer({ state, timeoutMs }: any) {
    let server: any = null;
    let selectedPort: number | null = null;
    let timeout: any = null;
    let resolveAuthorizationCode: ((code: string) => void) | null = null;
    let rejectAuthorizationCode: ((error: unknown) => void) | null = null;
    let settled = false;
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      if (timeout != null) {
        dependencies.clearTimer(timeout);
        timeout = null;
      }
      callback();
    };
    const authorizationCode = new Promise<string>((resolve, reject) => {
      resolveAuthorizationCode = resolve;
      rejectAuthorizationCode = reject;
    });
    for (const port of callbackPorts) {
      const candidate = dependencies.http.createServer((request: any, response: any) => {
        try {
          if (request.url == null) {
            writeTextResponse(response, 400, "Bad Request");
            return;
          }
          const callbackUrl = new URL(request.url, `http://localhost:${port}`);
          if (callbackUrl.pathname !== callbackPath) {
            writeTextResponse(response, 404, "Not Found");
            return;
          }
          if (callbackUrl.searchParams.get("state") !== state) {
            writeTextResponse(response, 400, "State mismatch");
            return;
          }
          const oauthError = callbackUrl.searchParams.get("error");
          if (oauthError != null) {
            const description = callbackUrl.searchParams.get("error_description");
            writeTextResponse(response, 400, "Remote control login failed");
            settle(() => rejectAuthorizationCode?.(Error(
              description == null || description.length === 0
                ? oauthError
                : `${oauthError}: ${description}`,
            )));
            return;
          }
          const code = callbackUrl.searchParams.get("code");
          if (code == null || code.length === 0) {
            writeTextResponse(response, 400, "Missing authorization code");
            return;
          }
          writeSuccessResponse(response);
          settle(() => resolveAuthorizationCode?.(code));
        } catch (error) {
          writeTextResponse(response, 400, "Bad Request");
          settle(() => rejectAuthorizationCode?.(error));
        }
      });
      try {
        await new Promise<void>((resolve, reject) => {
          candidate.once("error", reject);
          candidate.listen(port, "localhost", resolve);
        });
        server = candidate;
        selectedPort = port;
        break;
      } catch (error) {
        candidate.close();
        if (!(error instanceof Error) || !("code" in error) || error.code !== "EADDRINUSE")
          throw error;
      }
    }
    if (server == null || selectedPort == null)
      throw Error("Remote control login callback ports 1455 and 1457 are already in use.");
    timeout = dependencies.setTimer(() => {
      settle(() => rejectAuthorizationCode?.(Error(
        "Timed out waiting for remote control step-up login.",
      )));
    }, timeoutMs);
    return {
      redirectUri: `http://localhost:${selectedPort}${callbackPath}`,
      authorizationCode,
      close: () => {
        server?.close();
        settle(() => rejectAuthorizationCode?.(Error(
          "Remote control step-up login was cancelled.",
        )));
      },
    };
  }

  async function requestRemoteControlEnrollmentStepUpToken({
    accountId,
    desktopApiOptions,
    fetchToken = dependencies.fetchToken,
    openExternalUrl = dependencies.openExternalUrl,
    timeoutMs = defaultTimeoutMs,
  }: any) {
    const issuer = resolveIssuer();
    const pkce = createPkce();
    const state = randomBase64Url(32);
    const callback = await createCallbackServer({ state, timeoutMs });
    callback.authorizationCode.catch(() => {});
    try {
      const opened = await openExternalUrl(buildAuthorizationUrl({
        issuer,
        clientId,
        redirectUri: callback.redirectUri,
        codeChallenge: pkce.codeChallenge,
        state,
        originator: desktopApiOptions.desktopOriginator,
        accountId,
      }));
      if (opened === false)
        throw Error("Failed to open remote control login in the default browser.");
      const token = await exchangeAuthorizationCode({
        code: await callback.authorizationCode,
        codeVerifier: pkce.codeVerifier,
        clientId,
        issuer,
        redirectUri: callback.redirectUri,
        fetchToken,
      });
      return token.access_token;
    } finally {
      callback.close();
    }
  }

  return {
    buildAuthorizationUrl,
    createCallbackServer,
    createPkce,
    exchangeAuthorizationCode,
    normalizeIssuer,
    randomBase64Url,
    requestRemoteControlEnrollmentStepUpToken,
    resolveIssuer,
    successPageHtml,
    writeSuccessResponse,
    writeTextResponse,
  };
}
