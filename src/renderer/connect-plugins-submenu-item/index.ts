// Connect Plugins submenu: recommended plugins, impression tracking, and the
// full plugin-directory action. Restored from connect-plugins-submenu-item.
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

interface PluginRecommendation extends Record<string, unknown> {
  displayName: string;
  id: string;
  logoDarkPath?: string | null;
  logoPath?: string | null;
  name?: string | null;
  remotePluginId?: string | null;
}

export interface ConnectPluginsSubmenuItemProps {
  featuredPlugins: PluginRecommendation[];
  label: unknown;
  onConnectPlugin(plugin: PluginRecommendation): void;
  onOpenPluginDirectory(): void;
  onPluginImpressions?(visibleIds: string[], newlyVisibleIds: string[]): void;
  workRecommendationsHostId: string;
}

const shared = appSharedChunk as unknown as Record<string, any>;
const initial = appInitialChunk as unknown as Record<string, any>;

let jsx: JsxRuntime;
let React: ReactRuntime;
let featuredPluginsQuery: unknown;
let initialized = false;

function pluginImpressionId(plugin: PluginRecommendation): string {
  return plugin.remotePluginId ?? plugin.id;
}

function observePluginImpressions(
  container: HTMLElement,
  orderedIds: string[],
  reported: Set<string>,
  onImpressions: (visibleIds: string[], newlyVisibleIds: string[]) => void,
): () => void {
  const ids = [...new Set(orderedIds)];
  const visible = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target instanceof HTMLElement
          ? entry.target.dataset.pluginImpressionId
          : undefined;
        if (id == null) continue;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) visible.add(id);
        else visible.delete(id);
      }
      const visibleIds = ids.filter((id) => visible.has(id));
      const newlyVisibleIds = visibleIds.filter((id) => !reported.has(id));
      if (newlyVisibleIds.length === 0) return;
      for (const id of newlyVisibleIds) reported.add(id);
      onImpressions(visibleIds, newlyVisibleIds);
    },
    { root: container.parentElement, threshold: 0.5 },
  );
  for (const item of container.querySelectorAll<HTMLElement>("[data-plugin-impression-id]")) {
    observer.observe(item);
  }
  return () => observer.disconnect();
}

function initializeRecommendationQuery(): void {
  for (const name of ["jZ", "I1t", "z2t", "FX", "g4", "G6t", "i4t", "E4t", "QI", "pfn", "ek", "pdn"]) {
    shared[name]?.();
    initial[name]?.();
  }
  const stringSchema = shared.q4?.();
  if (stringSchema != null) {
    const itemSchema = stringSchema.trim().catch("");
    shared.E4?.(itemSchema)?.catch([]);
  }
  featuredPluginsQuery = shared.QX(shared.ZI, (hostId: string, { get }: { get(signal: unknown): unknown }) => ({
    enabled: false,
    queryKey: [
      ...initial.m4t,
      "work-composer-featured",
      get(initial.H6t),
      hostId,
      false,
      undefined,
    ],
    queryFn: shared.FZ,
    retry: false,
    staleTime: shared.$O.ONE_MINUTE,
  }));
}

function ConnectPluginsSubmenuItem({
  featuredPlugins,
  label,
  onConnectPlugin,
  onOpenPluginDirectory,
  onPluginImpressions,
  workRecommendationsHostId,
}: ConnectPluginsSubmenuItemProps): unknown {
  initializeConnectPluginsSubmenuItem();
  const query = shared.BX(featuredPluginsQuery, workRecommendationsHostId) as {
    data?: unknown[];
    isLoading: boolean;
  };
  const reported = React.useRef(new Set<string>());
  const recommendations: PluginRecommendation[] = query.data?.map(initial.dv) ?? featuredPlugins;
  const Menu = shared.jf;
  const FormattedMessage = shared.Y2;
  const PluginLogo = initial.Dlt;

  const loading = query.isLoading
    ? jsx.jsx(Menu.Message, {
        compact: true,
        role: "status",
        children: jsx.jsx("span", {
          className: "loading-shimmer-pure-text select-none",
          children: jsx.jsx(FormattedMessage, {
            id: "composer.workMode.plugins.loadingRecommendations",
            defaultMessage: "Loading plugins…",
            description: "Status in the Connect plugins submenu while recommended plugins load. Installed plugins and the Browse all plugins action remain available.",
          }),
        }),
      })
    : null;

  const recommendationItems = recommendations.length === 0
    ? null
    : jsx.jsxs(jsx.Fragment, {
        children: [
          jsx.jsx("div", {
            ref: (element: HTMLElement | null) => {
              if (element != null && onPluginImpressions != null) {
                return observePluginImpressions(
                  element,
                  recommendations.map(pluginImpressionId),
                  reported.current,
                  onPluginImpressions,
                );
              }
            },
            className: "flex flex-col",
            children: recommendations.map((plugin) => jsx.jsxs(Menu.Item, {
              "data-plugin-impression-id": pluginImpressionId(plugin),
              rightIconAsset: shared.kc,
              onSelect: () => onConnectPlugin(plugin),
              children: [
                jsx.jsx(Menu.ItemIcon, {
                  size: "xs",
                  children: jsx.jsx(PluginLogo, {
                    alt: "",
                    className: "size-full object-contain",
                    knownAppId: plugin.name ?? undefined,
                    logoDarkUrl: plugin.logoDarkPath,
                    logoUrl: plugin.logoPath,
                    fallback: jsx.jsx(shared.Gm, { className: "size-full text-secondary" }),
                  }),
                }),
                jsx.jsx("span", { children: plugin.displayName }),
              ],
            }, plugin.id)),
          }),
          jsx.jsx(Menu.Separator, {}),
        ],
      });

  return jsx.jsxs(Menu.FlyoutSubmenuItem, {
    leftIconAsset: shared.lT,
    contentSurface: "opaque",
    contentWidth: "menuWide",
    label,
    onOpenChange: (open: boolean) => {
      if (!open) reported.current.clear();
    },
    children: [
      loading,
      recommendationItems,
      jsx.jsx(Menu.Section, {
        className: "flex flex-col",
        children: jsx.jsx(Menu.Item, {
          rightIconAsset: shared.uO,
          onSelect: onOpenPluginDirectory,
          children: jsx.jsx(FormattedMessage, {
            id: "composer.workMode.plugins.browseAll",
            defaultMessage: "Browse all plugins",
            description: "Action that opens the full plugin directory from a plugin picker",
          }),
        }),
      }),
    ],
  });
}

function initializeConnectPluginsSubmenuItem(): void {
  if (initialized) return;
  initialized = true;
  shared.$3?.();
  for (const name of ["dO", "cT", "Oc", "FX"]) shared[name]?.();
  React = shared.e6();
  shared.K2?.();
  for (const name of ["Olt", "If", "Km"]) {
    initial[name]?.();
    shared[name]?.();
  }
  initializeRecommendationQuery();
  initial._v?.();
  jsx = shared.I3();
}

initializeConnectPluginsSubmenuItem();

export {
  initializeConnectPluginsSubmenuItem as n,
  ConnectPluginsSubmenuItem as t,
};
