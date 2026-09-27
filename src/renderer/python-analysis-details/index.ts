import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  $d as CodeBlock,
  I3 as getJsxRuntime,
  K2 as initializeIntlComponents,
  Y2 as FormattedMessage,
  ef as initializeCodeBlock,
  h4 as initializeClassNames,
  m4 as classNames,
} from "@rchunk/app-shared";

interface PythonOutput { kind: "error" | "result" | "stderr" | "stdout"; text: string; }
interface PythonAnalysisItem { code: string; output: PythonOutput[]; }
const jsx = getJsxRuntime();

function PythonOutputDetails({ output }: { output: PythonOutput[] }): unknown {
  if (output.length === 0) return null;
  const streams = output.filter((item) => item.kind === "stdout" || item.kind === "stderr");
  const results = output.filter((item) => item.kind === "result" || item.kind === "error");
  const streamBlock = streams.length === 0 ? null : jsx.jsxs("div", {
    className: "rounded-3xl bg-execution-output p-4 text-xs",
    children: [
      jsx.jsx("div", {
        className: "mb-1 text-execution-output-label select-none",
        children: jsx.jsx(FormattedMessage, {
          id: "chatgpt.pythonExecution.streamsLabel", defaultMessage: "STDOUT/STDERR",
          description: "Short label above printed output and warnings in expanded Python analysis in a ChatGPT conversation. STDOUT and STDERR are the technical names for standard output and standard error.",
        }),
      }),
      jsx.jsx("pre", {
        className: "overflow-auto font-mono text-sm/6 text-execution-output outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        dir: "ltr", tabIndex: 0,
        children: streams.map((item, index) => jsx.jsx("span", {
          className: item.kind === "stderr" ? "text-execution-output-error" : undefined,
          children: item.text,
        }, index)),
      }),
    ],
  });
  return jsx.jsxs("div", {
    className: "font-normal",
    children: [streamBlock, results.map((item, index) => jsx.jsxs("div", {
      className: item.kind === "error"
        ? "border-t border-default bg-execution-traceback"
        : "rounded-3xl bg-execution-output p-4 text-xs",
      children: [
        item.kind === "result" ? jsx.jsx("div", {
          className: "mb-1 text-execution-output-label select-none",
          children: jsx.jsx(FormattedMessage, {
            id: "chatgpt.pythonExecution.resultLabel", defaultMessage: "Result",
            description: "Short label above the final value returned by expanded Python analysis in a ChatGPT conversation",
          }),
        }) : null,
        jsx.jsx("pre", {
          className: classNames(
            "overflow-auto font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            item.kind === "error"
              ? "max-h-64 border-s-4 border-text-danger p-2 text-xs/4 text-execution-traceback"
              : "text-sm/6 text-execution-output",
          ),
          dir: "ltr", tabIndex: 0, children: item.text,
        }),
      ],
    }, index))],
  });
}

function PythonAnalysisDetails({ item }: { item: PythonAnalysisItem }): unknown {
  return jsx.jsxs("div", {
    className: "flex min-w-0 flex-col gap-2",
    children: [
      item.code.length > 0 ? jsx.jsx(CodeBlock, {
        content: item.code, language: "python",
        title: jsx.jsx(FormattedMessage, {
          id: "chatgpt.pythonExecution.language", defaultMessage: "Python",
          description: "Programming language heading above the read-only source of a Python analysis",
        }),
      }) : null,
      jsx.jsx(PythonOutputDetails, { output: item.output }),
    ],
  });
}

function initializePythonOutputDetails(): void {
  initializeCompilerRuntime(); initializeClassNames(); initializeIntlComponents();
}
function initializePythonAnalysisDetails(): void {
  initializeCompilerRuntime(); initializeIntlComponents(); initializeCodeBlock(); initializePythonOutputDetails();
}

export { initializePythonAnalysisDetails as n, PythonAnalysisDetails as t };
