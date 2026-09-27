import "@rchunk/rolldown-runtime";
import {
  AKt as initializeSentinelConstants,
  DKt as sentinelHeaders,
} from "@rchunk/app-initial";

interface SentinelSdk {
  init?(context: string): Promise<unknown>;
  requirementsToken?(event: string): string | null;
  sessionObserverToken?(context: string): Promise<string | null>;
  timing?(): Promise<string | null>;
  token(event: string): Promise<string>;
}

declare global {
  interface Window { SentinelSDK?: SentinelSdk; }
}

const defaultTiming = "[1,null]";
let activeCheckoutSignal: AbortSignal | null = null;
let queue = Promise.resolve();

function enqueue<Result>(operation: () => Promise<Result>): Promise<Result> {
  const result = queue.then(operation);
  queue = result.then(() => undefined, () => undefined);
  return result;
}

function loadSentinelSdk(): Promise<SentinelSdk> {
  return Promise.reject(new Error("Sentinel SDK is browser-only"));
}

function fallbackHeaders(event: string): Record<string, string> {
  try {
    const requirement = window.SentinelSDK?.requirementsToken?.(event);
    return typeof requirement !== "string" || requirement === "" ? {} : {
      [sentinelHeaders.sentinelToken]: JSON.stringify({ e: "k9d4s6v3b2", c: requirement }),
      [sentinelHeaders.timing]: defaultTiming,
    };
  } catch { return {}; }
}

function observeCheckoutSession(signal: AbortSignal): void {
  activeCheckoutSignal = signal;
  enqueue(async () => {
    const sdk = await loadSentinelSdk();
    if (activeCheckoutSignal === signal && !signal.aborted) await sdk.init?.("chatgpt_checkout");
  }).catch(() => undefined);
  signal.addEventListener("abort", () => {
    enqueue(async () => {
      if (activeCheckoutSignal === signal) {
        activeCheckoutSignal = null;
        await window.SentinelSDK?.sessionObserverToken?.("chatgpt_checkout");
      }
    }).catch(() => undefined);
  }, { once: true });
}

async function getIntegrityHeaders(event: string, checkout: boolean): Promise<Record<string, string>> {
  const includeObserver = checkout && event === "checkout_session_approval";
  const headers: Record<string, string> = {};
  let timedOut = false;
  const work = enqueue(async () => {
    if (timedOut) return headers;
    const sdk = await loadSentinelSdk().catch(() => null);
    if (timedOut) return headers;
    if (includeObserver) {
      const observer = await sdk?.sessionObserverToken?.("chatgpt_checkout").catch(() => null);
      if (observer) headers["OpenAI-Sentinel-SO-Token"] = observer;
    }
    if (timedOut) return headers;
    if (sdk != null) {
      try {
        headers[sentinelHeaders.sentinelToken] = await sdk.token(event);
        if (timedOut) return headers;
        headers[sentinelHeaders.timing] = (await sdk.timing?.()) ?? defaultTiming;
      } catch {
        if (!headers[sentinelHeaders.sentinelToken]) Object.assign(headers, fallbackHeaders(event));
      }
    }
    if (checkout && !timedOut && activeCheckoutSignal != null && !activeCheckoutSignal.aborted) {
      await sdk?.init?.("chatgpt_checkout").catch(() => null);
    }
    return headers;
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      work,
      new Promise<Record<string, string>>((resolve) => {
        timeout = setTimeout(() => {
          timedOut = true;
          resolve({
            ...fallbackHeaders(event), ...headers,
            ...(includeObserver && !headers["OpenAI-Sentinel-SO-Token"]
              ? { "OpenAI-Sentinel-SO-Token": JSON.stringify({ e: "client_timeout" }) }
              : {}),
          });
        }, 5000);
      }),
    ]);
    return checkout ? {
      [sentinelHeaders.sentinelToken]: JSON.stringify({ e: "k9d4s6v3b2" }),
      [sentinelHeaders.timing]: defaultTiming,
      ...result,
    } : result;
  } finally { clearTimeout(timeout); }
}

const getCheckoutIntegrityHeaders = (event: string) => getIntegrityHeaders(event, true);
const getActionIntegrityHeaders = (event: string) => getIntegrityHeaders(event, false);

function initializeAccountActionIntegrity(): void {
  initializeSentinelConstants();
  activeCheckoutSignal = null;
  queue = Promise.resolve();
}

export {
  observeCheckoutSession as i,
  getCheckoutIntegrityHeaders as n,
  initializeAccountActionIntegrity as r,
  getActionIntegrityHeaders as t,
};
