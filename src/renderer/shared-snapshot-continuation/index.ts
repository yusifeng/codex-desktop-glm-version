// Imports a shared Codex snapshot into the composer. Release chunk: shared-snapshot-continuation-c3634fe7a1b8.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}
interface Scope {
  get(signal: unknown): unknown;
  set(signal: unknown, updater: (value: unknown) => unknown): void;
}
interface SharedRuntime {
  $3(): unknown;
  BX(query: unknown, input: Record<string, unknown>): unknown;
  FX(): void;
  I3(): JsxRuntime;
  K2(): void;
  QX(
    key: unknown,
    factory: (
      input: ContinuationInput,
      context: { get(signal: unknown): unknown; scope: Scope },
    ) => QueryOptions,
  ): unknown;
  Y2: unknown;
  lk(): void;
  n4(): { formatMessage(descriptor: Record<string, string>): string };
  pk: unknown;
}
interface InitialRuntime {
  B4: unknown;
  Dyt: unknown;
  M6(): void;
  M6t(): void;
  N6t(): { accountId: string | null; userId: string | null };
  O6(
    scope: Scope,
    input: { hostId: unknown; id: string; preview: string },
  ): { isPending(): boolean; succeed(): void; fail(): void };
  Rht(): void;
  byt(): void;
  d3: unknown;
  kht: unknown;
  mst(value: unknown): Record<string, unknown> | null;
  pdn(): void;
  pst(): void;
  udn: {
    safeGet(path: string, options: Record<string, unknown>): Promise<unknown>;
  };
  x3(): void;
}
interface PrimaryRuntime {
  gr(): void;
  pr(input: {
    scope: Scope;
    executionHostId: unknown;
    label: string;
    text: string;
    shouldDiscard(): boolean;
  }): Promise<Record<string, unknown> | null>;
}
interface ContinuationInput {
  accountId: string | null;
  fallbackTitle: string;
  shareId: string;
  userId: string | null;
}
interface QueryOptions {
  queryKey: unknown[];
  enabled: boolean;
  gcTime: number;
  staleTime: number;
  retry: false;
  queryFn(context: { signal: AbortSignal }): Promise<boolean | null>;
}

const sharedRuntime = appSharedChunk as unknown as SharedRuntime;
const initialRuntime = appInitialChunk as unknown as InitialRuntime;
const primaryRuntime = appPrimaryChunk as unknown as PrimaryRuntime;
let jsx: JsxRuntime;
let continuationQuery: unknown;

function SharedSnapshotContinuation({ shareId }: { shareId: string }): null {
  const intl = sharedRuntime.n4();
  const { accountId, userId } = initialRuntime.N6t();
  const fallbackTitle = intl.formatMessage({
    id: "codex.sharedSnapshot.continuationUntitled",
    defaultMessage: "Shared Codex chat",
    description:
      "Composer attachment title for a shared Codex thread that has no user-provided title",
  });
  sharedRuntime.BX(continuationQuery, {
    accountId,
    fallbackTitle,
    shareId,
    userId,
  });
  return null;
}

function initialize(): void {
  sharedRuntime.$3();
  sharedRuntime.FX();
  sharedRuntime.K2();
  initialRuntime.M6t();
  initialRuntime.x3();
  primaryRuntime.gr();
  initialRuntime.M6();
  sharedRuntime.lk();
  initialRuntime.Rht();
  initialRuntime.byt();
  initialRuntime.pdn();
  initialRuntime.pst();
  jsx = sharedRuntime.I3();
  continuationQuery = sharedRuntime.QX(
    initialRuntime.kht,
    ({ accountId, fallbackTitle, shareId, userId }, { get, scope }) => {
      const hostId = get(initialRuntime.Dyt);
      return {
        queryKey: [
          "shared-codex-snapshot-continuation",
          accountId,
          userId,
          hostId,
          shareId,
        ],
        enabled: accountId != null && userId != null,
        gcTime: 0,
        staleTime: Infinity,
        retry: false,
        queryFn: ({ signal }) => {
          const composerVersion = scope.get(initialRuntime.B4);
          const progress = initialRuntime.O6(scope, {
            hostId,
            id: shareId,
            preview: fallbackTitle,
          });
          return initialRuntime.udn
            .safeGet("/wham/shared_threads/{share_id}", {
              parameters: { path: { share_id: shareId } },
              signal,
            })
            .then(async (response) => {
              signal.throwIfAborted();
              const snapshot = initialRuntime.mst(response);
              if (snapshot == null)
                throw new Error("Invalid shared Codex snapshot");
              const title =
                typeof snapshot.title === "string" && snapshot.title.trim()
                  ? snapshot.title.trim()
                  : fallbackTitle;
              const text = JSON.stringify({
                source: "codex_shared_thread",
                shareId,
                snapshot,
              });
              const file = await primaryRuntime.pr({
                scope,
                executionHostId: hostId,
                label: title,
                text,
                shouldDiscard: () =>
                  signal.aborted ||
                  !progress.isPending() ||
                  scope.get(initialRuntime.B4) !== composerVersion ||
                  scope.get(initialRuntime.Dyt) !== hostId,
              });
              if (file != null) {
                scope.set(initialRuntime.d3, (value) => [
                  ...((value as unknown[]) ?? []),
                  { file: { ...file, sharedThread: { shareId } }, hostId },
                ]);
                progress.succeed();
                return true;
              }
              return null;
            })
            .catch((error) => {
              if (!signal.aborted) {
                const toast = scope.get(sharedRuntime.pk) as {
                  danger(node: unknown, options: Record<string, unknown>): void;
                };
                toast.danger(
                  jsx.jsx(sharedRuntime.Y2, {
                    id: "codex.sharedSnapshot.continuationUnavailable",
                    defaultMessage: "This shared snapshot is unavailable",
                    description:
                      "Error shown when the current Codex account cannot access or validate a shared thread snapshot",
                  }),
                  {
                    errorAnalytics: {
                      toastId: "codex.sharedSnapshot.continuationUnavailable",
                    },
                  },
                );
              }
              throw error;
            })
            .finally(() => progress.fail());
        },
      };
    },
  );
}
initialize();

export { SharedSnapshotContinuation };
