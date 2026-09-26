// browser-profile-import-query —— 浏览器资料导入的资料源展示与查询定义。
// 原版：app/webview/assets/query-8542d2419280.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as cookiesIconChunk from "@rchunk/browser-profile-import-cookies-icon";
import * as historyIconChunk from "@rchunk/browser-profile-import-history-icon";
import * as chromeIconChunk from "@rchunk/google-chrome";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const cookiesIcon = cookiesIconChunk as Record<string, any>;
const historyIcon = historyIconChunk as Record<string, any>;
const chromeIcon = chromeIconChunk as Record<string, any>;

let jsx: Record<string, any>;
let PasswordsIcon: (props: Record<string, unknown>) => unknown;
let messages: Record<string, unknown>;
let atlasIconUrl: string;
let queryStaleTime: number;

let dataIconsInitialized = false;
let messagesInitialized = false;
let sourceIconsInitialized = false;
let queriesInitialized = false;

function initializePasswordsIcon(): void {
  if (PasswordsIcon != null) return;
  jsx = appShared.I3();
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
  kind: "cookies" | "history" | "passwords" | "extensions";
}): unknown {
  switch (kind) {
    case "cookies":
      return jsx.jsx(cookiesIcon.t, { className });
    case "history":
      return jsx.jsx(historyIcon.t, { className });
    case "passwords":
      return jsx.jsx(PasswordsIcon, { className });
    case "extensions":
      return jsx.jsx("span", {
        className,
        children: jsx.jsx(appShared.AS, {}),
      });
  }
}

function initializeImportDataIcons(): void {
  if (dataIconsInitialized) return;
  appShared.$3?.();
  appShared.lw?.();
  cookiesIcon.n?.();
  historyIcon.n?.();
  initializePasswordsIcon();
  jsx = appShared.I3();
  dataIconsInitialized = true;
}

function initializeBrowserProfileImportMessages(): void {
  if (messagesInitialized) return;
  appShared.K2?.();
  messages = appShared.G2({
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
  source: "atlas" | "chrome";
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
      return jsx.jsx(chromeIcon.t, { "aria-hidden": true, className });
  }
}

function ProfileSourcesIcon({
  sources,
}: {
  sources: Array<"atlas" | "chrome">;
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
  appShared.$3?.();
  atlasIconUrl = new URL("atlas-app-5b67bfaeebb3.png", import.meta.url).href;
  chromeIcon.n?.();
  jsx = appShared.I3();
  sourceIconsInitialized = true;
}

function uniqueProfileSources(profiles: Array<{ source: "atlas" | "chrome" }>) {
  return Array.from(new Set(profiles.map((profile) => profile.source)));
}

function importableProfilesQuery(service: any, enabled: boolean): unknown {
  return appShared.pL({
    enabled,
    queryKey: ["browser-profile-import-profiles"],
    queryFn: async () => {
      if (service == null) throw Error("Browser profile import is unavailable");
      try {
        return await service.listImportableBrowserProfiles();
      } catch (error) {
        appShared.Q3.error("Failed to list importable browser profiles", {
          safe: {},
        });
        throw error;
      }
    },
    retry: false,
    staleTime: queryStaleTime,
  });
}

function importSignalsQuery(service: any, enabled: boolean): unknown {
  return appShared.pL({
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
  appShared.Z3?.();
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
