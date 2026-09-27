import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-sites";
import "@rchunk/rolldown-runtime";

export type ArtifactKind = "document" | "presentation" | "spreadsheet" | "site";

export interface CreateOutputActions {
  availableArtifactKinds: readonly ArtifactKind[];
  createArtifact(kind: ArtifactKind): boolean | void;
  isLoadingApps?: boolean;
  appsError?: unknown;
  retryApps?(): void;
}

export interface ChatGptCreateOutputMenuProps {
  composerActions: CreateOutputActions;
  defaultOpen?: boolean;
}

const labels: Record<ArtifactKind, string> = {
  document: "Document",
  presentation: "Presentation",
  spreadsheet: "Spreadsheet",
  site: "Site",
};

let React: ReactRuntime;
let jsx: JsxRuntime;

function ChatGptCreateOutputMenu(props: ChatGptCreateOutputMenuProps): unknown {
  const [open, setOpen] = React.useState(props.defaultOpen ?? false);
  const actions = props.composerActions;
  return jsx.jsxs("div", {
    className: "create-output-menu",
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-expanded": open,
        "aria-label": "Create file or site",
        onClick: () => setOpen(!open),
        children: "+",
      }),
      open
        ? jsx.jsxs("menu", {
            children: [
              (Object.keys(labels) as ArtifactKind[]).map((kind) => {
                const available = actions.availableArtifactKinds.includes(kind);
                return jsx.jsx("li", {
                  children: jsx.jsx("button", {
                    type: "button",
                    disabled: !available,
                    onClick: () => {
                      if (!available) return;
                      actions.createArtifact(kind);
                      setOpen(false);
                    },
                    children: labels[kind],
                  }),
                }, kind);
              }),
              actions.isLoadingApps
                ? jsx.jsx("li", { role: "status", children: "Loading apps…" })
                : null,
              actions.appsError
                ? jsx.jsx("li", {
                    children: jsx.jsx("button", {
                      type: "button",
                      onClick: actions.retryApps,
                      children: "Retry loading apps",
                    }),
                  })
                : null,
            ],
          })
        : null,
    ],
  });
}

function initializeCreateOutputMenu(): void {
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeCreateOutputMenu();

export { ChatGptCreateOutputMenu };
