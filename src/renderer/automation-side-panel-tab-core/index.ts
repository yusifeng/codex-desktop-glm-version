import "@rchunk/rolldown-runtime";
import {
  BX as useRuntimeQuery,
  HX as useRuntimeSignal,
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  Y2 as FormattedMessage,
  Yh as Button,
  wy as AutomationIcon,
} from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import { QCt as automationsSignal, qvt as sidePanelTabs, ttt as automationDetailSignal } from "@rchunk/app-initial";
import "@rchunk/appgen-access";
import "@rchunk/elicitation-events";
import "@rchunk/site-automation-setup-state";
import { t as AutomationEditorPanel } from "@rchunk/cloud-automation-detail-panel";
import { t as LocalAutomationEditor } from "@rchunk/automation-editor-dialog";
import "@rchunk/automation-dialog";
import "@rchunk/automation-delete-confirmation-dialog";

interface AutomationSummary extends Record<string, unknown> { id: string; name: string; prompt?: string; title?: string; }
interface AutomationMutation { isPending?: boolean; mutate?(input: unknown, options?: { onError?(error: unknown): void; onSuccess?(value: AutomationSummary): void }): void; }
interface MutationBindings {
  att?: unknown;
  Ftt?(input: Record<string, unknown>): unknown;
  htt?(draft: Record<string, unknown>, timezone: string): unknown;
  ptt?: unknown;
  Vtt?(input: Record<string, unknown>): unknown;
  iun?(operation: string): AutomationMutation;
}
const { att: cloudDeleteMutationSignal, Ftt: buildCreateRequest, htt: buildCloudRequest, ptt: cloudUpdateMutationSignal, Vtt: buildUpdateRequest, iun: useAutomationMutation } = appInitialChunk as unknown as MutationBindings;
interface AutomationRequest {
  automation?: AutomationSummary | null;
  automationId?: string | null;
  error?: unknown;
  isLoading?: boolean;
  proposal?: { prompt: string; projectId: string; rrule?: string | null; title: string };
  seed?: { directiveKey?: string; prompt?: string; title?: string; userMessage?: string };
  type: "automation" | "persisted" | "proposal" | "site" | "suggestion";
}
interface AutomationTabState { draftInstanceId: string; savedAutomationId?: string | null; }
interface AutomationSidePanelTabContentProps {
  request: AutomationRequest;
  setTabState(update: (state: AutomationTabState) => AutomationTabState): void;
  tabId: string;
  tabState: AutomationTabState;
}

function LoadingPanel(): unknown {
  return getJsxRuntime().jsx("div", { className: "flex h-full items-center justify-center bg-surface", children: getJsxRuntime().jsx(LoadingSpinner, { className: "icon-sm" }) });
}

function MissingAutomation(): unknown {
  const runtime = getJsxRuntime();
  return runtime.jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 bg-surface p-panel text-center", children: [
    runtime.jsx(AutomationIcon, { className: "icon-sm" }),
    runtime.jsx(FormattedMessage, { id: "automation.sidePanel.missingTitleUnavailable", defaultMessage: "Scheduled task unavailable" }),
    runtime.jsx(FormattedMessage, { id: "automation.sidePanel.missingDescriptionDevice", defaultMessage: "This scheduled task may have been deleted or is no longer available on this device" }),
  ] });
}

function AutomationLoadError({ onRetry }: { onRetry?(): void }): unknown {
  const runtime = getJsxRuntime();
  return runtime.jsxs("div", { role: "alert", className: "flex h-full flex-col items-center justify-center gap-3 bg-surface p-panel text-center", children: [
    runtime.jsx(FormattedMessage, { id: "inbox.automations.cloud.loadError", defaultMessage: "Cloud scheduled tasks could not be loaded" }),
    onRetry == null ? null : runtime.jsx(Button, { type: "button", onClick: onRetry, children: "Try again" }),
  ] });
}

function SiteAutomationSetup(props: AutomationSidePanelTabContentProps): unknown {
  const runtime = getJsxRuntime();
  const proposal = props.request.proposal;
  if (proposal == null) return runtime.jsx(MissingAutomation, {});
  const savedId = props.tabState.savedAutomationId;
  const save = (): void => {
    const automationId = `site:${proposal.projectId}`;
    props.setTabState((state) => ({ ...state, savedAutomationId: automationId }));
  };
  return runtime.jsxs("section", { className: "flex h-full min-h-0 flex-col bg-surface p-panel", children: [
    runtime.jsx("h2", { children: proposal.title }),
    runtime.jsx("p", { children: proposal.prompt }),
    runtime.jsx("div", { children: proposal.rrule ?? "Schedule not selected" }),
    runtime.jsx(Button, { type: "button", onClick: save, children: savedId == null ? "Create schedule" : "Open schedules" }),
  ] });
}

function mutate(mutation: AutomationMutation | undefined, input: unknown): Promise<AutomationSummary> {
  return new Promise((resolve, reject) => {
    if (mutation?.mutate == null) { reject(Error("Scheduled task mutation is unavailable")); return; }
    mutation.mutate(input, { onSuccess: resolve, onError: reject });
  });
}

function AutomationSidePanelTabContent(props: AutomationSidePanelTabContentProps): unknown {
  if (props.request.type === "site") return SiteAutomationSetup(props);
  const requestedId = props.request.automationId ?? props.tabState.savedAutomationId ?? null;
  const readSignal = useRuntimeSignal as unknown as ((signal: unknown) => unknown) | undefined;
  const readQuery = useRuntimeQuery as unknown as ((signal: unknown, parameter: unknown) => unknown) | undefined;
  const listQuery = readSignal?.(automationsSignal) as { data?: { items?: AutomationSummary[] }; isFetching?: boolean; isLoading?: boolean } | undefined;
  const detailQuery = readQuery?.(automationDetailSignal, requestedId) as { data?: AutomationSummary | { automation: AutomationSummary; teamId?: string | null }; error?: unknown; isFetching?: boolean; isLoading?: boolean; refetch?(): void } | undefined;
  const createMutation = useAutomationMutation?.("automation-create") as AutomationMutation | undefined;
  const updateMutation = useAutomationMutation?.("automation-update") as AutomationMutation | undefined;
  const deleteMutation = useAutomationMutation?.("automation-delete") as AutomationMutation | undefined;
  const cloudUpdateMutation = readSignal?.(cloudUpdateMutationSignal) as AutomationMutation | undefined;
  const cloudDeleteMutation = readSignal?.(cloudDeleteMutationSignal) as AutomationMutation | undefined;
  const listAutomation = requestedId == null ? null : listQuery?.data?.items?.find((item) => item.id === requestedId) ?? null;
  const detailData = detailQuery?.data;
  const suggestion = props.request.type === "suggestion" || props.request.type === "proposal"
    ? {
        id: `suggestion:${props.request.seed?.directiveKey ?? props.tabState.draftInstanceId}`,
        name: props.request.seed?.title ?? props.request.proposal?.title ?? "New scheduled task",
        prompt: props.request.seed?.prompt ?? props.request.seed?.userMessage ?? props.request.proposal?.prompt ?? "",
      }
    : null;
  if (props.request.isLoading === true || listQuery?.isLoading === true || listQuery?.isFetching === true || detailQuery?.isLoading === true || detailQuery?.isFetching === true) return LoadingPanel();
  if (props.request.error != null || detailQuery?.error != null) return getJsxRuntime().jsx(AutomationLoadError, { onRetry: detailQuery?.refetch });
  const localAutomation = props.request.automation ?? listAutomation;
  const close = () => sidePanelTabs.closeTab?.(props.tabId);
  const saved = (automation: AutomationSummary): void => {
    props.setTabState((state) => ({ ...state, savedAutomationId: automation.id }));
    const name = automation.name ?? automation.title ?? "Scheduled task";
    sidePanelTabs.updateTab?.(props.tabId, { title: name, tooltip: name });
  };
  if (localAutomation != null) return getJsxRuntime().jsx(LocalAutomationEditor, {
    item: { automation: localAutomation, teamId: null },
    isPending: updateMutation?.isPending === true || deleteMutation?.isPending === true,
    mode: "panel",
    onClose: close,
    onDelete: () => mutate(deleteMutation, { id: localAutomation.id }),
    onSave: (draft: Record<string, unknown>) => {
      const input = { draft, name: String(draft.name ?? "").trim(), prompt: String(draft.prompt ?? draft.instructions ?? "").trim(), rrule: (draft.rawRrule ?? (draft.scheduleConfig as { customRrule?: string } | undefined)?.customRrule ?? null), status: draft.status ?? "ACTIVE" };
      return mutate(updateMutation, buildUpdateRequest?.(input) ?? input);
    },
    onSaved: (result: unknown) => { if (result != null) saved(result as AutomationSummary); },
  });
  if (suggestion != null) return getJsxRuntime().jsx(LocalAutomationEditor, {
    initialDraft: { name: suggestion.name, instructions: suggestion.prompt, schedule: props.request.proposal?.rrule ?? undefined },
    isPending: createMutation?.isPending === true,
    mode: "panel",
    onClose: close,
    onSave: (draft: Record<string, unknown>) => {
      const input = { draft, name: String(draft.name ?? "").trim(), prompt: String(draft.prompt ?? draft.instructions ?? "").trim(), rrule: draft.schedule ?? null };
      return mutate(createMutation, buildCreateRequest?.(input) ?? input);
    },
    onSaved: (result: unknown) => { if (result != null) saved(result as AutomationSummary); },
  });
  if (detailData == null) return MissingAutomation();
  const cloudItem = ("automation" in detailData ? detailData : { automation: detailData, teamId: null }) as { automation: AutomationSummary; teamId?: string | null };
  return getJsxRuntime().jsx(AutomationEditorPanel, {
    item: cloudItem,
    isPending: cloudUpdateMutation?.isPending === true || cloudDeleteMutation?.isPending === true,
    onClose: () => sidePanelTabs.closeTab?.(props.tabId),
    onDelete: () => mutate(cloudDeleteMutation, { automationId: cloudItem.automation.id, teamId: cloudItem.teamId ?? null }),
    onSave: (draft: Record<string, unknown>) => mutate(cloudUpdateMutation, {
      automationId: cloudItem.automation.id,
      requestBody: buildCloudRequest?.(draft, Intl.DateTimeFormat().resolvedOptions().timeZone) ?? draft,
      teamId: cloudItem.teamId ?? null,
    }),
    onSaved: saved,
  });
}

function AutomationSidePanelTabIcon(): unknown {
  return getJsxRuntime().jsx(AutomationIcon, { "aria-hidden": false });
}

export { AutomationSidePanelTabContent, AutomationSidePanelTabIcon };
