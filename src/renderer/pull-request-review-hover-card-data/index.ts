// Pull-request hover-card data bridge. Release chunk: hover-card-data-95a14e835743.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface PullRequestTarget {
  pullRequest: { hostname: string; owner: string; repository: string };
  [key: string]: unknown;
}
interface Props {
  conversationId: string;
  hostId: string;
  target: PullRequestTarget;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}
interface AppSharedRuntime {
  BX(signal: unknown, parameter: unknown): unknown;
  I3(): JsxRuntime;
  l3?(left: unknown, right: unknown): boolean;
  rZ(...args: unknown[]): unknown;
  [key: string]: unknown;
}
interface AppInitialRuntime {
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as AppSharedRuntime;
const initial = appInitialChunk as unknown as AppInitialRuntime;
let jsxRuntime: JsxRuntime;
let previewSignal: unknown;
let initialized = false;

function callInitializer(runtime: Record<string, unknown>, name: string): void {
  const value = runtime[name];
  if (typeof value === "function") (value as () => void)();
}

function initializeHoverCardData(): void {
  if (initialized) return;
  initialized = true;
  callInitializer(shared as unknown as Record<string, unknown>, "$3");
  callInitializer(shared as unknown as Record<string, unknown>, "FX");
  callInitializer(initial, "S$");
  callInitializer(shared as unknown as Record<string, unknown>, "wL");
  for (const name of ["CSt", "wy", "jy", "Oy", "itn", "byt", "i5t", "yy"]) {
    callInitializer(initial, name);
  }
  previewSignal = shared.rZ(
    initial.$en,
    (
      input: {
        conversationId: string;
        hostId: string;
        pullRequest: PullRequestTarget["pullRequest"];
      },
      context: { get(signal: unknown, parameter?: unknown): unknown; scope: { value: unknown } },
    ) => {
      const normalizeHost = initial.Z8t as
        ((value: string) => string) | undefined;
      const hostname =
        normalizeHost?.(input.pullRequest.hostname) ??
        input.pullRequest.hostname;
      if (hostname !== "github.com") {
        const conversationForScope = initial.rtn as ((value: unknown) => string | null) | undefined;
        if (conversationForScope?.(context.scope.value) !== input.conversationId) return { kind: "unavailable" };
        const cwd = context.get(initial.Syt) as string | null;
        if (cwd == null || context.get(initial.Dyt) !== input.hostId) return { kind: "unavailable" };
        const origins = context.get(initial.SSt, {
          params: { dirs: [cwd], hostId: input.hostId },
          source: "pull_requests_page",
        }) as { isPending?: boolean; data?: { origins?: Array<{ dir: string; originUrl?: string }> } };
        if (origins.isPending) return { kind: "loading" };
        const originUrl = origins.data?.origins?.find(item => item.dir === cwd)?.originUrl ?? "";
        const parseUrl = shared._H as ((url: string) => { host?: string } | null) | undefined;
        if ((normalizeHost?.(parseUrl?.(originUrl)?.host ?? "") ?? parseUrl?.(originUrl)?.host ?? "") !== hostname) {
          return { kind: "unavailable" };
        }
      }
      const provider = context.get(initial.My, {
        cwd: null,
        hostId: input.hostId,
        operation: "detail",
        operationSource: "pull_requests_page",
        repository: {
          host: hostname,
          owner: input.pullRequest.owner,
          repo: input.pullRequest.repository,
        },
      }) as { source?: string; isFallback?: boolean } | undefined;
      if (
        !provider ||
        provider.source === "loading" ||
        provider.source === "unavailable"
      ) {
        return { kind: provider?.source ?? "unavailable" };
      }
      const account = context.get(initial.gy, {
        hostId: input.hostId,
        hostname,
        provider: provider.source,
        source: "pull_requests_page",
      }) as {
        data?: { status?: string; account?: unknown };
        isPending?: boolean;
      };
      if (account.data?.status !== "success") {
        return { kind: account.isPending ? "loading" : "unavailable" };
      }
      const request = {
        request: {
          account: account.data.account,
          pullRequest: input.pullRequest,
        },
        provider: provider.source,
        source: "pull_requests_page",
        isFallback: provider.isFallback,
      };
      const summary = context.get(initial.ky, request) as {
        data?: Record<string, unknown> & { status?: string };
        isPending?: boolean;
      };
      const details = context.get(initial.Ty, request) as {
        data?: Record<string, unknown> & { status?: string; headRevision?: string; authorLogin?: string; authorAvatarUrl?: string; additions?: number; deletions?: number; changedFiles?: number };
      };
      if (summary.data?.status !== "success") {
        return { kind: summary.isPending ? "loading" : "unavailable" };
      }
      const detail = details.data?.status === "success" ? details.data : null;
      const revisionsMatch = detail != null && detail.headRevision === summary.data.headRevision;
      const status = (initial.of as ((data: unknown) => unknown) | undefined)?.(summary.data) ?? null;
      return {
        kind: "ready",
        title: summary.data.title,
        status,
        visualState: status == null ? null : (initial.sf as ((value: Record<string, unknown>) => unknown) | undefined)?.({
          status,
          canMerge: summary.data.canMerge,
          ciStatus: summary.data.ciStatus,
          hasMergeConflicts: summary.data.mergeBlocker === "conflicts",
        }) ?? null,
        authorLogin: detail?.authorLogin ?? null,
        authorAvatarUrl: detail?.authorAvatarUrl ?? null,
        additions: revisionsMatch ? detail?.additions ?? null : null,
        deletions: revisionsMatch ? detail?.deletions ?? null : null,
        changedFiles: revisionsMatch ? detail?.changedFiles ?? null : null,
      };
    },
    { isEqual: shared.l3 },
  );
  jsxRuntime = shared.I3();
}

function PullRequestReviewHoverCardData({
  conversationId,
  hostId,
  target,
}: Props): unknown {
  const preview = shared.BX(previewSignal, {
    conversationId,
    hostId,
    pullRequest: target.pullRequest,
  });
  return jsxRuntime.jsx(initial.x$, { preview, target });
}

initializeHoverCardData();

export { PullRequestReviewHoverCardData };
