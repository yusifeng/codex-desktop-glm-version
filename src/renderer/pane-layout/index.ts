// Shared artifact-pane layout adapter. Release chunk: pane-layout-da45b15f9a56.js.
import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface PaneLayoutOptions {
  header: unknown;
  headerPlacement: unknown;
  content: unknown;
}

interface PaneLayoutDescriptor {
  headerRows: Array<{
    id: "artifact-header";
    height: "content";
    placement: unknown;
    content: unknown;
  }>;
  content: unknown;
}

type RenderPaneLayout<Result> = (descriptor: PaneLayoutDescriptor) => Result;

let jsxRuntime: JsxRuntime;

function renderPaneLayout<Result>(
  renderLayout: RenderPaneLayout<Result>,
  { header, headerPlacement, content }: PaneLayoutOptions,
): Result {
  return renderLayout({
    headerRows: [{ id: "artifact-header", height: "content", placement: headerPlacement, content: header }],
    content: jsxRuntime.jsx("div", {
      className: "flex h-full min-h-0 min-w-0 flex-col",
      children: content,
    }),
  });
}

function initializePaneLayout(): void {
  jsxRuntime = getJsxRuntime();
}

export { renderPaneLayout as n, initializePaneLayout as t };
