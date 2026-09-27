import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/appgen-project-row";

export interface ShowcaseSite {
  open_url?: string | null;
  thumbnail_url?: string | null;
  title: string;
}
export interface ShowcaseSiteDetailsProps {
  creatorName?: string | null;
  onClose(): void;
  onCloseAutoFocus?(event: unknown): void;
  onCopyLink?(url: string): Promise<boolean> | boolean;
  onOpenSite?(url: string): void;
  site: ShowcaseSite;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function ShowcaseSiteDetails({ creatorName, onClose, onCloseAutoFocus, onCopyLink, onOpenSite, site }: ShowcaseSiteDetailsProps): unknown {
  const siteUrl = site.open_url ?? null;
  const subtitle = creatorName ? `${siteUrl ?? site.title} · ${creatorName}` : (siteUrl ?? site.title);
  const open = (): void => { if (siteUrl != null) onOpenSite?.(siteUrl); };
  const copy = async (): Promise<boolean> => siteUrl != null && (await onCopyLink?.(siteUrl)) !== false;
  return jsx().jsxs("section", {
    "aria-label": "Site preview",
    "data-showcase-site-details": true,
    children: [
      jsx().jsxs("header", { children: [jsx().jsx("h1", { children: site.title }), jsx().jsx("p", { children: subtitle }), jsx().jsx("button", { "aria-label": "Close site preview", onClick: onClose, onBlur: onCloseAutoFocus, type: "button", children: "Close" })] }),
      jsx().jsx("div", { className: "site-preview", children: site.thumbnail_url ? jsx().jsx("img", { alt: `${site.title} site preview`, src: site.thumbnail_url }) : jsx().jsx("div", { "data-site-preview-fallback": true, children: site.title }) }),
      jsx().jsxs("footer", { children: [jsx().jsx("button", { disabled: siteUrl == null, onClick: copy, type: "button", children: "Copy link" }), jsx().jsx("button", { disabled: siteUrl == null, onClick: open, type: "button", children: "View site" })] }),
    ],
  });
}

export { ShowcaseSiteDetails };
