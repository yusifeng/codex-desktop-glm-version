// task-announcement-candidates —— 任务页上的模型迁移与续费公告候选。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as composerAnnouncementSlotChunk from "@rchunk/composer-announcement-slot";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as taskAnnouncementStateChunk from "@rchunk/task-announcement-state";
import * as workspaceRenewalChunk from "@rchunk/workspace-renewal-payment";
import type { JsxRuntime } from "@rchunk/app-shared";

void appInitialChunk;
void appPrimaryChunk;
void runtimeChunk;
void taskAnnouncementStateChunk;
void workspaceRenewalChunk;

interface AppSharedBindings {
  I3: JsxRuntime | (() => JsxRuntime);
}

interface ComposerSlotBindings {
  t?: (props: Record<string, unknown>) => unknown;
}

export interface TaskAnnouncementCandidatesProps {
  conversationId?: string | null;
  currentModel?: string | null;
  replacementModel?: string | null;
  suppressed?: boolean;
  turnId?: string | null;
  onDismiss?(): void;
  onSwitchModel?(model: string): Promise<unknown> | unknown;
}

const { I3: jsxRuntimeExport } = appSharedChunk as unknown as AppSharedBindings;
const { t: ComposerAnnouncementSlot } =
  composerAnnouncementSlotChunk as unknown as ComposerSlotBindings;
let jsx: JsxRuntime;

function TaskAnnouncementCandidates({
  conversationId,
  currentModel,
  replacementModel,
  suppressed = false,
  turnId,
  onDismiss,
  onSwitchModel,
}: TaskAnnouncementCandidatesProps = {}): unknown {
  initializeTaskAnnouncementCandidates();
  if (suppressed || replacementModel == null || replacementModel === currentModel)
    return null;
  const content = jsx.jsxs("aside", {
    className: "task-announcement task-announcement--model-migration",
    "data-conversation-id": conversationId,
    "data-turn-id": turnId,
    children: [
      jsx.jsx("strong", { children: `${currentModel ?? "This model"} is being retired` }),
      jsx.jsx("p", { children: `Continue with ${replacementModel}.` }),
      jsx.jsxs("div", {
        children: [
          jsx.jsx("button", {
            onClick: () => onSwitchModel?.(replacementModel),
            type: "button",
            children: "Switch model",
          }),
          jsx.jsx("button", {
            onClick: onDismiss,
            type: "button",
            children: "Dismiss",
          }),
        ],
      }),
    ],
  });
  return ComposerAnnouncementSlot == null
    ? content
    : jsx.jsx(ComposerAnnouncementSlot, {
        area: "task",
        candidates: [{ content, isEligible: true, isLoading: false }],
      });
}

function initializeTaskAnnouncementCandidates(): void {
  if (jsx != null) return;
  jsx = typeof jsxRuntimeExport === "function" ? jsxRuntimeExport() : jsxRuntimeExport;
}

initializeTaskAnnouncementCandidates();

export { TaskAnnouncementCandidates };
