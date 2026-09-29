import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, h4 as initializeJsxRuntime, m4 as classNames } from "@rchunk/app-shared";
import { n as initializeLearningBlockKatex, t as LearningBlockKatex } from "@rchunk/learning-block-katex";

export interface ControlPanelProps {
  children?: unknown;
  screenReaderContent?: unknown;
}

export interface CaptionPanelProps extends ControlPanelProps {
  reserveLines?: 1 | 2 | 3;
}

export interface CaptionTextProps {
  children?: unknown;
  content?: unknown;
  format?: "katex" | "text";
  variant?: "body" | "title";
}

const reservedLineClasses: Record<1 | 2 | 3, string> = {
  1: "min-h-5",
  2: "min-h-10",
  3: "min-h-[60px]",
};

let initialized = false;
let jsxRuntime: {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
};

function initializeControlPanel(): void {
  if (initialized) return;
  initialized = true;
  initializeJsxRuntime();
  initializeLearningBlockKatex();
  jsxRuntime = getJsxRuntime();
}

function ControlPanel({ children, screenReaderContent }: ControlPanelProps): unknown {
  return jsxRuntime.jsxs("div", {
    className: "control-panel flex max-w-full min-w-0 flex-col gap-3 max-sm:pb-3 sm:pe-3",
    children: [
      children,
      screenReaderContent
        ? jsxRuntime.jsx("div", { className: "sr-only", children: screenReaderContent })
        : null,
    ],
  });
}

function renderCaptionContent(content: unknown, format: CaptionTextProps["format"]): unknown {
  return format === "katex"
    ? jsxRuntime.jsx(LearningBlockKatex, { latex: String(content) })
    : content;
}

function CaptionLine({ content, format, variant }: Required<Pick<CaptionTextProps, "content" | "variant">> & Pick<CaptionTextProps, "format">): unknown {
  return jsxRuntime.jsx("span", {
    className: "relative block max-w-full min-w-0",
    children: jsxRuntime.jsx("span", {
      "data-learning-block-caption-line": "",
      className: classNames(
        "_captionLine_1d98y_1",
        "block min-w-0 max-w-full break-words text-center font-serif font-normal tracking-normal whitespace-normal [&.katex]:text-[1em] [&_.katex]:text-[1em]",
        variant === "title"
          ? "text-token-text-primary text-base leading-6"
          : "text-token-text-secondary text-[13px] leading-5",
      ),
      children: renderCaptionContent(content, format),
    }),
  });
}

function CaptionPanel({ children, reserveLines, screenReaderContent }: CaptionPanelProps): unknown {
  return jsxRuntime.jsxs("div", {
    className: classNames(
      "caption-panel flex max-w-full min-w-0 flex-col justify-end gap-2 sm:pe-3",
      reserveLines == null ? undefined : reservedLineClasses[reserveLines],
    ),
    children: [
      children,
      screenReaderContent
        ? jsxRuntime.jsx("div", { className: "sr-only", children: screenReaderContent })
        : null,
    ],
  });
}

function CaptionText({ format = "text", variant = "body", content, children }: CaptionTextProps): unknown {
  const resolvedContent = children != null && children !== false ? children : content;
  if (resolvedContent == null || resolvedContent === false) return null;
  return jsxRuntime.jsx("div", {
    className: classNames(
      "caption-text max-w-full min-w-0 overflow-visible",
      variant === "title" ? "text-base leading-6" : "text-[13px] leading-5",
    ),
    children: jsxRuntime.jsx(CaptionLine, { content: resolvedContent, format, variant }),
  });
}

function ControlPanelDivider(): unknown {
  return jsxRuntime.jsx("div", {
    className: "min-w-0 border-t border-black/8 dark:border-white/10",
  });
}

export {
  initializeControlPanel as a,
  ControlPanelDivider as i,
  CaptionText as n,
  ControlPanel as r,
  CaptionPanel as t,
};
