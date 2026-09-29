import { $3 as initializeSharedRuntime, H3 as initializePreloadRuntime, I3 as getJsxRuntime, K2 as initializeUiRuntime, V3 as loadWithPreload, Y2 as FormattedMessage, e6 as getReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { n as initializeArtifactLayout, t as ArtifactLayout } from "@rchunk/artifact-layout";
import { n as createPaneLayoutRenderer, t as initializePaneLayout } from "@rchunk/pane-layout";
import "@rchunk/rolldown-runtime";

interface ReactRuntime { Suspense: unknown; lazy(load: () => Promise<{ default: (props: Record<string, unknown>) => unknown }>): (props: Record<string, unknown>) => unknown }
export interface ArtifactTabContentShellProps extends Record<string, unknown> { renderSlots?: unknown }

initializeSharedRuntime();
const React = getReactRuntime() as unknown as ReactRuntime;
initializeUiRuntime();
initializeArtifactLayout();
initializePaneLayout();
const jsx: JsxRuntime = getJsxRuntime();
initializePreloadRuntime();

const LazyArtifactTabContent = React.lazy(async () => {
  const loaded = await loadWithPreload(() => import("@rchunk/artifact-tab-content-electron-entry"), [], import.meta.url);
  return { default: loaded.ArtifactTabContent };
});

function LoadingArtifactTab(): unknown {
  return jsx.jsx("div", { className: "flex h-full items-center justify-center px-6 text-center text-sm text-tertiary", children: jsx.jsx(FormattedMessage, { id: "artifactTab.loading", defaultMessage: "Loading preview...", description: "Loading state shown while an artifact tab preview is mounting" }) });
}

function ArtifactTabContentShell(props: ArtifactTabContentShellProps): unknown {
  const { renderSlots, ...contentProps } = props;
  const renderLayout = renderSlots == null ? undefined : (parts: unknown) => createPaneLayoutRenderer(renderSlots, parts);
  const fallback = jsx.jsx(ArtifactLayout, { header: null, content: jsx.jsx(LoadingArtifactTab, {}), renderLayout });
  return jsx.jsx(React.Suspense, { fallback, children: jsx.jsx(LazyArtifactTabContent, { ...contentProps, renderLayout }) });
}

export { ArtifactTabContentShell };
