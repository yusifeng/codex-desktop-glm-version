// Sensitive-image upload reminder controller. Release chunk: sensitive-image-reminder-e42962fc2c0e.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as reminderDialogChunk from "@rchunk/chatgpt-image-upload-reminder-dialog-core";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
interface ReactRuntime {
  useRef<Value>(value: Value): { current: Value };
  useSyncExternalStore<Value>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => Value,
    getServerSnapshot: () => Value,
  ): Value;
}
interface UploadFile {
  uploadId: string;
  fileId?: string;
  result?: boolean | null;
}
interface UploadBatch {
  accountId: string;
  userId: string;
  batchId: string;
  gizmoId?: string;
  acknowledged?: boolean;
  experimentEnabled?: boolean;
  files: UploadFile[];
}
interface Scope {
  get(signal: unknown, parameter?: string): unknown;
  set(
    signal: unknown,
    parameter: string,
    updater: (value: UploadBatch[]) => UploadBatch[],
  ): void;
}
interface SharedRuntime {
  $3(): unknown;
  BX(signal: unknown, parameter: string): UploadBatch[];
  FX(): void;
  HX(signal: unknown): { accountId: string; userId: string };
  I3(): JsxRuntime;
  LX(context: unknown): Scope;
  QI(): void;
  ZI: unknown;
  e6(): ReactRuntime;
  vL(): void;
  yL(input: { queries: unknown[]; combine(results: unknown[]): null }): unknown;
}
interface InitialRuntime {
  Gzt(): boolean;
  Sqt(): void;
  Vzt(): void;
  cJt(): void;
  hRt(): void;
  ifn(): void;
  lfn(): unknown;
  mRt(): void;
  pRt: unknown;
  rJt: {
    safePost(
      path: string,
      options: Record<string, unknown>,
    ): Promise<{ is_sensitive?: boolean | null }>;
  };
  rfn(
    experiments: unknown,
    id: string,
  ): { get(key: string, fallback: boolean): boolean };
  vqt: unknown;
}
interface PrimaryRuntime {
  Ma(): void;
  Na(listener: () => void): () => void;
}
interface DialogRuntime {
  n(): void;
  t: unknown;
}
interface Props {
  conversationId: string;
  hasCompetingDialog: boolean;
}

const sharedRuntime = appSharedChunk as unknown as SharedRuntime;
const initialRuntime = appInitialChunk as unknown as InitialRuntime;
const primaryRuntime = appPrimaryChunk as unknown as PrimaryRuntime;
const dialogRuntime = reminderDialogChunk as unknown as DialogRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
const candidateSelector = "[data-chatgpt-sensitive-image-reminder-candidate]";
const overlayClassName = "chatgpt-sensitive-image-reminder-overlay";

function isCandidateVisible(element: Element | null): boolean {
  return (
    element != null &&
    typeof document !== "undefined" &&
    document.querySelector(candidateSelector) === element &&
    document.querySelector(`.codex-dialog-overlay:not(.${overlayClassName})`) ==
      null
  );
}
function containsSensitiveFile(file: UploadFile): boolean {
  return file.result === true;
}
function combineQueries(): null {
  return null;
}
function serverVisibilitySnapshot(): false {
  return false;
}

function ChatGptSensitiveImageReminder({
  conversationId,
  hasCompetingDialog,
}: Props): unknown {
  const scope = sharedRuntime.LX(sharedRuntime.ZI);
  const experiments = initialRuntime.lfn();
  const uploadBatches = sharedRuntime.BX(initialRuntime.pRt, conversationId);
  const account = sharedRuntime.HX(initialRuntime.vqt);
  const dialogOpen = initialRuntime.Gzt();
  const markerRef = React.useRef<Element | null>(null);
  const visible = React.useSyncExternalStore(
    primaryRuntime.Na,
    () => isCandidateVisible(markerRef.current),
    serverVisibilitySnapshot,
  );
  const pendingFiles = uploadBatches.flatMap((batch) =>
    batch.accountId === account.accountId && batch.userId === account.userId
      ? batch.files.flatMap((file) =>
          typeof file.fileId === "string" && file.result === undefined
            ? [
                {
                  accountId: batch.accountId,
                  userId: batch.userId,
                  batchId: batch.batchId,
                  uploadId: file.uploadId,
                  fileId: file.fileId,
                  gizmoId: batch.gizmoId,
                },
              ]
            : [],
        )
      : [],
  );
  const queries = pendingFiles.map((pending) => ({
    queryKey: [
      "chatgpt-image-safety-preview",
      pending.accountId,
      pending.userId,
      conversationId,
      pending.batchId,
      pending.uploadId,
      pending.fileId,
      pending.gizmoId,
    ],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const batches = scope.get(
        initialRuntime.pRt,
        conversationId,
      ) as UploadBatch[];
      const batch = batches.find(
        (candidate) => candidate.batchId === pending.batchId,
      );
      const file = batch?.files.find(
        (candidate) => candidate.uploadId === pending.uploadId,
      );
      const currentAccount = scope.get(initialRuntime.vqt) as {
        accountId: string;
        userId: string;
      };
      if (
        signal.aborted ||
        file?.fileId !== pending.fileId ||
        file.result !== undefined ||
        batch?.accountId !== currentAccount.accountId ||
        batch.userId !== currentAccount.userId
      )
        return null;
      const enabled =
        batch.experimentEnabled ??
        initialRuntime
          .rfn(experiments, "67629032")
          .get("enable_new_sensitive_image_upload_reminder", false);
      scope.set(initialRuntime.pRt, conversationId, (value) =>
        value.map((item) =>
          item.batchId === batch.batchId
            ? { ...item, experimentEnabled: enabled }
            : item,
        ),
      );
      let result: boolean | null = null;
      if (enabled) {
        try {
          result =
            (
              await initialRuntime.rJt.safePost(
                "/files/{file_id}/image_safety_preview",
                {
                  additionalHeaders: { "ChatGPT-Account-ID": batch.accountId },
                  parameters: {
                    path: { file_id: pending.fileId },
                    query:
                      batch.gizmoId == null
                        ? undefined
                        : { gizmo_id: batch.gizmoId },
                  },
                  signal,
                },
              )
            ).is_sensitive ?? null;
        } catch {
          result = null;
        }
      }
      const latestAccount = scope.get(initialRuntime.vqt) as {
        accountId: string;
        userId: string;
      };
      if (
        !signal.aborted &&
        latestAccount.accountId === batch.accountId &&
        latestAccount.userId === batch.userId
      ) {
        scope.set(initialRuntime.pRt, conversationId, (value) =>
          value
            .map((item) =>
              item.batchId === batch.batchId
                ? {
                    ...item,
                    files: item.files.map((candidate) =>
                      candidate.uploadId === pending.uploadId &&
                      candidate.fileId === pending.fileId
                        ? { ...candidate, result }
                        : candidate,
                    ),
                  }
                : item,
            )
            .filter((item) => item.files.length > 0),
        );
      }
      return null;
    },
    gcTime: 0,
    retry: false,
    staleTime: Infinity,
  }));
  sharedRuntime.yL({ queries, combine: combineQueries });
  const reminder = uploadBatches.find(
    (batch) =>
      batch.accountId === account.accountId &&
      batch.userId === account.userId &&
      !batch.acknowledged &&
      batch.files.some(containsSensitiveFile),
  );
  if (reminder == null) return null;
  const marker = jsx.jsx("span", {
    ref: markerRef,
    hidden: true,
    "data-chatgpt-sensitive-image-reminder-candidate": true,
  });
  const dialog =
    visible && !hasCompetingDialog && !dialogOpen
      ? jsx.jsx(dialogRuntime.t, {
          overlayClassName,
          onAcknowledge: () => {
            const latest = scope.get(initialRuntime.vqt) as {
              accountId: string;
              userId: string;
            };
            scope.set(initialRuntime.pRt, conversationId, (value) =>
              value
                .map((batch) =>
                  batch.batchId === reminder.batchId &&
                  batch.accountId === latest.accountId &&
                  batch.userId === latest.userId
                    ? { ...batch, acknowledged: true }
                    : batch,
                )
                .filter((batch) => batch.files.length > 0),
            );
          },
        })
      : null;
  return jsx.jsxs(jsx.Fragment, { children: [marker, dialog] });
}

function initialize(): void {
  sharedRuntime.$3();
  sharedRuntime.vL();
  sharedRuntime.FX();
  React = sharedRuntime.e6();
  primaryRuntime.Ma();
  initialRuntime.Vzt();
  sharedRuntime.QI();
  initialRuntime.ifn();
  dialogRuntime.n();
  initialRuntime.cJt();
  initialRuntime.Sqt();
  initialRuntime.mRt();
  jsx = sharedRuntime.I3();
}
initialize();

export { ChatGptSensitiveImageReminder };
