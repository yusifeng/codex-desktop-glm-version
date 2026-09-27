import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

export interface SettingsRowDisclosureProps {
  children: unknown;
  content: unknown;
  contentId: string;
  expanded: boolean;
}

let jsx: JsxRuntime;

function SettingsRowDisclosure(props: SettingsRowDisclosureProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("div", {
    className: "contents",
    children: [
      props.children,
      props.expanded
        ? runtime.jsx("div", {
            id: props.contentId,
            className: "contents",
            children: props.content,
          })
        : null,
    ],
  });
}

function initializeSettingsRowDisclosure(): void {
  jsx = getJsxRuntime();
}
function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

export { initializeSettingsRowDisclosure as n, SettingsRowDisclosure as t };
