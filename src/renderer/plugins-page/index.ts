import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial"; import "@rchunk/app-primary"; import "@rchunk/computer-history-suggestion-prompt"; import "@rchunk/computer-history-suggestions"; import "@rchunk/plugin-connector-setup"; import "@rchunk/app-connect-modal"; import "@rchunk/use-app-connect-flow"; import "@rchunk/document-title"; import "@rchunk/apps-availability"; import "@rchunk/first-app-connect-ambient-suggestions"; import "@rchunk/skills-page-grid"; import "@rchunk/card-tile"; import "@rchunk/use-home-directory"; import "@rchunk/app-card"; import "@rchunk/plugin-request-empty-state"; import { P as SectionedPage, y as filterApps, S as filterSkills, type App, type Skill } from "@rchunk/plugins-page-section"; import "@rchunk/share-menu-item"; import { t as PluginDetailPage } from "@rchunk/plugin-detail-page-core"; import "@rchunk/plugin-detail-view"; import "@rchunk/plugin-share-dialog-core"; import "@rchunk/control-group"; import "@rchunk/filter";
let jsx: JsxRuntime;
const initializeFilters = (): void => { jsx = getJsxRuntime(); };
const initializePage = (): void => { initializeFilters(); };
interface PluginsPageProps {
  apps?: App[];
  plugins?: Array<{ id?: string; name: string; description?: string }>;
  query?: string;
  selectedPlugin?: ({ name: string } & Record<string, unknown>) | null;
  skills?: Skill[];
}
function PluginsPage(props: PluginsPageProps): unknown {
  const runtime = ensureJsx();
  if (props.selectedPlugin != null) return runtime.jsx(PluginDetailPage, { plugin: props.selectedPlugin });
  const query = (props.query ?? "").trim().toLowerCase();
  const apps = filterApps({ apps: props.apps ?? [], query });
  const skills = filterSkills({ skills: props.skills ?? [], query });
  const plugins = (props.plugins ?? []).filter((plugin) => !query || `${plugin.name} ${plugin.description ?? ""}`.toLowerCase().includes(query));
  const content = runtime.jsxs(runtime.Fragment, { children: [
    runtime.jsx("section", { id: "plugins", children: plugins.map((plugin) => runtime.jsx("article", { children: plugin.name }, plugin.id ?? plugin.name)) }),
    runtime.jsx("section", { id: "apps", children: apps.map((app) => runtime.jsx("article", { children: app.name }, app.id ?? app.name)) }),
    runtime.jsx("section", { id: "skills", children: skills.map((skill) => runtime.jsx("article", { children: skill.name }, skill.id)) }),
  ] });
  return runtime.jsx(SectionedPage, {
    ariaLabel: "Plugins",
    sections: [{ id: "plugins", title: "Plugins" }, { id: "apps", title: "Apps" }, { id: "skills", title: "Skills" }],
    children: content,
  });
}
function PluginsRoute(props: Record<string, unknown>): unknown { return ensureJsx().jsx(PluginsPage, props); }
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { initializeFilters as i, initializePage as n, PluginsPage as r, PluginsRoute as t };
