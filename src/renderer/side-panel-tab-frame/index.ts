import "@rchunk/rolldown-runtime";
import { FX as initializeMaitaiRuntime, I3 as getJsxRuntime, LX as readScopedValue, lY as createConversationRoute, mZ as resolveRecipient, wL as initializeUtilities } from "@rchunk/app-shared";
// @ts-expect-error The release app-initial surface is declared incrementally by the shared manifest owner.
import { Ftn as initializeMcpExtensionFrame, Mtn as resolveConversationRoute, Rht as initializeThreadRecipients, kht as activeThreadRecipient } from "@rchunk/app-initial";
import { n as initializeViewFrame, t as ViewFrame } from "@rchunk/view-frame";
import { n as initializeFileViewerFrame, t as FileViewerFrame } from "@rchunk/file-viewer-frame";

interface LocalRecipient {
  conversationId: string;
  kind: "local";
}

interface OtherRecipient {
  kind: "other";
}

type Recipient = LocalRecipient | OtherRecipient | Record<string, unknown>;

interface FileViewerContent {
  path: string;
  type: "file-viewer";
  view: unknown;
}

interface ViewContent extends Record<string, unknown> {
  sourceThreadId?: string | null;
  type: "view";
}

export interface McpExtensionSidePanelTabFrameProps {
  content: FileViewerContent | ViewContent;
  tabState: { mcpAppId?: string | null };
}

let initialized = false;
let jsxRuntime: {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
};

function initializeSidePanelTabFrame(): void {
  if (initialized) return;
  initialized = true;
  initializeMaitaiRuntime();
  initializeUtilities();
  initializeThreadRecipients();
  initializeMcpExtensionFrame();
  initializeFileViewerFrame();
  initializeViewFrame();
  jsxRuntime = getJsxRuntime();
}

function McpExtensionSidePanelTabFrame({ content, tabState }: McpExtensionSidePanelTabFrameProps): unknown {
  const currentRecipient = readScopedValue(activeThreadRecipient) as { value: Recipient };
  let recipient: unknown = currentRecipient.value.kind === "other" ? null : currentRecipient;
  const sourceThreadId = content.type === "view" ? content.sourceThreadId : null;

  if (
    sourceThreadId != null &&
    (currentRecipient.value.kind !== "local" || sourceThreadId !== currentRecipient.value.conversationId)
  ) {
    const mapRecipient = resolveRecipient as unknown as (
      value: unknown,
      signal: unknown,
      route: unknown,
    ) => unknown;
    recipient = mapRecipient(
      currentRecipient,
      activeThreadRecipient,
      resolveConversationRoute(currentRecipient, createConversationRoute(sourceThreadId)),
    );
  }

  if (content.type === "file-viewer") {
    return jsxRuntime.jsx(FileViewerFrame, {
      recipient,
      lifetime: "thread",
      mcpAppId: tabState.mcpAppId,
      filePath: content.path,
      fileViewer: content.view,
    });
  }

  const { type: _type, ...viewProps } = content;
  return jsxRuntime.jsx(ViewFrame, {
    lifetime: "thread",
    ...viewProps,
    mcpAppId: tabState.mcpAppId,
    recipient,
  });
}

initializeSidePanelTabFrame();

export { McpExtensionSidePanelTabFrame };
