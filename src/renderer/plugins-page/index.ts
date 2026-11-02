import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial"; import "@rchunk/app-primary"; import "@rchunk/computer-history-suggestion-prompt"; import "@rchunk/computer-history-suggestions"; import "@rchunk/plugin-connector-setup"; import "@rchunk/app-connect-modal"; import "@rchunk/use-app-connect-flow"; import "@rchunk/document-title"; import "@rchunk/apps-availability"; import "@rchunk/first-app-connect-ambient-suggestions"; import "@rchunk/skills-page-grid"; import "@rchunk/card-tile"; import "@rchunk/use-home-directory"; import "@rchunk/app-card"; import "@rchunk/plugin-request-empty-state"; import { P as SectionedPage, y as filterApps, S as filterSkills, type App, type Skill } from "@rchunk/plugins-page-section"; import "@rchunk/share-menu-item"; import { n as PluginDetailPage } from "@rchunk/plugin-detail-page-core"; import "@rchunk/plugin-detail-view"; import "@rchunk/plugin-share-dialog-core"; import "@rchunk/control-group"; import "@rchunk/filter";
let jsx: JsxRuntime;
const initializeFilters = (): void => { jsx = getJsxRuntime(); };
const initializePage = (): void => { initializeFilters(); };
interface PluginsPageProps {
  apps?: App[];
  error?: string | null;
  isLoading?: boolean;
  onBack?(): void;
  onSelectApp?(app: App): void;
  onSelectPlugin?(plugin: { id?: string; name: string; description?: string; installed?: boolean }): void;
  onSelectSkill?(skill: Skill): void;
  plugins?: Array<{ id?: string; name: string; description?: string; installed?: boolean }>;
  query?: string;
  selectedPlugin?: ({ name: string } & Record<string, unknown>) | null;
  skills?: Skill[];
}
function PluginsPage(props: PluginsPageProps): unknown {
  const runtime = ensureJsx();
  if (props.isLoading) return runtime.jsx("div", { "aria-busy": true, children: "Loading plugins…" });
  if (props.error != null) return runtime.jsx("div", { role: "alert", children: props.error });
  if (props.selectedPlugin != null) return runtime.jsx(PluginDetailPage, { plugin: props.selectedPlugin, onBack: props.onBack });
  const query = (props.query ?? "").trim().toLowerCase();
  const apps = filterApps({ apps: props.apps ?? [], query });
  const skills = filterSkills({ skills: props.skills ?? [], query });
  const plugins = (props.plugins ?? []).filter((plugin) => !query || `${plugin.name} ${plugin.description ?? ""}`.toLowerCase().includes(query));
  const content = runtime.jsxs(runtime.Fragment, { children: [
    runtime.jsx("section", { id: "plugins", children: plugins.length === 0 ? runtime.jsx("p", { children: "No plugins found" }) : plugins.map((plugin) => runtime.jsxs("article", { "data-installed": plugin.installed ?? false, children: [runtime.jsx("h2", { children: plugin.name }), runtime.jsx("p", { children: plugin.description }), runtime.jsx("button", { type: "button", onClick: () => props.onSelectPlugin?.(plugin), children: plugin.installed ? "Manage" : "View" })] }, plugin.id ?? plugin.name)) }),
    runtime.jsx("section", { id: "apps", children: apps.map((app) => runtime.jsxs("article", { children: [runtime.jsx("h2", { children: app.name }), runtime.jsx("p", { children: app.description }), runtime.jsx("button", { type: "button", onClick: () => props.onSelectApp?.(app), children: "View app" })] }, app.id ?? app.name)) }),
    runtime.jsx("section", { id: "skills", children: skills.map((skill) => runtime.jsxs("article", { children: [runtime.jsx("h2", { children: skill.name }), runtime.jsx("p", { children: skill.description }), runtime.jsx("button", { type: "button", onClick: () => props.onSelectSkill?.(skill), children: "View skill" })] }, skill.id)) }),
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
