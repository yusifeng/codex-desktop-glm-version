import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

const runtime = runtimeChunk as unknown as { n(initializer: () => void): () => void };
const sharedRuntime = appSharedChunk as unknown as {
  $3(): void;
  I3(): JsxRuntime;
};
const { n: once } = runtime;
const { $3: initializeRuntimeLazy, I3: getJsxRuntime } = sharedRuntime;

let jsx: JsxRuntime;
const initializeThreadMcpAppSidePanelTab = once(() => {
  initializeRuntimeLazy();
  jsx = getJsxRuntime();
});

function McpAppThreadSidePanelTab({ onPanelElementChange }: { onPanelElementChange(element: unknown): void }): unknown {
  return jsx.jsx("div", {
    className: "relative h-full min-h-0",
    children: jsx.jsx("div", {
      ref: onPanelElementChange,
      "data-mcp-app-side-panel-frame-container": "true",
      className: "h-full min-h-0 w-full",
    }),
  });
}

initializeThreadMcpAppSidePanelTab();

export { McpAppThreadSidePanelTab };
