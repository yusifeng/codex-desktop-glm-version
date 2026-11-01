import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  BX as useSignalFamilyValue,
  K2 as initializeInternationalization,
  LX as useAppScope,
  e6 as getReact,
  hG as parseConfigError,
  n4 as useCurrentAccount,
  oY as isTransportUnavailableError,
  pk as toastManager,
  wL as initializeUtilities,
} from "@rchunk/app-shared";
import { formatErrorMessage as getErrorMessage } from "../app-shared/runtime/format-error-message";
import {
  B8t as isMissingPullRequestTaskError,
  DZt as conversationAvailable,
  Jmn as isRetryableResumeError,
  PQt as parentConversation,
  Ugn as getHostConversationService,
  VZt as resolvedConversationHost,
  Vsn as readResumeInputs,
  Yon as resolveWorkspaceRoots,
  mfn as useAppServerPermissionDefault,
  o0t as knownConversationCatalogEntry,
  p4 as useCollaborationMode,
  ul as isLiveWriterConflict,
  wQt as conversationHostId,
} from "@rchunk/app-initial";

interface ResumeState {
  hasResumeFailed: boolean;
  isResuming: boolean;
  isUnavailable: boolean;
  isWriterConflict: boolean;
  retryResume(): void;
}

const once = onceExport as (initializer: () => void) => () => void;

interface ScopeLike {
  get(signal: unknown, parameter?: unknown): unknown;
}

interface ToastHandle {
  close(): void;
}

interface ReactLike {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(
    value: Value,
  ): [Value, (next: Value | ((current: Value) => Value)) => void];
}

function getConfigErrorDetails(
  error: unknown,
): { detail: string; location: string } | null {
  const parsed = parseConfigError(error) as {
    column?: number;
    detail: string;
    filePath?: string;
    line?: number;
  } | null;
  if (parsed == null) return null;
  return {
    location:
      parsed.filePath == null
        ? "config.toml"
        : parsed.line == null || parsed.column == null
          ? parsed.filePath
          : `${parsed.filePath}:${parsed.line}:${parsed.column}`,
    detail: parsed.detail,
  };
}

function shouldAutoRetryResume(error: unknown): boolean {
  const message = (getErrorMessage(error) ?? "").toLowerCase();
  return (
    getConfigErrorDetails(error) == null &&
    !isLiveWriterConflict(error) &&
    !message.startsWith("failedprecondition:") &&
    !isRetryableResumeError(error) &&
    !(error instanceof Error && isTransportUnavailableError(error)) &&
    !message.includes("no rollout found for thread id")
  );
}

function shouldShowResumeError({
  hasShownResumeError,
  isSubagentChildThread,
  shouldAutoRetry,
}: {
  hasShownResumeError: boolean;
  isSubagentChildThread: boolean;
  shouldAutoRetry: boolean;
}): boolean {
  return !isSubagentChildThread && (!hasShownResumeError || !shouldAutoRetry);
}

function formatResumeError(
  intl: {
    formatMessage(
      message: Record<string, unknown>,
      values?: Record<string, unknown>,
    ): string;
  },
  error: unknown,
): string {
  const message = getErrorMessage(error);
  if (message === "FailedPrecondition: history_notes_extension_unsupported") {
    return intl.formatMessage({
      id: "localTaskRow.resumeUnsupportedVersion",
      defaultMessage: "Update Codex to resume this task.",
    });
  }
  const configError = getConfigErrorDetails(error);
  if (configError != null) {
    return intl.formatMessage(
      {
        id: "localTaskRow.resumeConfigError",
        defaultMessage:
          "ChatGPT can't load config.toml, so this thread can't resume. Fix {location}: {detail}.",
      },
      configError,
    );
  }
  return isLiveWriterConflict(error)
    ? intl.formatMessage({
        id: "localTaskRow.resumeLiveWriterError",
        defaultMessage:
          "This task is active elsewhere. Close it there, then retry here.",
      })
    : intl.formatMessage(
        {
          id: "localTaskRow.resumeError.v2",
          defaultMessage: "Failed to resume chat: {error}",
        },
        { error: message },
      );
}

function useResumeConversationIfNeeded(
  conversationId: string | null,
  threadAccess: "shared" | "private" | string,
): ResumeState {
  const React = getReact() as ReactLike;
  const scope = (useAppScope as unknown as () => ScopeLike)();
  const account = useCurrentAccount() as {
    intl?: {
      formatMessage(
        message: Record<string, unknown>,
        values?: Record<string, unknown>,
      ): string;
    };
  };
  const usePermissionDefault = useSignalFamilyValue(
    useAppServerPermissionDefault,
    "4226282475",
  );
  const collaboration = useCollaborationMode(conversationId) as {
    activeMode?: unknown;
  };
  const readConversationSignal = useSignalFamilyValue as unknown as (
    signal: unknown,
    parameter: string | null,
  ) => unknown;
  const available = Boolean(
    readConversationSignal(conversationAvailable, conversationId),
  );
  const [isResuming, setIsResuming] = React.useState(available);
  const [failedConversationId, setFailedConversationId] = React.useState<
    string | null
  >(null);
  const [unavailableConversationId, setUnavailableConversationId] =
    React.useState<string | null>(null);
  const [writerConflictConversationId, setWriterConflictConversationId] =
    React.useState<string | null>(null);
  const [retryGeneration, setRetryGeneration] = React.useState(0);
  const inFlight = React.useRef<string | null>(null);
  const blocked = React.useRef<string | null>(null);
  const toast = React.useRef<ToastHandle | null>(null);
  const retryResume = () => {
    toast.current?.close();
    toast.current = null;
    if (blocked.current === conversationId) blocked.current = null;
    setRetryGeneration((generation) => generation + 1);
  };

  React.useEffect(() => {
    if (
      conversationId == null ||
      !available ||
      inFlight.current === conversationId ||
      blocked.current === conversationId
    )
      return;
    let cancelled = false;
    inFlight.current = conversationId;
    setIsResuming(true);
    setFailedConversationId(null);
    setUnavailableConversationId(null);
    setWriterConflictConversationId(null);
    void (async () => {
      let hostId: string | null = null;
      try {
        const roots = await resolveWorkspaceRoots(scope, conversationId, {
          allowProjectSourceRoots: true,
        });
        if (cancelled || !scope.get(conversationAvailable, conversationId))
          return;
        hostId = scope.get(conversationHostId, conversationId) as string;
        const catalogEntry = scope.get(
          knownConversationCatalogEntry,
          conversationId,
        ) as { hostId?: string; threadId?: string } | null;
        const knownCatalogEntry =
          catalogEntry?.hostId === hostId &&
          catalogEntry.threadId === conversationId
            ? catalogEntry
            : undefined;
        await (
          getHostConversationService(scope, hostId) as unknown as {
            resumeConversation(
              input: Record<string, unknown>,
              options: Record<string, unknown>,
            ): Promise<unknown>;
          }
        ).resumeConversation(
          {
            conversationId,
            threadAccess,
            model: null,
            reasoningEffort: null,
            workspaceRoots: roots,
            useAppServerPermissionDefault: usePermissionDefault,
            collaborationMode: collaboration.activeMode,
            showThreadGoalResumeConfirmation: false,
            ...(knownCatalogEntry == null ? {} : { knownCatalogEntry }),
          },
          { readResumeInputs: readResumeInputs(scope, hostId) },
        );
      } catch (error) {
        if (cancelled) return;
        const message = (getErrorMessage(error) ?? "").toLowerCase();
        if (threadAccess === "shared" && message.includes("thread not found")) {
          blocked.current = conversationId;
          setUnavailableConversationId(conversationId);
          return;
        }
        if (
          hostId != null &&
          isMissingPullRequestTaskError(
            scope,
            { hostId, threadId: conversationId },
            error,
          )
        ) {
          blocked.current = conversationId;
          setUnavailableConversationId(conversationId);
          return;
        }
        if (isLiveWriterConflict(error))
          setWriterConflictConversationId(conversationId);
        else setFailedConversationId(conversationId);
        const autoRetry = shouldAutoRetryResume(error);
        const isSubagent =
          scope.get(parentConversation, conversationId) != null;
        if (
          shouldShowResumeError({
            hasShownResumeError: toast.current != null,
            isSubagentChildThread: isSubagent,
            shouldAutoRetry: autoRetry,
          })
        ) {
          const intl = account.intl ?? {
            formatMessage: (descriptor: Record<string, unknown>) =>
              String(descriptor.defaultMessage ?? ""),
          };
          toast.current = (
            scope.get(toastManager) as {
              danger(
                message: string,
                options: Record<string, unknown>,
              ): ToastHandle;
            }
          ).danger(formatResumeError(intl, error), {
            id: `resume-task-error-${conversationId}`,
            primaryAction: isRetryableResumeError(error)
              ? { label: "Retry", onClick: retryResume }
              : undefined,
          });
        }
        if (autoRetry) {
          globalThis.setTimeout(
            () => setRetryGeneration((generation) => generation + 1),
            750,
          );
        } else {
          blocked.current = conversationId;
        }
      } finally {
        if (!cancelled && inFlight.current === conversationId) {
          inFlight.current = null;
          setIsResuming(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (inFlight.current === conversationId) inFlight.current = null;
    };
  }, [available, conversationId, retryGeneration, scope, threadAccess]);

  return {
    isResuming: available && isResuming,
    hasResumeFailed:
      available &&
      conversationId != null &&
      failedConversationId === conversationId,
    isUnavailable:
      available &&
      conversationId != null &&
      unavailableConversationId === conversationId,
    isWriterConflict:
      available &&
      conversationId != null &&
      writerConflictConversationId === conversationId,
    retryResume,
  };
}

const initializeUseResumeConversationIfNeeded = once((): void => {
  initializeInternationalization();
  initializeUtilities();
  void resolvedConversationHost;
});

export {
  useResumeConversationIfNeeded as n,
  initializeUseResumeConversationIfNeeded as t,
};
