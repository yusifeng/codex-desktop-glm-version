import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

const {
  $3: initializeRuntimeLazy,
  G2: defineMessages,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  Y2: FormattedMessage,
  h4: initializeClassNames,
  m4: classNames,
} = appSharedChunk;

export interface BrowserExtensionStatus {
  isInstalled: boolean;
  isLoading: boolean;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;
let messages: ReturnType<typeof defineMessages>;

function BrowserExtensionConnectionStatusDescription({
  status,
}: {
  status: BrowserExtensionStatus;
}): unknown {
  initializeBrowserExtensionStatusDescription();
  if (status.isLoading) return jsx.jsx(FormattedMessage, { ...messages.loading });
  const indicatorClass = classNames(
    "h-2 w-2 shrink-0 rounded-full",
    status.isInstalled
      ? "bg-[var(--app-color-icon-success)]"
      : "bg-[var(--app-color-icon-error)]",
  );
  return jsx.jsxs("span", {
    className: "inline-flex max-w-full items-center gap-2",
    children: [
      jsx.jsx("span", { className: indicatorClass }),
      jsx.jsx("span", {
        className: "min-w-0 truncate",
        children: jsx.jsx(FormattedMessage, {
          ...(status.isInstalled ? messages.installed : messages.notInstalled),
        }),
      }),
    ],
  });
}

let initialized = false;
function initializeBrowserExtensionStatusDescription(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeClassNames();
  initializeIntlRuntime();
  jsx = getJsxRuntime();
  messages = defineMessages({
    installed: {
      id: "plugins.browserExtension.installed",
      defaultMessage: "Browser extension installed",
      description: "Status text shown when a browser extension is installed",
    },
    notInstalled: {
      id: "plugins.browserExtension.notInstalled",
      defaultMessage: "Browser extension not installed",
      description: "Status text shown when a browser extension is not installed",
    },
    loading: {
      id: "plugins.browserExtension.loading",
      defaultMessage: "Use the browser extension for additional control",
      description: "Status text shown while a browser extension install state is loading",
    },
  });
  initialized = true;
}

export {
  initializeBrowserExtensionStatusDescription as n,
  BrowserExtensionConnectionStatusDescription as t,
};
