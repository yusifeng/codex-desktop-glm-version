// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/local-conversation-sources-side-panel-tab-core",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/artifact-file-preview-icon",
      "@rchunk/local-conversation-webmcp-tools-model",
      "@rchunk/webmcp-tool-calls",
      "@rchunk/local-conversation-external-resource-icon",
      "@rchunk/google-drive-resource-icon",
      "@rchunk/use-local-conversation-sources",
      "@rchunk/local-conversation-external-resources",
      "@rchunk/local-conversation-sources-signals",
      "@rchunk/local-conversation-summary-panel-sources-model",
      "@rchunk/mcp-tool-activity-label",
      "@rchunk/presentation",
      "@rchunk/mcp-app-analytics",
      "@rchunk/tool-activity-disclosure",
      "@rchunk/mcp-tool-item-content",
      "@rchunk/open-automation-side-panel-tab",
      "@rchunk/elicitation-events",
      "@rchunk/site-automation-setup-state",
      "@rchunk/chatgpt-tasks-runtime",
      "@rchunk/computer-use-native-app-metadata",
      "@rchunk/registered-sources",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import { H3 as t, I3 as n, Jm as r, V3 as i, qm as a } from "@rchunk/app-shared";
import { FDt as o, IDt as s, Qen as c, Zen as l } from "@rchunk/app-initial";
import { n as u, t as d } from "@rchunk/open-sources-side-panel-tab";
function f({ open: e }) {
  return s(l.SOURCES, m, {
    dropDestinations: [`left`, `right`, `bottom`],
    getId: () => l.SOURCES,
    isAvailable: (e) => e.value.routeKind === `local-thread`,
    open: e,
    renderThumbnail: (e, t) =>
      (0, p.jsx)(h, { conversationId: e.conversationId, hostId: e.hostId, title: t.title }),
  });
}
var p, m, h;
function g() {
  return (g = e(() => {
    (o(),
      a(),
      c(),
      (p = n()),
      t(),
      (m = r(
        async () => {
          let { LocalConversationSourcesSidePanelTab: e } = await i(
            async () => {
              let { LocalConversationSourcesSidePanelTab: e } = await import(
                `@rchunk/local-conversation-sources-side-panel-tab-core`
              );
              return { LocalConversationSourcesSidePanelTab: e };
            },
            __vite__mapDeps([
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
              24,
            ]),
            import.meta.url,
          );
          return e;
        },
        { propagateLoadError: !0 },
      )),
      (h = r(
        async () => {
          let { RegisteredLocalSourcesThumbnail: e } = await i(
            async () => {
              let { RegisteredLocalSourcesThumbnail: e } = await import(
                `@rchunk/registered-sources`
              );
              return { RegisteredLocalSourcesThumbnail: e };
            },
            __vite__mapDeps([25, 1, 2, 3, 4, 5, 12, 7, 8, 14, 15, 16, 17]),
            import.meta.url,
          );
          return e;
        },
        { propagateLoadError: !0 },
      )));
  }))();
}
function _(e, t, n, r) {
  u(e, v, t, n, r);
}
var v;
function y() {
  return (y = e(() => {
    (g(), d(), (v = f({ open: _ })));
  }))();
}
export { _ as n, y as t };
