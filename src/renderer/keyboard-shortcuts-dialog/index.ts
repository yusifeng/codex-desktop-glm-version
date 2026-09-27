import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/command-messages";
import "@rchunk/keyboard-shortcut-command-order";
import "@rchunk/keyboard-shortcuts-gate";
import "@rchunk/keyboard-shortcuts-search-input";
import "@rchunk/rolldown-runtime";

export interface KeyboardShortcutItem {
  description?: string;
  id: string;
  section: string;
  shortcutLabels: string[];
  title: string;
}

export interface KeyboardShortcutsDialogProps {
  commands?: readonly KeyboardShortcutItem[];
  onOpenChange(open: boolean): void;
}

const defaultCommands: KeyboardShortcutItem[] = [
  { id: "new-task", section: "General", title: "New task", shortcutLabels: ["⌘", "N"] },
  { id: "settings", section: "General", title: "Open settings", shortcutLabels: ["⌘", ","] },
  { id: "search", section: "Navigation", title: "Search", shortcutLabels: ["⌘", "K"] },
];

let React: ReactRuntime;
let jsx: JsxRuntime;

function KeyboardShortcutsDialog(props: KeyboardShortcutsDialogProps): unknown {
  const [query, setQuery] = React.useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const commands = (props.commands ?? defaultCommands).filter((command) =>
    normalizedQuery === "" ||
    `${command.title} ${command.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery),
  );
  const sections = [...new Set(commands.map((command) => command.section))];
  return jsx.jsxs("dialog", {
    open: true,
    "aria-label": "Keyboard shortcuts",
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsx("h2", { children: "Keyboard shortcuts" }),
          jsx.jsx("button", { type: "button", onClick: () => props.onOpenChange(false), children: "Close" }),
        ],
      }),
      jsx.jsx("input", {
        "aria-label": "Search keyboard shortcuts",
        value: query,
        onChange: (event: { currentTarget: { value: string } }) => setQuery(event.currentTarget.value),
      }),
      commands.length === 0
        ? jsx.jsx("p", { role: "status", children: "No shortcuts found" })
        : sections.map((section) =>
            jsx.jsxs("section", {
              children: [
                jsx.jsx("h3", { children: section }),
                jsx.jsx("ul", {
                  children: commands.filter((command) => command.section === section).map((command) =>
                    jsx.jsxs("li", {
                      children: [
                        jsx.jsx("span", { children: command.title }),
                        jsx.jsx("kbd", { children: command.shortcutLabels.join(" ") }),
                      ],
                    }, command.id),
                  ),
                }),
              ],
            }, section),
          ),
    ],
  });
}

function initializeKeyboardShortcutsDialog(): void {
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initializeKeyboardShortcutsDialog();

export { KeyboardShortcutsDialog };
