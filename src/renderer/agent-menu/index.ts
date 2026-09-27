import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/duplicate-agent";
import "@rchunk/rolldown-runtime";
import "@rchunk/workspace-agent-detail-query";

export interface WorkspaceAgentSummary {
  icon?: string | null;
  id: string;
  name: string;
}

export interface AgentMenuProps {
  agent: WorkspaceAgentSummary;
  isPublished: boolean;
  isPinned?: boolean | null;
  canDelete?: boolean;
  onCopyLink?(agentId: string): Promise<boolean> | boolean;
  onDelete?(agentId: string): void;
  onDeleted?(): void;
  onDuplicate?(agent: WorkspaceAgentSummary): void;
  onPinChange?(agent: WorkspaceAgentSummary, pinned: boolean): Promise<void> | void;
  onPinError?(failed: boolean): void;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

function AgentMenu(props: AgentMenuProps): unknown {
  const [open, setOpen] = React.useState(false);
  const [pendingPin, setPendingPin] = React.useState(false);
  const updatePin = async (): Promise<void> => {
    if (props.isPinned == null || pendingPin) return;
    props.onPinError?.(false);
    setPendingPin(true);
    try {
      await props.onPinChange?.(props.agent, !props.isPinned);
    } catch {
      props.onPinError?.(true);
    } finally {
      setPendingPin(false);
    }
  };
  return jsx.jsxs("div", {
    className: "agent-menu",
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-expanded": open,
        "aria-label": "More actions",
        onClick: () => setOpen(!open),
        children: "…",
      }),
      open
        ? jsx.jsxs("menu", {
            children: [
              props.isPublished
                ? jsx.jsxs(jsx.Fragment, {
                    children: [
                      jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: () => props.onCopyLink?.(props.agent.id), children: "Copy link" }) }),
                      jsx.jsx("li", { children: jsx.jsx("button", { type: "button", disabled: props.isPinned == null || pendingPin, onClick: updatePin, children: props.isPinned ? "Unpin from sidebar" : "Pin to sidebar" }) }),
                    ],
                  })
                : null,
              jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: () => props.onDuplicate?.(props.agent), children: "Duplicate" }) }),
              props.canDelete
                ? jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: () => props.onDelete?.(props.agent.id), children: "Delete" }) })
                : null,
            ],
          })
        : null,
    ],
  });
}

function initializeAgentMenu(): void {
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeAgentMenu();

export { initializeAgentMenu as n, AgentMenu as t };
