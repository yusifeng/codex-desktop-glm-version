// Plaid Link runtime: OAuth resume state, script loading, popup lifecycle,
// token submission, and connection-status polling.
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import { n as onceExport } from "@rchunk/rolldown-runtime";

interface PlaidHandler {
  destroy(): void;
  open(): void;
}

interface PlaidRuntime {
  create(options: Record<string, unknown>): PlaidHandler;
}

interface PendingPlaidLink {
  accountId: string;
  createdAt: number;
  linkToken: string;
  oauthStateId: string;
  returnTo: string;
}

interface PlaidScope {
  get(signal: unknown): any;
  query: any;
  queryClient: any;
}

const shared = appSharedChunk as unknown as Record<string, any>;
const initial = appInitialChunk as unknown as Record<string, any>;
const once = onceExport as (initializer: () => void) => () => void;

const PLAID_SCRIPT_URL =
  "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
const PLAID_SCRIPT_SELECTOR = "script[data-codex-plaid-link]";
const STORAGE_KEY = "codex:finance:pending-plaid-link";
const STORAGE_TTL_MS = 30 * 60 * 1000;
const SCRIPT_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 2_000;

let activeFlow: AbortController | null = null;
let plaidRuntimePromise: Promise<PlaidRuntime> | null = null;

function isPendingPlaidLink(value: unknown): value is PendingPlaidLink {
  if (value == null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.accountId === "string" &&
    record.accountId.length > 0 &&
    typeof record.createdAt === "number" &&
    Number.isFinite(record.createdAt) &&
    typeof record.linkToken === "string" &&
    record.linkToken.length > 0 &&
    typeof record.oauthStateId === "string" &&
    record.oauthStateId.length > 0 &&
    typeof record.returnTo === "string"
  );
}

function storePendingLink(value: PendingPlaidLink): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

function clearPendingLink(accountId: string): void {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) return;
    const value = JSON.parse(raw);
    if (!isPendingPlaidLink(value) || value.accountId === accountId) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

function pendingLink(accountId: string): PendingPlaidLink | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const value = JSON.parse(raw);
    if (
      !isPendingPlaidLink(value) ||
      value.accountId !== accountId ||
      Date.now() - value.createdAt > STORAGE_TTL_MS
    ) {
      clearPendingLink(accountId);
      return null;
    }
    return value;
  } catch {
    clearPendingLink(accountId);
    return null;
  }
}

function readReturnTo(accountId: string): string {
  return pendingLink(accountId)?.returnTo ?? "/finances";
}

function loadPlaidRuntime(
  targetWindow: Window & { Plaid?: PlaidRuntime },
): Promise<PlaidRuntime> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      PLAID_SCRIPT_SELECTOR,
    );
    const script = existing ?? document.createElement("script");
    const timeout = window.setTimeout(
      () =>
        finish(
          new Error("The financial account connection took too long to load"),
        ),
      SCRIPT_TIMEOUT_MS,
    );
    const loaded = () => {
      if (targetWindow.Plaid == null)
        finish(new Error("The financial account provider could not be loaded"));
      else finish(null, targetWindow.Plaid);
    };
    const failed = () =>
      finish(new Error("The financial account provider could not be loaded"));
    const finish = (error: Error | null, runtime?: PlaidRuntime) => {
      window.clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      if (error == null) {
        if (runtime != null) resolve(runtime);
      } else {
        if (targetWindow.Plaid == null) script.remove();
        reject(error);
      }
    };
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (existing == null) {
      script.async = true;
      script.dataset.codexPlaidLink = "true";
      script.referrerPolicy = "no-referrer";
      script.src = PLAID_SCRIPT_URL;
      const nonce =
        document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;
      if (nonce != null && nonce.length > 0) script.nonce = nonce;
      document.head.appendChild(script);
    }
  });
}

async function getPlaidRuntime(
  signal: AbortSignal,
): Promise<PlaidRuntime | null> {
  if (signal.aborted) return null;
  const targetWindow = window as Window & { Plaid?: PlaidRuntime };
  if (targetWindow.Plaid != null) return targetWindow.Plaid;
  const pending = plaidRuntimePromise ?? loadPlaidRuntime(targetWindow);
  plaidRuntimePromise = pending;
  let abort: (() => void) | undefined;
  const aborted = new Promise<null>((resolve) => {
    abort = () => resolve(null);
    signal.addEventListener("abort", abort, { once: true });
  });
  try {
    return await Promise.race([pending, aborted]);
  } catch (error) {
    if (plaidRuntimePromise === pending) plaidRuntimePromise = null;
    throw error;
  } finally {
    if (abort != null) signal.removeEventListener("abort", abort);
  }
}

function openPlaid(
  runtime: PlaidRuntime,
  {
    linkToken,
    receivedRedirectUri,
    signal,
  }: { linkToken: string; receivedRedirectUri?: string; signal: AbortSignal },
): Promise<{ publicToken?: string | null; type: "cancelled" | "completed" }> {
  return new Promise((resolve, reject) => {
    let handler: PlaidHandler | null = null;
    let loadedBeforeAssignment = false;
    let settled = false;
    const timeout = window.setTimeout(
      () =>
        finish(
          null,
          new Error("The financial account connection took too long to open"),
        ),
      SCRIPT_TIMEOUT_MS,
    );
    const cancelled = () => finish({ type: "cancelled" });
    const interceptExternalNavigation = (event: MessageEvent) => {
      const message = shared.q3(event);
      if (
        message?.type === "toggle-browser-panel" &&
        message.initiator === "window_open" &&
        message.url != null &&
        initial.kft({
          href: message.url,
          initiator: "open_in_browser_bridge",
          openTarget: "external-browser",
        })
      )
        event.stopImmediatePropagation();
    };
    const finish = (
      result: {
        publicToken?: string | null;
        type: "cancelled" | "completed";
      } | null,
      error?: Error,
    ) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", cancelled);
      window.removeEventListener("message", interceptExternalNavigation, true);
      try {
        handler?.destroy();
      } catch {}
      if (error == null) {
        if (result != null) resolve(result);
      } else reject(error);
    };
    signal.addEventListener("abort", cancelled, { once: true });
    if (signal.aborted) return cancelled();
    window.addEventListener("message", interceptExternalNavigation, true);
    try {
      handler = runtime.create({
        noLoadingState: true,
        receivedRedirectUri,
        token: linkToken,
        onLoad: () => {
          window.clearTimeout(timeout);
          if (handler == null) loadedBeforeAssignment = true;
          else if (!signal.aborted) {
            try {
              handler.open();
            } catch {
              finish(
                null,
                new Error("The financial account connection could not open"),
              );
            }
          }
        },
        onSuccess: (token: unknown) =>
          finish({
            publicToken:
              typeof token === "string" && token.length > 0 ? token : null,
            type: "completed",
          }),
        onExit: (error: unknown) =>
          error == null
            ? finish({ type: "cancelled" })
            : finish(
                null,
                new Error("The financial account connection failed"),
              ),
      });
      if (loadedBeforeAssignment && !signal.aborted) handler.open();
    } catch {
      finish(
        null,
        new Error("The financial account connection could not open"),
      );
    }
  });
}

function delay(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timeout = window.setTimeout(finish, POLL_INTERVAL_MS);
    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
  });
}

async function waitForConnection(
  scope: PlaidScope,
  accountId: string,
  oauthStateId: string,
  signal: AbortSignal,
): Promise<boolean> {
  const deadline = Date.now() + STORAGE_TTL_MS;
  while (!signal.aborted && Date.now() < deadline) {
    try {
      const state = await scope
        .get(initial.WW)
        .getOAuthState(oauthStateId, signal);
      if (state.finished || state.connected_accounts > 0) {
        scope.query.invalidate?.(initial.ly, accountId);
        await scope.queryClient.invalidateQueries({
          queryKey: ["personal-finance", accountId],
        });
        return true;
      }
      if (state.status === "error" || state.status === "disconnected") {
        throw new Error("The financial account connection was declined");
      }
    } catch (error) {
      if (
        signal.aborted ||
        (error instanceof Error &&
          error.message === "The financial account connection was declined")
      )
        throw error;
    }
    await delay(signal);
  }
  return false;
}

async function connectPlaid(
  scope: PlaidScope,
  {
    accountId,
    linkId,
    receivedRedirectUri,
    returnTo = initial.Pzt,
    signal,
  }: {
    accountId: string;
    linkId?: string;
    receivedRedirectUri?: string;
    returnTo?: string;
    signal?: AbortSignal;
  },
): Promise<boolean> {
  initializePlaidLink();
  if (activeFlow != null)
    throw new Error("A financial account connection is already in progress");
  if (signal?.aborted) return false;
  const controller = new AbortController();
  activeFlow = controller;
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const pending = receivedRedirectUri == null ? null : pendingLink(accountId);
    if (
      receivedRedirectUri != null &&
      (pending == null ||
        !new URL(receivedRedirectUri).searchParams.get("oauth_state_id"))
    ) {
      throw new Error("The financial account connection could not be resumed");
    }
    const flow =
      pending == null
        ? await scope
            .get(initial.WW)
            .startOAuthFlow(
              { link_id: linkId, native_android: false, native_ios: false },
              controller.signal,
            )
        : { oauth_state_id: pending.oauthStateId, token: pending.linkToken };
    if (controller.signal.aborted) return false;
    if (typeof flow.token !== "string" || flow.token.length === 0) {
      throw new Error(
        "The financial account connection did not provide a token",
      );
    }
    if (receivedRedirectUri == null) {
      storePendingLink({
        accountId,
        createdAt: Date.now(),
        linkToken: flow.token,
        oauthStateId: flow.oauth_state_id,
        returnTo,
      });
    }
    const runtime = await getPlaidRuntime(controller.signal);
    if (runtime == null) return false;
    const result = await openPlaid(runtime, {
      linkToken: flow.token,
      receivedRedirectUri,
      signal: controller.signal,
    });
    if (result.type === "cancelled" || controller.signal.aborted) return false;
    await scope
      .get(initial.WW)
      .markOAuthFlowInitializing(flow.oauth_state_id)
      .catch(() => undefined);
    if (controller.signal.aborted) return false;
    if (result.publicToken != null) {
      scope
        .get(initial.WW)
        .submitPlaidPublicToken({
          link_token: flow.token,
          public_token: result.publicToken,
        })
        .catch(() => undefined);
    }
    return await waitForConnection(
      scope,
      accountId,
      flow.oauth_state_id,
      controller.signal,
    );
  } finally {
    controller.abort();
    signal?.removeEventListener("abort", abort);
    if (activeFlow === controller) {
      activeFlow = null;
      clearPendingLink(accountId);
    }
  }
}

async function openPlaidFromWidget(
  scope: PlaidScope,
  {
    accountId,
    linkToken,
    oauthStateId,
    signal,
  }: {
    accountId: string;
    linkToken: string;
    oauthStateId: string;
    signal?: AbortSignal;
  },
): Promise<{
  plaidErrorCode?: string;
  plaidExitStatus?: string;
  publicToken?: string;
  type: "completed" | "exited";
}> {
  initializePlaidLink();
  if (activeFlow != null)
    return { type: "exited", plaidErrorCode: "flow_already_in_progress" };
  if (signal?.aborted)
    return { type: "exited", plaidErrorCode: "launch_cancelled" };
  const controller = new AbortController();
  activeFlow = controller;
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  storePendingLink({
    accountId,
    createdAt: Date.now(),
    linkToken,
    oauthStateId,
    returnTo: initial.Pzt,
  });
  try {
    const runtime = await getPlaidRuntime(controller.signal);
    if (runtime == null)
      return { type: "exited", plaidErrorCode: "launch_cancelled" };
    const result = await openPlaid(runtime, {
      linkToken,
      signal: controller.signal,
    });
    if (result.type === "cancelled")
      return { type: "exited", plaidExitStatus: "exited" };
    scope.queryClient.invalidateQueries({
      queryKey: ["personal-finance", accountId],
    });
    return { publicToken: result.publicToken ?? undefined, type: "completed" };
  } finally {
    controller.abort();
    signal?.removeEventListener("abort", abort);
    if (activeFlow === controller) {
      activeFlow = null;
      clearPendingLink(accountId);
    }
  }
}

const initializePlaidLink = once((): void => {
  // Preserve the release initializer order. H4/V4/q4/m6t are schema
  // constructors consumed while building the pending-link validator, not
  // standalone initializers, and therefore must not be invoked by themselves.
  shared.g4?.();
  initial._6t?.();
  initial.Dft?.();
  shared.J3?.();
  initial.uy?.();
  initial.UW?.();
  initial.Izt?.();
});

export {
  openPlaidFromWidget as i,
  initializePlaidLink as n,
  connectPlaid as r,
  readReturnTo as t,
};
