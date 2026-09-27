import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/connect-plugins-submenu-item";
import "@rchunk/rolldown-runtime";

export interface AddSourceActions {
  canOpenFileDialog: boolean;
  canOpenLibraryPicker: boolean;
  openFileDialog(): boolean | void;
  openLibraryPicker(): boolean | void;
  openPluginDirectory?(): void;
}

export interface ChatGptAddSourceMenuProps {
  composerActions: AddSourceActions;
  conversationId: string;
  defaultOpen?: boolean;
  shouldBlockExternalEgress?: boolean;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

function ChatGptAddSourceMenu(props: ChatGptAddSourceMenuProps): unknown {
  const [open, setOpen] = React.useState(props.defaultOpen ?? false);
  const actions = props.composerActions;
  const select = (action: () => boolean | void): void => {
    action();
    setOpen(false);
  };
  return jsx.jsxs("div", {
    className: "add-source-menu",
    "data-conversation-id": props.conversationId,
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-expanded": open,
        "aria-label": "Add source",
        onClick: () => setOpen(!open),
        children: "+",
      }),
      open
        ? jsx.jsxs("menu", {
            children: [
              !props.shouldBlockExternalEgress && actions.openPluginDirectory
                ? jsx.jsx("li", {
                    children: jsx.jsx("button", {
                      type: "button",
                      onClick: () => select(actions.openPluginDirectory!),
                      children: "Connect plugins",
                    }),
                  })
                : null,
              jsx.jsx("li", {
                children: jsx.jsx("button", {
                  type: "button",
                  disabled: !actions.canOpenFileDialog,
                  onClick: () => select(actions.openFileDialog),
                  children: "Add photos & files",
                }),
              }),
              actions.canOpenLibraryPicker
                ? jsx.jsx("li", {
                    children: jsx.jsx("button", {
                      type: "button",
                      onClick: () => select(actions.openLibraryPicker),
                      children: "Add from library",
                    }),
                  })
                : null,
            ],
          })
        : null,
    ],
  });
}

function initializeAddSourceMenu(): void {
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeAddSourceMenu();

export { ChatGptAddSourceMenu };
