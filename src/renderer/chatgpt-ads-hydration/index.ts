// Hydrates ChatGPT ads for eligible conversations. Release chunk: hydration-8c45073f777c.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import {
  o as initializeAdsPlacementPolicy,
  s as isAdsPolicyEnabled,
} from "@rchunk/ads-placement-policy";

interface Scope {
  get(signal: unknown, parameter?: unknown): unknown;
  query: {
    getData(signal: unknown, parameter?: unknown): unknown;
    snapshot(signal: unknown): { getOrFetch(): Promise<unknown> };
  };
}
interface HydrationOptions {
  enabled: boolean;
  useSheepEndpoint: boolean;
  rotatingFallbackEnabled: boolean;
  projectId?: string;
  ownerUserId?: string;
}
interface ConversationData {
  conversation_id?: string;
  is_temporary_chat?: boolean;
  owner?: { user_id?: string };
}
interface CapabilityResult {
  isCapable: boolean;
}
interface AppSharedRuntime {
  vW: string;
  wL(): void;
}
interface ApiClient {
  safeGet(path: string, options: unknown): Promise<unknown>;
}
interface AppInitialRuntime {
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as AppSharedRuntime;
const initial = appInitialChunk as unknown as AppInitialRuntime;
const accountIdSignal = initial.U6t;
const apiClient = initial.rJt as ApiClient;

function abortableDelay(
  milliseconds: number,
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve(true);
    }, milliseconds);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchAds(
  scope: Scope,
  {
    conversationId,
    options,
    signal,
  }: { conversationId: string; options: HydrationOptions; signal: AbortSignal },
): Promise<unknown | null> {
  const accountId = scope.get(accountIdSignal);
  if (!options.enabled || signal.aborted || accountId == null) return null;
  const headers: Record<string, string> = {
    "ChatGPT-Account-ID": String(accountId),
    [shared.vW]: String(accountId),
  };
  if (options.useSheepEndpoint) headers["x-openai-use-sheep"] = "1";
  if (options.projectId != null) {
    headers["chatgpt-project-id"] = options.projectId;
    if (options.ownerUserId != null) {
      headers["chatgpt-conv-owner-id"] = options.ownerUserId;
    }
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const endpoints = options.rotatingFallbackEnabled
      ? (["stable", "rotating"] as const)
      : (["stable"] as const);
    for (const endpoint of endpoints) {
      if (signal.aborted || scope.get(accountIdSignal) !== accountId)
        return null;
      try {
        const result = await apiClient.safeGet(
          endpoint === "stable"
            ? "/bazaar/conversation/{conversation_id}/ads"
            : "/conversations/{conversation_id}/message_supplements",
          {
            parameters: { path: { conversation_id: conversationId } },
            additionalHeaders: headers,
            signal,
          },
        );
        return signal.aborted || scope.get(accountIdSignal) !== accountId
          ? null
          : result;
      } catch (error) {
        if (
          signal.aborted ||
          (error instanceof Error && error.name === "AbortError") ||
          (typeof error === "object" &&
            error !== null &&
            "errorCode" in error &&
            error.errorCode === "account_changed")
        ) {
          return null;
        }
      }
    }
    if (attempt < 2 && !(await abortableDelay(500 * 2 ** attempt, signal))) {
      return null;
    }
  }
  return null;
}

function hydrationExperimentEnabled(scope: Scope): boolean {
  if (!isAdsPolicyEnabled(scope)) return false;
  const configuration = scope.get(initial.gfn);
  const getExperiment = initial.rfn as
    | ((
        configuration: unknown,
        id: string,
      ) => { get(name: string, fallback: boolean): boolean })
    | undefined;
  return (
    configuration != null &&
    (getExperiment?.(configuration, "1402002035").get(
      "conversation_ads_hydration_enabled",
      false,
    ) ??
      false)
  );
}

async function hydrateChatGptAds(
  scope: Scope,
  conversationId: string,
  signal: AbortSignal,
): Promise<unknown | null> {
  const accountId = scope.get(accountIdSignal);
  const conversation = scope.query.getData(initial.BBt, conversationId) as
    ConversationData | undefined;
  const isEligible = () => {
    const experience = scope.get(initial.AVt, conversationId);
    const capability = scope.get(initial.Xet, { name: "chatgpt.ads" }) as
      CapabilityResult | undefined;
    return (
      !signal.aborted &&
      accountId != null &&
      scope.get(accountIdSignal) === accountId &&
      experience !== "tpp" &&
      experience !== "flora" &&
      !scope.get(initial.FVt, conversationId) &&
      scope.get(initial.qVt, conversationId) == null &&
      capability?.isCapable === true &&
      conversation?.conversation_id === conversationId &&
      conversation.is_temporary_chat !== true
    );
  };
  if (!isEligible()) return null;
  try {
    await scope.query.snapshot(initial.bqt).getOrFetch();
  } catch {
    return null;
  }
  if (!isEligible() || !hydrationExperimentEnabled(scope)) return null;
  const projectId = scope.get(initial.VVt, conversationId);
  const gate = initial.ffn as
    ((scope: Scope, id: string) => boolean) | undefined;
  const isProjectId = initial.iUt as
    ((value: unknown) => value is string) | undefined;
  const response = await fetchAds(scope, {
    conversationId,
    signal,
    options: {
      enabled: true,
      useSheepEndpoint: gate?.(scope, "3878139664") ?? false,
      rotatingFallbackEnabled: gate?.(scope, "3886466923") ?? false,
      projectId: isProjectId?.(projectId) ? projectId : undefined,
      ownerUserId: conversation.owner?.user_id,
    },
  });
  const applyHydration = initial.sPt as
    | ((
        scope: Scope,
        conversationId: string,
        response: unknown,
        accountId: unknown,
      ) => void)
    | undefined;
  if (response != null && isEligible() && hydrationExperimentEnabled(scope)) {
    applyHydration?.(scope, conversationId, response, accountId);
  }
  return response;
}

shared.wL();
initializeAdsPlacementPolicy();

export { hydrateChatGptAds };
