import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  Qh as LoadingSpinner,
  Y2 as FormattedMessage,
  Yh as Button,
  wy as AutomationIcon,
} from "@rchunk/app-shared";
import { qvt as sidePanelTabs } from "@rchunk/app-initial";
import "@rchunk/appgen-access";
import "@rchunk/elicitation-events";
import "@rchunk/site-automation-setup-state";
import { r as AutomationEditorPanel } from "@rchunk/cloud-automation-detail-panel";
import "@rchunk/automation-dialog";
import "@rchunk/automation-editor-dialog";
import "@rchunk/automation-delete-confirmation-dialog";

interface AutomationSummary extends Record<string, unknown> { id: string; name: string; title?: string; }
interface AutomationRequest {
  automation?: AutomationSummary | null;
  automationId?: string | null;
  error?: unknown;
  isLoading?: boolean;
  proposal?: { prompt: string; projectId: string; rrule?: string | null; title: string };
  type: "persisted" | "proposal" | "site";
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

function AutomationSidePanelTabContent(props: AutomationSidePanelTabContentProps): unknown {
  if (props.request.type === "site") return SiteAutomationSetup(props);
  if (props.request.isLoading === true) return LoadingPanel();
  const automation = props.request.automation;
  if (automation == null) return MissingAutomation();
  return getJsxRuntime().jsx(AutomationEditorPanel, {
    item: automation,
    onClose: () => sidePanelTabs.closeTab?.(props.tabId),
    onSaved: (saved: AutomationSummary) => {
      props.setTabState((state) => ({ ...state, savedAutomationId: saved.id }));
      sidePanelTabs.updateTab?.(props.tabId, { title: saved.name, tooltip: saved.name });
    },
  });
}

function AutomationSidePanelTabIcon(): unknown {
  return getJsxRuntime().jsx(AutomationIcon, { "aria-hidden": false });
}

export { AutomationSidePanelTabContent, AutomationSidePanelTabIcon };
