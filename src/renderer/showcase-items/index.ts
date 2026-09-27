import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/appgen-project-row";

interface ShowcaseSiteItem {
  kind: "site";
  site: { description?: string | null; thumbnail_url?: string | null; title: string };
}

interface ShowcasePinItem {
  kind: "pin";
  pin: { description?: string | null; icon?: string | null; title: string };
}

interface ShowcasePresentation {
  description: string | null;
  icon: unknown;
  title: string;
}

let runtime: JsxRuntime | undefined;

function jsx(): JsxRuntime {
  runtime ??= getJsxRuntime();
  return runtime;
}

function normalizeIconSource(source: string): string {
  if (source.startsWith("data:")) return source;
  const mimeType = [
    ["PHN2Zy", "image/svg+xml"],
    ["PD94bWw", "image/svg+xml"],
    ["/9j/", "image/jpeg"],
    ["R0lGOD", "image/gif"],
    ["UklGR", "image/webp"],
  ].find(([prefix]) => source.startsWith(prefix))?.[1] ?? "image/png";
  return `data:${mimeType};base64,${source}`;
}

function t(item: ShowcaseSiteItem | ShowcasePinItem): ShowcasePresentation {
  if (item.kind === "site") {
    return {
      title: item.site.title,
      description: item.site.description ?? null,
      icon: jsx().jsx("span", {
        "data-showcase-site-thumbnail": item.site.thumbnail_url ?? "",
        className: "flex size-9 shrink-0 overflow-hidden rounded-lg",
      }),
    };
  }

  const icon = item.pin.icon == null ? null : normalizeIconSource(item.pin.icon);
  return {
    title: item.pin.title,
    description: item.pin.description ?? null,
    icon: jsx().jsx("span", {
      className: "flex size-9 shrink-0 items-center justify-center",
      children: icon == null
        ? jsx().jsx("span", { "aria-hidden": true, className: "size-9 rounded-lg bg-surface-secondary" })
        : jsx().jsx("img", { alt: "", className: "size-9", src: icon }),
    }),
  };
}

function n(): void {}

export { n, t };
