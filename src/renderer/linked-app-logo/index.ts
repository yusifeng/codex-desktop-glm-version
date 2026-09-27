import "@rchunk/rolldown-runtime";
import {
  AS as ConnectedAppsGlyph,
  I3 as getJsxRuntime,
  Ot as GeneratedSiteDetailGlyph,
  R_ as AppleGlyph,
  S_ as Icon,
  e6 as getReact,
  h4 as initializeClassNames,
  m4 as classNames,
  zw as GeneratedSiteListGlyph,
} from "@rchunk/app-shared";
import {
  n6 as CodexGlyph,
  r6 as initializeAccountConnectionGlyphs,
} from "@rchunk/app-initial";

interface LinkedApplication {
  client_app_type?: string;
  logo_uri?: string | null;
  name: string;
}

interface AccountConnection {
  name: string;
  type: "apple" | "codex_cli" | "kakao_talk" | "oai_apps" | "viber";
}

interface LogoFrameProps {
  borderless?: boolean;
  children?: unknown;
  size?: "detail" | "list";
}

interface LinkedAppLogoProps {
  app: LinkedApplication;
  borderless?: boolean;
  size?: "detail" | "list";
}

interface AccountConnectionLogoProps {
  app: AccountConnection;
  borderless?: boolean;
}

interface ReactLike {
  useState<Value>(value: Value): [Value, (next: Value) => void];
}

const allowedLogoHosts = new Set([
  "assets.chatgpt.site",
  "auth-cdn.oaistatic.com",
  "cdn.openai.com",
  "cdn.oaistatic.com",
  "files.openai.com",
  "persistent.oaistatic.com",
]);
const jsx = getJsxRuntime();

function safeLinkedAppLogoUrl(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && allowedLogoHosts.has(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function LogoFrame({ children, size = "list", borderless = false }: LogoFrameProps): unknown {
  return jsx.jsx("span", {
    className: classNames(
      "flex shrink-0 items-center justify-center select-none",
      !borderless && "border border-default",
      size === "detail" ? "size-12 rounded-xl" : "size-8 rounded-lg",
    ),
    "aria-hidden": true,
    children,
  });
}

function LinkedAppLogo({ app, size = "list", borderless = false }: LinkedAppLogoProps): unknown {
  const React = getReact() as ReactLike;
  const isGeneratedSite = app.client_app_type === "codex_generated_site";
  const source = isGeneratedSite ? null : safeLinkedAppLogoUrl(app.logo_uri);
  const [loadedSource, setLoadedSource] = React.useState<string | null>(null);
  const [failedSource, setFailedSource] = React.useState<string | null>(null);
  const failed = source != null && failedSource === source;
  const loaded = source != null && loadedSource === source && !failed;
  const fallback = loaded
    ? null
    : isGeneratedSite
      ? jsx.jsx(Icon, {
          asset: size === "detail" ? GeneratedSiteDetailGlyph : GeneratedSiteListGlyph,
          className: "shrink-0",
          focusable: "false",
        })
      : jsx.jsx("span", {
          className: "text-sm font-medium text-secondary",
          children: Array.from(app.name.trim())[0]?.toUpperCase(),
        });
  const image = source == null || failed
    ? null
    : jsx.jsx("img", {
        alt: "",
        className: classNames(
          size === "detail" ? "size-10" : "size-6",
          "object-contain",
          !loaded && "hidden",
        ),
        src: source,
        referrerPolicy: "no-referrer",
        onLoad: () => {
          setLoadedSource(source);
          setFailedSource(null);
        },
        onError: () => setFailedSource(source),
      });
  return jsx.jsxs(LogoFrame, {
    size,
    borderless,
    children: [fallback, image],
  });
}

function AccountConnectionLogo({ app, borderless = false }: AccountConnectionLogoProps): unknown {
  let glyph: unknown = null;
  switch (app.type) {
    case "apple":
      glyph = jsx.jsx(AppleGlyph as (props: Record<string, unknown>) => unknown, {});
      break;
    case "codex_cli":
      glyph = jsx.jsx(CodexGlyph as (props: Record<string, unknown>) => unknown, {
        className: "size-5",
        "aria-hidden": true,
      });
      break;
    case "oai_apps":
      glyph = jsx.jsx(ConnectedAppsGlyph as (props: Record<string, unknown>) => unknown, {});
      break;
    case "kakao_talk":
    case "viber":
      glyph = jsx.jsx("span", {
        className: "text-sm font-medium text-secondary",
        children: Array.from(app.name.trim())[0]?.toUpperCase(),
      });
  }
  return jsx.jsx(LogoFrame, { borderless, children: glyph });
}

function initializeLinkedAppLogo(): void {
  initializeClassNames();
  initializeAccountConnectionGlyphs();
}

export {
  LinkedAppLogo as n,
  initializeLinkedAppLogo as r,
  AccountConnectionLogo as t,
};
