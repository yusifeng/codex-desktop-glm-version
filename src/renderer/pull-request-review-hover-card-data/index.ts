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
  rZ(...args: unknown[]): unknown;
  rZt?: unknown;
  [key: string]: unknown;
}
interface AppInitialRuntime {
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as AppSharedRuntime;
const initial = appInitialChunk as unknown as AppInitialRuntime;
const jsxRuntime = shared.I3();
let previewSignal: unknown;

function callInitializer(runtime: Record<string, unknown>, name: string): void {
  const value = runtime[name];
  if (typeof value === "function") (value as () => void)();
}

function initializeHoverCardData(): void {
  callInitializer(shared as unknown as Record<string, unknown>, "FX");
  callInitializer(shared as unknown as Record<string, unknown>, "wL");
  for (const name of ["CSt", "wy", "jy", "Oy", "itn", "byt", "i5t", "yy"]) {
    callInitializer(initial, name);
  }
  previewSignal ??= shared.rZ(
    initial.$en,
    (
      input: {
        conversationId: string;
        hostId: string;
        pullRequest: PullRequestTarget["pullRequest"];
      },
      context: { get(signal: unknown, parameter?: unknown): unknown },
    ) => {
      const normalizeHost = initial.Z8t as
        ((value: string) => string) | undefined;
      const hostname =
        normalizeHost?.(input.pullRequest.hostname) ??
        input.pullRequest.hostname;
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
      if (summary.data?.status !== "success") {
        return { kind: summary.isPending ? "loading" : "unavailable" };
      }
      return { kind: "ready", ...summary.data };
    },
  );
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
