// browser-profile-import-query —— 浏览器资料导入的资料源展示与查询定义。
// 原版：app/webview/assets/query-8542d2419280.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as cookiesIconChunk from "@rchunk/browser-profile-import-cookies-icon";
import * as historyIconChunk from "@rchunk/browser-profile-import-history-icon";
import * as chromeIconChunk from "@rchunk/google-chrome";
import type { JsxRuntime, MessageDescriptor } from "@rchunk/app-shared";

void runtimeChunk;

const {
  n: initializeCookiesIcon,
  t: CookiesIcon,
} = cookiesIconChunk;
const {
  n: initializeHistoryIcon,
  t: HistoryIcon,
} = historyIconChunk;
const {
  n: initializeChromeIcon,
  t: ChromeIcon,
} = chromeIconChunk;

const {
  $3: initializeJsxRuntimeLazy,
  AS: ExtensionsIcon,
  G2: defineMessages,
  I3: getJsxRuntime,
  K2: initializeIntl,
  Q3: logger,
  Z3: initializeQueryRuntime,
  lw: initializeImportIcons,
  pL: defineQueryOptions,
} = appSharedChunk;

type BrowserProfileSource = "atlas" | "chrome";
type BrowserProfileImportKind =
  | "cookies"
  | "extensions"
  | "history"
  | "passwords";

interface ImportableBrowserProfile extends Record<string, unknown> {
  appName: string;
  hasExtensions?: boolean;
  profileDirectoryName?: string;
  profileName?: string;
  profilePath: string;
  source: BrowserProfileSource;
}

interface BrowserProfileImportSignals extends Record<string, unknown> {}

interface BrowserProfileImportService {
  getImportSignals(): Promise<BrowserProfileImportSignals>;
  listImportableBrowserProfiles(): Promise<ImportableBrowserProfile[]>;
}

let jsx: JsxRuntime;
let PasswordsIcon: (props: Record<string, unknown>) => unknown;
let messages: Record<string, MessageDescriptor>;
let atlasIconUrl: string;
let queryStaleTime: number;

let dataIconsInitialized = false;
let messagesInitialized = false;
let sourceIconsInitialized = false;
let queriesInitialized = false;

function initializePasswordsIcon(): void {
  if (PasswordsIcon != null) return;
  jsx = getJsxRuntime();
  PasswordsIcon = (props) =>
    jsx.jsxs("svg", {
      width: 20,
      height: 20,
      viewBox: "0 0 20 20",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        jsx.jsx("path", {
          d: "M8.75 9.55V15.75L6.5 18.25L4.25 15.75V9.55C2.886 8.748 2 7.267 2 5.625C2 3.14 4.015 1.125 6.5 1.125C8.985 1.125 11 3.14 11 5.625C11 7.267 10.114 8.748 8.75 9.55Z",
          stroke: "currentColor",
          strokeWidth: 1.33,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }),
        jsx.jsx("circle", { cx: 6.5, cy: 5.5, r: 0.75, fill: "currentColor" }),
        jsx.jsx("path", {
          d: "M11.45 2.775C12.078 2.362 12.83 2.125 13.625 2.125C16.11 2.125 18.125 4.14 18.125 6.625C18.125 8.267 17.239 9.748 15.875 10.55V15.75L13.625 18.25L11.375 15.75V10.55C10.818 10.223 10.342 9.783 9.977 9.263",
          stroke: "currentColor",
          strokeWidth: 1.33,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }),
      ],
    });
}

function ImportDataIcon({
  className,
  kind,
}: {
  className?: string;
  kind: BrowserProfileImportKind;
}): unknown {
  switch (kind) {
    case "cookies":
      return jsx.jsx(CookiesIcon, { className });
    case "history":
      return jsx.jsx(HistoryIcon, { className });
    case "passwords":
      return jsx.jsx(PasswordsIcon, { className });
    case "extensions":
      return jsx.jsx("span", {
        className,
        children: jsx.jsx(ExtensionsIcon, {}),
      });
  }
}

function initializeImportDataIcons(): void {
  if (dataIconsInitialized) return;
  initializeJsxRuntimeLazy();
  initializeImportIcons();
  initializeCookiesIcon();
  initializeHistoryIcon();
  initializePasswordsIcon();
  jsx = getJsxRuntime();
  dataIconsInitialized = true;
}

function initializeBrowserProfileImportMessages(): void {
  if (messagesInitialized) return;
  initializeIntl();
  messages = defineMessages({
    cookies: {
      id: "settings.browserUse.profileImport.cookies",
      defaultMessage: "Cookies",
      description: "Label for importing cookies from a browser profile",
    },
    passwords: {
      id: "settings.browserUse.profileImport.passwords",
      defaultMessage: "Saved passwords",
      description: "Label for importing passwords from a browser profile",
    },
    history: {
      id: "settings.browserUse.profileImport.history",
      defaultMessage: "Browsing history",
      description: "Label for importing browsing history from a Chrome profile",
    },
    title: {
      id: "settings.browserUse.profileImport.title",
      defaultMessage: "Import from your browser",
      description: "Title for the browser profile import dialog",
    },
    extensions: {
      id: "settings.browserUse.profileImport.extensions",
      defaultMessage: "Extensions",
      description:
        "Label for importing Chrome extensions, toolbar pins, and permission choices",
    },
  });
  messagesInitialized = true;
}

function SourceIcon({
  className,
  source,
}: {
  className?: string;
  source: BrowserProfileSource;
}): unknown {
  switch (source) {
    case "atlas":
      return jsx.jsx("img", {
        "aria-hidden": true,
        alt: "",
        className,
        src: atlasIconUrl,
      });
    case "chrome":
      return jsx.jsx(ChromeIcon, { "aria-hidden": true, className });
  }
}

function ProfileSourcesIcon({
  sources,
}: {
  sources: BrowserProfileSource[];
}): unknown {
  if (sources.length === 1) {
    return jsx.jsx(SourceIcon, {
      source: sources[0],
      className: "h-6 w-6 shrink-0 rounded-[22%]",
    });
  }
  return jsx.jsxs("div", {
    className: "relative h-7 w-9 shrink-0",
    "aria-hidden": true,
    children: [
      jsx.jsx(SourceIcon, {
        className: "absolute top-0 left-0 h-6 w-6 rounded-[22%]",
        source: "atlas",
      }),
      jsx.jsx(SourceIcon, {
        className:
          "absolute right-0 bottom-0 h-6 w-6 rounded-full ring-2 ring-surface",
        source: "chrome",
      }),
    ],
  });
}

function initializeSourceIcons(): void {
  if (sourceIconsInitialized) return;
  initializeJsxRuntimeLazy();
  atlasIconUrl = new URL("atlas-app-5b67bfaeebb3.png", import.meta.url).href;
  initializeChromeIcon();
  jsx = getJsxRuntime();
  sourceIconsInitialized = true;
}

function uniqueProfileSources(
  profiles: Array<{ source: BrowserProfileSource }>,
): BrowserProfileSource[] {
  return Array.from(new Set(profiles.map((profile) => profile.source)));
}

function importableProfilesQuery(
  service: BrowserProfileImportService | null | undefined,
  enabled: boolean,
): import("@rchunk/app-shared").UseQueryOptions<ImportableBrowserProfile[]> {
  return defineQueryOptions({
    enabled,
    queryKey: ["browser-profile-import-profiles"],
    queryFn: async () => {
      if (service == null) throw Error("Browser profile import is unavailable");
      try {
        return await service.listImportableBrowserProfiles();
      } catch (error) {
        logger.error("Failed to list importable browser profiles", {
          safe: {},
        });
        throw error;
      }
    },
    retry: false,
    staleTime: queryStaleTime,
  });
}

function importSignalsQuery(
  service: BrowserProfileImportService | null | undefined,
  enabled: boolean,
): import("@rchunk/app-shared").UseQueryOptions<BrowserProfileImportSignals> {
  return defineQueryOptions({
    enabled,
    queryKey: ["browser-profile-import-signals"],
    queryFn: async () => {
      if (service == null) throw Error("Browser profile import is unavailable");
      return service.getImportSignals();
    },
    retry: false,
    staleTime: queryStaleTime,
  });
}

function initializeBrowserProfileImportQueries(): void {
  if (queriesInitialized) return;
  initializeQueryRuntime();
  queryStaleTime = 30_000;
  queriesInitialized = true;
}

export {
  SourceIcon as a,
  messages as c,
  initializeImportDataIcons as d,
  initializeBrowserProfileImportQueries as i,
  initializeBrowserProfileImportMessages as l,
  importSignalsQuery as n,
  ProfileSourcesIcon as o,
  uniqueProfileSources as r,
  initializeSourceIcons as s,
  importableProfilesQuery as t,
  ImportDataIcon as u,
};
