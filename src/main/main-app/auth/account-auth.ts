import { Ac as createDeferred, jc as isCloudRequirementsAuthError } from "@chunk/shared";

type UnknownRecord = Record<string, unknown>;
type RequestClient = {
  hostId: string;
  sendRequest(method: string, params: UnknownRecord): Promise<UnknownRecord>;
  addRequestLifecycleListener(listener: (event: UnknownRecord) => void): () => void;
};
type Logger = { info(message: string, data?: unknown): void; debug(message: string, data?: unknown): void; warning(message: string, data?: unknown): void };
type AuthStatusCallback = (status: { authMethod: unknown }) => void;
type McpLoginCallback = (result: { name: string; success: boolean; error?: unknown }) => void;
type LoginCompletion = { loginId: string; success: boolean; error?: unknown; onboardingEntrypoint?: unknown };
type ActiveLogin = { loginId: string; finished: boolean; complete(result: LoginCompletion): void };
type SandboxSetup = { mode: string; finished: boolean; cancelTimeout: (() => void) | null; complete(result: UnknownRecord): void; fail(error: Error): void };

const SANDBOX_TIMEOUT_MS = 1_200_000;
const SANDBOX_RETRY_DELAY_MS = 300_000;

export class AccountAuthService {
  private activeLogin?: ActiveLogin;
  private activeWindowsSandboxSetup?: SandboxSetup;
  private timedOutWindowsSandboxSetup?: Record<string, number>;
  private authStatusCallbacks: AuthStatusCallback[] = [];
  private mcpLoginCallbacks: McpLoginCallback[] = [];
  private readonly removeRequestLifecycleListener: () => void;

  constructor(
    private readonly requestClient: RequestClient,
    private readonly remoteLoginPortForward: { startRemoteChatGptLoginPortForward(hostId: string, loginId: string): Promise<void>; stopRemoteChatGptLoginPortForward(hostId: string, loginId: string): Promise<void>; createAbortController?(): AbortController },
    private readonly logger: Logger,
    private readonly shouldForwardRemoteChatGptLogin: boolean,
    private readonly schedule: (callback: () => void, delay: number) => (() => void),
  ) {
    this.removeRequestLifecycleListener = this.requestClient.addRequestLifecycleListener((event) => {
      if (event.type === `failed` && isCloudRequirementsAuthError(event.error)) {
        this.logger.warning(`cloud_requirements_auth_error`, { safe: { hostId: event.hostId }, sensitive: { error: event.error } });
        this.logoutWithoutServer();
      }
    });
  }
  dispose() { this.removeRequestLifecycleListener(); this.activeWindowsSandboxSetup?.fail(Error(`App server manager was disposed`)); }
  addAuthStatusCallback(callback: AuthStatusCallback) { this.authStatusCallbacks.push(callback); }
  removeAuthStatusCallback(callback: AuthStatusCallback) { this.authStatusCallbacks = this.authStatusCallbacks.filter((entry) => entry !== callback); }
  addMcpLoginCallback(callback: McpLoginCallback) { this.mcpLoginCallbacks.push(callback); return () => { this.mcpLoginCallbacks = this.mcpLoginCallbacks.filter((entry) => entry !== callback); }; }
  private cancelLogin(loginId: string) { this.requestClient.sendRequest(`account/login/cancel`, { loginId }).catch((error) => this.logger.warning(`account_login_cancel_failed`, { safe: { hostId: this.requestClient.hostId, loginId }, sensitive: { error } })); }
  async loginWithApiKey(apiKey: string) { const response = await this.requestClient.sendRequest(`account/login/start`, { type: `apiKey`, apiKey }); if (response.type !== `apiKey`) throw Error(`Unexpected response type for account/login/start`); }

  async loginWithChatGPT(controller: AbortController, options: { appBrand?: string; useHostedLoginSuccessPage?: boolean; useStreamlinedLogin?: boolean } = {}) {
    if (this.activeLogin && !this.activeLogin.finished) throw Error(`A ChatGPT login is already in progress`);
    const response = await this.requestClient.sendRequest(`account/login/start`, { type: `chatgpt`, ...(options.useStreamlinedLogin ? { codexStreamlinedLogin: true } : {}), ...(options.useHostedLoginSuccessPage ? { appBrand: options.appBrand, useHostedLoginSuccessPage: true } : {}) });
    if (response.type !== `chatgpt`) throw Error(`Unexpected response type for account/login/start`);
    const loginId = String(response.loginId ?? ``); const authUrl = response.authUrl; if (typeof authUrl !== `string` || authUrl.length === 0) throw Error(`Missing authUrl in account/login/start response`);
    const stopForward = this.shouldForwardRemoteChatGptLogin ? async () => this.remoteLoginPortForward.stopRemoteChatGptLoginPortForward(this.requestClient.hostId, loginId) : undefined;
    if (stopForward) { try { await this.remoteLoginPortForward.startRemoteChatGptLoginPortForward(this.requestClient.hostId, loginId); } catch (error) { this.cancelLogin(loginId); throw error; } }
    if (controller.signal.aborted) { this.cancelLogin(loginId); await stopForward?.(); throw this.abortError(); }
    const deferred = createDeferred<{ success: boolean; error?: unknown; onboardingEntrypoint?: unknown }>(); let cleanup = () => undefined;
    const active: ActiveLogin = { loginId, finished: false, complete: (result) => { if (result.loginId !== loginId || active.finished) return; active.finished = true; cleanup(); stopForward?.().catch((error) => this.logger.warning(`failed to stop remote chatgpt login port forward`, { sensitive: { error } })); deferred.resolve({ success: result.success, error: result.error, onboardingEntrypoint: result.onboardingEntrypoint }); } };
    this.activeLogin = active; const abort = () => { if (active.finished) return; active.finished = true; cleanup(); stopForward?.().catch(() => undefined); this.cancelLogin(loginId); deferred.reject(this.abortError()); };
    controller.signal.addEventListener(`abort`, abort, { once: true }); cleanup = () => { controller.signal.removeEventListener(`abort`, abort); if (this.activeLogin?.loginId === loginId) this.activeLogin = undefined; };
    return { loginId, authUrl, completion: deferred.promise };
  }

  async loginWithChatGPTDeviceCode(controller: AbortController) {
    if (this.activeLogin && !this.activeLogin.finished) throw Error(`A ChatGPT login is already in progress`);
    const response = await this.requestClient.sendRequest(`account/login/start`, { type: `chatgptDeviceCode` }); if (response.type !== `chatgptDeviceCode`) throw Error(`Unexpected response type for account/login/start`);
    const loginId = String(response.loginId ?? ``); const verificationUrl = response.verificationUrl; const userCode = response.userCode; if (typeof verificationUrl !== `string` || !verificationUrl || typeof userCode !== `string` || !userCode) throw Error(`Missing verificationUrl or userCode in account/login/start response`);
    const deferred = createDeferred<{ success: boolean; error?: unknown }>(); let cleanup = () => undefined; const active: ActiveLogin = { loginId, finished: false, complete: (result) => { if (result.loginId !== loginId || active.finished) return; active.finished = true; cleanup(); deferred.resolve({ success: result.success, error: result.error }); } }; this.activeLogin = active;
    const abort = () => { if (active.finished) return; active.finished = true; cleanup(); this.cancelLogin(loginId); deferred.reject(this.abortError()); }; controller.signal.addEventListener(`abort`, abort, { once: true }); cleanup = () => { controller.signal.removeEventListener(`abort`, abort); if (this.activeLogin?.loginId === loginId) this.activeLogin = undefined; };
    return { loginId, verificationUrl, userCode, completion: deferred.promise };
  }

  async startWindowsSandboxSetup(mode: string, cwd: unknown) {
    this.clearExpiredWindowsSandboxTimeouts(); if (this.activeWindowsSandboxSetup && !this.activeWindowsSandboxSetup.finished) throw Error(`Windows sandbox setup already in progress`); if (this.timedOutWindowsSandboxSetup?.[mode] != null) throw Error(`Cannot retry the same Windows sandbox setup mode immediately after a timeout`);
    const deferred = createDeferred<UnknownRecord>(); let setup: SandboxSetup; const finish = () => { if (setup.finished) return false; setup.finished = true; setup.cancelTimeout?.(); setup.cancelTimeout = null; if (this.activeWindowsSandboxSetup === setup) this.activeWindowsSandboxSetup = undefined; return true; }; setup = { mode, finished: false, cancelTimeout: null, complete: (result) => { if (finish()) deferred.resolve(result); }, fail: (error) => { if (finish()) deferred.reject(error); } }; this.activeWindowsSandboxSetup = setup;
    let response: UnknownRecord; try { response = await this.requestClient.sendRequest(`windowsSandbox/setupStart`, { mode, cwd }); } catch (error) { setup.finished = true; this.activeWindowsSandboxSetup = undefined; throw error; }
    if (response.started !== true) { setup.finished = true; this.activeWindowsSandboxSetup = undefined; return { started: false, completion: null }; }
    setup.cancelTimeout = this.schedule(() => { this.timedOutWindowsSandboxSetup = { ...this.timedOutWindowsSandboxSetup, [mode]: Date.now() + SANDBOX_RETRY_DELAY_MS }; setup.fail(Error(`Timed out waiting for Windows sandbox setup completion`)); }, SANDBOX_TIMEOUT_MS); return { started: true, completion: deferred.promise };
  }
  logoutWithoutServer() { this.notifyAuthStatusCallbacks(null); }
  handleNotification(event: { method: string; params: UnknownRecord }) {
    if (event.method === `mcpServer/oauthLogin/completed`) { const name = String(event.params.name ?? ``); const success = event.params.success === true; this.mcpLoginCallbacks.forEach((callback) => callback({ name, success, ...(event.params.error ? { error: event.params.error } : {}) })); return; }
    if (event.method === `account/updated`) { this.notifyAuthStatusCallbacks(event.params.authMode ?? null); return; }
    if (event.method === `account/login/completed`) { const loginId = String(event.params.loginId ?? ``); this.activeLogin?.complete({ loginId, success: event.params.success === true, error: event.params.error, onboardingEntrypoint: event.params.onboardingEntrypoint }); return; }
    if (event.method === `windowsSandbox/setupCompleted`) { const mode = String(event.params.mode ?? ``); const setup = this.activeWindowsSandboxSetup; if (setup?.mode === mode) setup.complete(event.params); else this.clearTimedOutWindowsSandboxSetupMode(mode); }
  }
  private clearExpiredWindowsSandboxTimeouts() { if (!this.timedOutWindowsSandboxSetup) return; for (const [mode, expiresAt] of Object.entries(this.timedOutWindowsSandboxSetup)) if (Date.now() >= expiresAt) delete this.timedOutWindowsSandboxSetup[mode]; if (Object.keys(this.timedOutWindowsSandboxSetup).length === 0) this.timedOutWindowsSandboxSetup = undefined; }
  private clearTimedOutWindowsSandboxSetupMode(mode: string) { if (!this.timedOutWindowsSandboxSetup) return; delete this.timedOutWindowsSandboxSetup[mode]; if (Object.keys(this.timedOutWindowsSandboxSetup).length === 0) this.timedOutWindowsSandboxSetup = undefined; }
  private abortError() { const error = Error(`Aborted`); error.name = `AbortError`; return error; }
  private notifyAuthStatusCallbacks(authMethod: unknown) { for (const callback of this.authStatusCallbacks) callback({ authMethod }); }
}

export { AccountAuthService as Khe };
