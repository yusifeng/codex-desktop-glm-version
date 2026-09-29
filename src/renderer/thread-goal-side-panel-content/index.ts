// thread-goal-side-panel-content —— 会话 Goal 侧栏编辑与保存交互。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

type StateUpdater<Value> = Value | ((previous: Value) => Value);

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface IntlShape {
  formatMessage(descriptor: { defaultMessage: string; description?: string; id: string }, values?: Record<string, unknown>): string;
}

interface ToastManager {
  danger(message: string, options?: Record<string, unknown>): void;
}

interface ApplicationScope {
  get(signal: unknown): unknown;
}

interface MaterializedGoal {
  objective: string;
}

interface ThreadGoalTabState {
  draft: string;
  isSaving: boolean;
  pendingSourceObjective: string | null;
  savedAtMs: number;
  savedObjective: string;
  sourceObjective?: string | null;
}

interface ThreadGoalSidePanelTabProps {
  conversationId: string;
  hostId: string;
  setTabState(next: StateUpdater<ThreadGoalTabState>): void;
  tabState: ThreadGoalTabState;
}

interface KeyboardEventLike {
  ctrlKey?: boolean;
  key: string;
  metaKey?: boolean;
  preventDefault(): void;
}

const {
  $3: initializeSharedRuntime,
  C_: initializeComposerRuntime,
  FX: initializeSignals,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  LX: useApplicationScope,
  QI: initializeQueryRuntime,
  Yh: Button,
  ZI: applicationScope,
  Zh: initializeButtonRuntime,
  lk: initializeEditorRuntime,
  n4: useIntl,
  pk: toastSignal,
  sO: initializeToastRuntime,
} = appSharedChunk as unknown as {
  $3?: () => void;
  C_?: () => void;
  FX?: () => void;
  I3: () => JsxRuntime;
  K2?: () => void;
  LX: (scope: unknown) => ApplicationScope;
  QI?: () => void;
  Yh?: (props: Record<string, unknown>) => unknown;
  ZI: unknown;
  Zh?: () => void;
  lk?: () => void;
  n4: () => IntlShape;
  pk: unknown;
  sO?: () => void;
};
const {
  B5t: normalizeText,
  QSt: cleanupMaterializedGoal,
  Qen: initializeGoalRuntime,
  R5t: initializeConversationRuntime,
  aCt: initializeMaterializationRuntime,
  eCt: initializeGoalMutationRuntime,
  itn: initializeConversationState,
  lP: getNow,
  oCt: saveThreadGoal,
  sP: initializeThreadRuntime,
  tCt: materializeGoalDraft,
} = appInitialChunk as unknown as {
  B5t?: (text: string) => string;
  QSt?: (input: { hostId: string; materialized: MaterializedGoal; scope: ApplicationScope }) => Promise<void> | void;
  Qen?: () => void;
  R5t?: () => void;
  aCt?: () => void;
  eCt?: () => void;
  itn?: () => void;
  lP?: () => Date;
  oCt?: (input: { appendTranscriptItem: false; conversationId: string; hostId: string; intl: IntlShape; objective: string; scope: ApplicationScope }) => Promise<boolean> | boolean;
  sP?: () => void;
  tCt?: (input: { draft: { imageAttachments: []; objective: string; pastedTextAttachments: [] }; hostId: string; scope: ApplicationScope }) => Promise<MaterializedGoal> | MaterializedGoal;
};
const {
  nc: initializeGoalPanelState,
  ni: initializeGoalPanelRuntime,
} = appPrimaryChunk as unknown as { nc?: () => void; ni?: () => void };

initializeSharedRuntime?.();
initializeToastRuntime?.();
initializeSignals?.();
initializeIntlRuntime?.();
initializeConversationRuntime?.();
initializeButtonRuntime?.();
initializeComposerRuntime?.();
initializeEditorRuntime?.();
initializeThreadRuntime?.();
initializeGoalPanelState?.();
initializeConversationState?.();
initializeGoalRuntime?.();
initializeMaterializationRuntime?.();
initializeGoalMutationRuntime?.();
initializeGoalPanelRuntime?.();
initializeQueryRuntime?.();

const jsx = getJsxRuntime();
const normalize = normalizeText ?? ((text: string) => text);

function updateState(
  setTabState: ThreadGoalSidePanelTabProps["setTabState"],
  patch: (previous: ThreadGoalTabState) => ThreadGoalTabState,
): void {
  setTabState(patch);
}

function actionButton(
  label: string,
  options: { disabled: boolean; loading?: boolean; onClick(): Promise<void> | void; variant: "ghost" | "primary" },
): unknown {
  const props = {
    "aria-label": label,
    children: label,
    color: options.variant,
    disabled: options.disabled,
    loading: options.loading === true,
    onClick: options.onClick,
    size: "toolbar",
    type: "button",
  };
  return Button == null ? jsx.jsx("button", props) : jsx.jsx(Button, props);
}

function ThreadGoalSidePanelTab({
  conversationId,
  hostId,
  setTabState,
  tabState,
}: ThreadGoalSidePanelTabProps): unknown {
  const scope = useApplicationScope(applicationScope);
  const intl = useIntl();
  const draft = tabState.draft;
  const trimmedDraft = normalize(draft).trim();
  const hasChanges = draft !== tabState.savedObjective;
  const canSave = !tabState.isSaving && trimmedDraft.length > 0 && trimmedDraft !== tabState.savedObjective;
  const updatedMinutes = Math.max(0, Math.floor(((getNow?.() ?? new Date()).getTime() - tabState.savedAtMs) / 60_000));

  const save = async (): Promise<void> => {
    if (!canSave) return;
    updateState(setTabState, (previous) => ({ ...previous, isSaving: true }));
    let materialized: MaterializedGoal | null = null;
    try {
      materialized = await (materializeGoalDraft?.({
        scope,
        draft: { objective: trimmedDraft, imageAttachments: [], pastedTextAttachments: [] },
        hostId,
      }) ?? { objective: trimmedDraft });
      updateState(setTabState, (previous) => ({ ...previous, pendingSourceObjective: materialized?.objective ?? null }));
      const saved = await (saveThreadGoal?.({
        scope,
        appendTranscriptItem: false,
        conversationId,
        hostId,
        intl,
        objective: materialized.objective,
      }) ?? true);
      if (saved) {
        const sourceObjective = materialized.objective;
        updateState(setTabState, (previous) => ({
          ...previous,
          draft: trimmedDraft,
          pendingSourceObjective: null,
          savedAtMs: (getNow?.() ?? new Date()).getTime(),
          savedObjective: trimmedDraft,
          sourceObjective,
        }));
      } else {
        updateState(setTabState, (previous) => ({ ...previous, pendingSourceObjective: null }));
      }
    } catch {
      updateState(setTabState, (previous) => ({ ...previous, pendingSourceObjective: null }));
      (scope.get(toastSignal) as ToastManager | undefined)?.danger(
        intl.formatMessage({
          id: "composer.threadGoal.editSaveError",
          defaultMessage: "Failed to save goal objective",
          description: "Toast shown when an edited goal objective cannot be saved",
        }),
        { errorAnalytics: { toastId: "composer.threadGoal.editSaveError" } },
      );
    } finally {
      if (materialized != null) await cleanupMaterializedGoal?.({ scope, hostId, materialized });
      updateState(setTabState, (previous) => ({ ...previous, isSaving: false }));
    }
  };

  const revert = (): void => {
    if (!hasChanges || tabState.isSaving) return;
    updateState(setTabState, (previous) => ({ ...previous, draft: previous.savedObjective }));
  };

  const onKeyDown = (event: KeyboardEventLike): void => {
    if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey) || !canSave) return;
    event.preventDefault();
    void save();
  };

  const updatedLabel = updatedMinutes === 0
    ? "Updated just now"
    : `Updated ${updatedMinutes} min ago`;

  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col bg-surface",
    role: "presentation",
    onKeyDown,
    children: [
      jsx.jsx("div", {
        className: "min-h-0 flex-1 overflow-y-auto p-panel",
        children: jsx.jsx("textarea", {
          "aria-label": "Goal",
          disabled: tabState.isSaving,
          placeholder: "Goal",
          value: draft,
          onChange: (event: { currentTarget: { value: string } }) => {
            const value = normalize(event.currentTarget.value);
            updateState(setTabState, (previous) => previous.draft === value ? previous : { ...previous, draft: value });
          },
        }),
      }),
      jsx.jsxs("div", {
        className: "flex shrink-0 items-center justify-between gap-2 p-panel",
        children: [
          jsx.jsx("span", { className: "truncate text-size-chat text-codex-description select-none", children: updatedLabel }),
          jsx.jsxs("div", {
            className: "flex min-w-0 items-center gap-2",
            children: [
              actionButton("Revert", { disabled: !hasChanges || tabState.isSaving, onClick: revert, variant: "ghost" }),
              actionButton("Save", { disabled: !canSave, loading: tabState.isSaving, onClick: save, variant: "primary" }),
            ],
          }),
        ],
      }),
    ],
  });
}

void runtimeChunk;

export { ThreadGoalSidePanelTab };
