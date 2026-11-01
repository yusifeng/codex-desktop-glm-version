import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as initializeAnsiBlock, t as AnsiBlock } from "@rchunk/ansi-block";
import {
  n as initializeShellLabel,
  t as detectShell,
} from "@rchunk/shell-label";

type StateUpdater<Value> = Value | ((previous: Value) => Value);
interface ReactRuntime {
  useEffect(
    effect: () => void | (() => void),
    dependencies: readonly unknown[],
  ): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(
    initialValue: Value | (() => Value),
  ): [Value, (next: StateUpdater<Value>) => void];
}
interface ShellContainerProps {
  command: string;
  cwd?: string;
  footer?: unknown;
  isInProgress?: boolean;
  output: string;
  surface?: "default" | "plain";
}
interface ShellOutputProps {
  command: string;
  cwd?: string;
  embeddedAppearance?: "default" | "plain";
  isInProgress?: boolean;
  output: string;
  shellName?: string;
  variant?: "default" | "embedded";
}
interface ShellFooterProps {
  exitCode?: number;
  isInProgress?: boolean;
  isSuccess?: boolean;
  wasInterrupted?: boolean;
}
interface ScrollFades {
  bottom: boolean;
  top: boolean;
}

let jsx: JsxRuntime;
let React: ReactRuntime;

function ExpandIcon(props: Record<string, unknown> = {}): unknown {
  return jsx.jsx("svg", {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    ...props,
    children: jsx.jsx("path", {
      d: "M16.03 3.03 12.33 6.73V3a.665.665 0 0 0-1.33 0v5.33c0 .37.3.67.67.67H17a.665.665 0 0 0 0-1.33h-3.73l3.7-3.7a.665.665 0 0 0-.94-.94ZM8.995 17v-3.73l-3.7 3.7a.665.665 0 1 1-.94-.94l3.7-3.7H4.33a.665.665 0 0 1 0-1.33h5.33c.37 0 .67.3.67.67V17a.665.665 0 0 1-1.33 0Z",
      fill: "currentColor",
    }),
  });
}

function unwrapQuotedCommand(value: string): string {
  let command = value.trim();
  let changed = true;
  while (changed) {
    changed = false;
    if (command.startsWith("$'") && command.endsWith("'")) {
      command = command.slice(2, -1).replace(/\\'/g, "'");
      changed = true;
      continue;
    }
    if (
      (command.startsWith("'") && command.endsWith("'")) ||
      (command.startsWith('"') && command.endsWith('"'))
    ) {
      const doubleQuoted = command.startsWith('"');
      command = command.slice(1, -1).replace(/'"'"'/g, "'");
      if (doubleQuoted) command = command.replace(/\\"/g, '"');
      changed = true;
    }
  }
  return command;
}

function stripPromptAndOuterQuotes(value: string): string {
  let command = value
    .trim()
    .replace(/^\$\s+/, "")
    .replace(/'"'"'/g, "'");
  let changed = true;
  while (changed) {
    changed = false;
    if (
      (command.startsWith("'") && command.endsWith("'")) ||
      (command.startsWith('"') && command.endsWith('"'))
    ) {
      command = command.slice(1, -1).trim();
      changed = true;
    }
  }
  return command.trim();
}

function normalizeShellCommand(value: string): string {
  const normalized = unwrapQuotedCommand(stripPromptAndOuterQuotes(value));
  const wrapped =
    /^(?:\/bin\/zsh|\/bin\/bash|zsh|bash)\s+-lc\s+([\s\S]+)$/.exec(normalized);
  if (wrapped != null)
    return stripPromptAndOuterQuotes(
      unwrapQuotedCommand(wrapped[1]?.trim() ?? ""),
    );
  const embedded =
    /(?:\/bin\/zsh|\/bin\/bash|zsh|bash)\s+-lc\s+([\s\S]+)$/.exec(value);
  return stripPromptAndOuterQuotes(
    embedded == null
      ? normalized
      : unwrapQuotedCommand(embedded[1]?.trim() ?? ""),
  );
}

function shellLabel(command: string): string {
  return detectShell(command) ?? "Shell";
}

function updateScrollFades(element: HTMLDivElement | null): ScrollFades {
  if (element == null) return { bottom: false, top: false };
  const maximum = element.scrollHeight - element.clientHeight;
  const scrollable = maximum > 1;
  return {
    top: scrollable && -element.scrollTop < maximum - 1,
    bottom: scrollable && element.scrollTop < -1,
  };
}

function copyText(value: string): Promise<void> {
  return navigator.clipboard.writeText(value);
}

function ShellOutput({
  command,
  cwd,
  embeddedAppearance = "default",
  isInProgress = false,
  output,
  shellName,
  variant = "default",
}: ShellOutputProps): unknown {
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);
  const [expandedCommand, setExpandedCommand] = React.useState<string | null>(
    null,
  );
  const [scrollFades, setScrollFades] = React.useState<ScrollFades>({
    bottom: false,
    top: false,
  });
  const outputRef = React.useRef<HTMLDivElement | null>(null);
  const normalizedCommand = normalizeShellCommand(command);
  const shell = shellName ?? shellLabel(command);
  const embedded = variant === "embedded";
  const plain = embedded && embeddedAppearance === "plain";
  const outputText = /\S/.test(output)
    ? output
    : isInProgress
      ? ""
      : "No output";
  const refreshScrollFades = (): void =>
    setScrollFades((current) => {
      const next = updateScrollFades(outputRef.current);
      return current.top === next.top && current.bottom === next.bottom
        ? current
        : next;
    });
  React.useEffect(() => {
    const frame =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(refreshScrollFades)
        : null;
    return () => {
      if (frame != null && typeof cancelAnimationFrame === "function")
        cancelAnimationFrame(frame);
    };
  }, [output]);
  const copyAll = async (): Promise<void> => {
    await copyText([`$ ${command}`, output].filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1_500);
  };
  const commandBlock =
    embedded && normalizedCommand.length > 0
      ? jsx.jsxs("div", {
          className: "group/command relative px-2 pt-2 pe-6",
          children: [
            jsx.jsxs("div", {
              "aria-label": `$ ${normalizedCommand}`,
              className: `cursor-interaction whitespace-pre-wrap break-words font-code ${expandedCommand === normalizedCommand ? "" : "line-clamp-2"}`,
              role: "button",
              tabIndex: 0,
              onClick: () => setExpandedCommand(normalizedCommand),
              onKeyDown: (event: { key: string; preventDefault(): void }) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setExpandedCommand(normalizedCommand);
                }
              },
              children: [
                jsx.jsx("span", {
                  className: "me-[1ch] text-tertiary",
                  children: "$",
                }),
                normalizedCommand,
              ],
            }),
            jsx.jsx("button", {
              type: "button",
              "aria-label": "Copy command",
              onClick: () => void copyText(normalizedCommand),
              children: "Copy command",
            }),
          ],
        })
      : null;
  const outputBlock = jsx.jsxs("div", {
    className: "group/output relative min-h-[1.25rem]",
    children: [
      jsx.jsx("div", {
        ref: outputRef,
        onScroll: refreshScrollFades,
        className: `vertical-scroll-fade-mask max-h-36 overflow-x-auto overflow-y-auto whitespace-pre font-code ${plain ? "text-default" : "text-codex-description"}`,
        children: jsx.jsx(AnsiBlock, {
          className: embedded
            ? "text-codex-description"
            : "text-tertiary opacity-80",
          children: outputText,
        }),
      }),
      jsx.jsx("button", {
        type: "button",
        "aria-label": "Copy output",
        onClick: () => void copyText(output),
        children: "Copy output",
      }),
      variant === "default" && scrollFades.top
        ? jsx.jsx("div", {
            "data-scroll-fade": "top",
            className: "pointer-events-none absolute inset-x-0 top-0 h-6",
          })
        : null,
      variant === "default" && scrollFades.bottom
        ? jsx.jsx("div", {
            "data-scroll-fade": "bottom",
            className: "pointer-events-none absolute inset-x-0 bottom-0 h-6",
          })
        : null,
    ],
  });
  return jsx.jsxs("div", {
    className: `flex flex-col overflow-clip ${variant === "default" ? "rounded-lg border border-default" : "rounded-none border-none"}`,
    children: [
      embedded && !plain
        ? jsx.jsx("div", {
            className: "px-2 py-1 text-sm text-codex-description",
            children: shell,
          })
        : null,
      variant === "default"
        ? jsx.jsxs("header", {
            className:
              "flex items-center justify-between bg-surface-secondary ps-2 text-sm",
            children: [
              jsx.jsxs("div", {
                children: [
                  shell,
                  cwd == null
                    ? null
                    : jsx.jsx("span", {
                        "aria-label": `cwd ${cwd}`,
                        children: cwd,
                      }),
                ],
              }),
              jsx.jsxs("div", {
                children: [
                  jsx.jsx("button", {
                    type: "button",
                    "aria-label": copied
                      ? "Copied shell contents"
                      : "Copy shell contents",
                    onClick: () => void copyAll(),
                    children: copied ? "Copied" : "Copy",
                  }),
                  jsx.jsx("button", {
                    type: "button",
                    "aria-label": expanded ? "Collapse shell" : "Expand shell",
                    onClick: () => setExpanded((value) => !value),
                    children: expanded ? "Collapse" : "Expand",
                  }),
                ],
              }),
            ],
          })
        : null,
      expanded || embedded
        ? jsx.jsxs("div", {
            className: "relative overflow-hidden",
            children: [commandBlock, outputBlock],
          })
        : null,
    ],
  });
}

function ShellContainer({
  command,
  cwd,
  footer,
  isInProgress = false,
  output,
  surface = "default",
}: ShellContainerProps): unknown {
  return jsx.jsxs("div", {
    className: `group flex flex-col overflow-hidden rounded-lg border border-strong ${surface === "plain" ? "bg-surface" : "bg-secondary-soft-alpha"}`,
    "data-surface": surface,
    children: [
      jsx.jsx(ShellOutput, {
        variant: "embedded",
        cwd,
        command,
        output,
        isInProgress,
        embeddedAppearance: surface,
      }),
      footer,
    ],
  });
}

function ShellFooter({
  exitCode,
  isInProgress = false,
  isSuccess = false,
  wasInterrupted = false,
}: ShellFooterProps): unknown {
  if (isInProgress)
    return jsx.jsx("div", {
      className: "px-2.5 pt-0.5 pb-1",
      "aria-label": "Command running",
    });
  if (wasInterrupted)
    return jsx.jsx("div", {
      className: "px-2.5 pt-0.5 pb-1 text-tertiary",
      children: jsx.jsx("span", { className: "ms-auto", children: "Stopped" }),
    });
  return jsx.jsx("div", {
    className: "px-2.5 pt-0.5 pb-1 text-tertiary",
    children: jsx.jsx("span", {
      className: "ms-auto",
      children: isSuccess ? "Success" : `Exit code ${exitCode ?? "unknown"}`,
    }),
  });
}

const ExecShellContainer = Object.assign(ShellContainer, {
  Footer: ShellFooter,
});
function initializeExecShellContainer(): void {
  React = getReactRuntime() as ReactRuntime;
  initializeAnsiBlock();
  initializeShellLabel();
  jsx = getJsxRuntime();
}
initializeExecShellContainer();
export {
  initializeExecShellContainer as n,
  ExpandIcon as r,
  ExecShellContainer as t,
};
