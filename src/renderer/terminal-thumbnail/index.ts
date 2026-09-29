import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/terminal-panel-bootstrap";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  IK: pathsEqual,
  RI: initializePathRuntime,
  VI: normalizePath,
  WK: joinPath,
  kC: TerminalIcon,
  lw: initializeTerminalIcon,
} = appSharedChunk;
const {
  Xd: ConversationThumbnail,
  Zd: initializeConversationThumbnail,
} = appInitialChunk as typeof appInitialChunk & {
  Xd: (props: Record<string, unknown>) => unknown;
  Zd: () => void;
};

export interface TerminalOutputSpan {
  style?: Record<string, string | number>;
  text: string;
}

export interface TerminalThumbnailProps {
  cwd?: string | null;
  homeDirectory?: string | null;
  outputTail?: readonly TerminalOutputSpan[] | null;
  title: string;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;

function getTerminalSubtitle(
  title: string,
  cwd?: string | null,
  homeDirectory?: string | null,
): string | null {
  if (cwd == null) return null;
  let normalizedTitle = normalizePath(title.trim());
  if (
    homeDirectory != null &&
    (normalizedTitle === "~" || normalizedTitle.startsWith("~/"))
  ) {
    normalizedTitle = joinPath(homeDirectory, normalizedTitle.slice(2));
  }
  return pathsEqual(normalizedTitle, cwd) ? null : cwd;
}

function TerminalThumbnail({
  title,
  cwd,
  homeDirectory,
  outputTail,
}: TerminalThumbnailProps): unknown {
  initializeTerminalThumbnail();
  const subtitle = getTerminalSubtitle(title, cwd, homeDirectory);
  const outputSection = outputTail?.length
    ? {
        kind: "text",
        content: jsx.jsx("span", {
          className: "text-codex-terminal-foreground",
          "data-codex-xterm": true,
          children: outputTail.map((span, index) =>
            jsx.jsx("span", { style: span.style, children: span.text }, index),
          ),
        }),
        lines: 8,
        variant: "code",
      }
    : null;
  return jsx.jsx(ConversationThumbnail, {
    icon: jsx.jsx(TerminalIcon, {}),
    subtitle,
    title,
    sections: [outputSection],
  });
}

let initialized = false;
function initializeTerminalThumbnail(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeConversationThumbnail();
  initializeTerminalIcon();
  initializePathRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

export { initializeTerminalThumbnail as n, TerminalThumbnail as t };
