import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import "@rchunk/computer-history-suggestions";
import "@rchunk/use-element-in-view";
import "@rchunk/skills-page-grid";
import "@rchunk/plugin-request-empty-state";
import "@rchunk/plugins-store-page";
import "@rchunk/plugins-page-section";
import "@rchunk/plugin-detail-page-core";
import "@rchunk/plugin-detail-view";
import "@rchunk/settings-host-dropdown";
import "@rchunk/plugins-page";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface Skill { description?: string; id: string; installed?: boolean; name: string; [key: string]: unknown }
interface SkillsPageProps { initialQuery?: string; initialTab?: "plugins" | "skills"; onInstall?(skill: Skill): Promise<unknown>; onOpen?(skill: Skill): void; skills?: Skill[] }
const jsx = getJsxRuntime();
const React = getReactRuntime();
function SkillsPage({ initialQuery = "", initialTab = "skills", onInstall, onOpen, skills = [] }: SkillsPageProps = {}): unknown {
  const [tab, setTab] = React.useState(initialTab);
  const [query, setQuery] = React.useState(initialQuery);
  const [installing, setInstalling] = React.useState<string | null>(null);
  const visible = skills.filter(skill => `${skill.name} ${skill.description ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const install = async (skill: Skill) => { if (!onInstall || installing) return; setInstalling(skill.id); try { await onInstall(skill); } finally { setInstalling(null); } };
  return jsx.jsxs("main", { className: "flex h-full min-h-0 flex-col", children: [jsx.jsx("h1", { children: "Skills and plugins" }), jsx.jsxs("nav", { "aria-label": "Skills sections", children: [jsx.jsx("button", { type: "button", "aria-pressed": tab === "skills", onClick: () => setTab("skills"), children: "Skills" }), jsx.jsx("button", { type: "button", "aria-pressed": tab === "plugins", onClick: () => setTab("plugins"), children: "Plugins" })] }), jsx.jsx("input", { type: "search", "aria-label": "Search skills and plugins", value: query, onChange: (event: { currentTarget: { value: string } }) => setQuery(event.currentTarget.value) }), visible.length === 0 ? jsx.jsx("p", { children: "No matching skills" }) : jsx.jsx("ul", { children: visible.map(skill => jsx.jsxs("li", { children: [jsx.jsx("button", { type: "button", onClick: () => onOpen?.(skill), children: skill.name }), jsx.jsx("p", { children: skill.description }), skill.installed ? jsx.jsx("span", { children: "Installed" }) : jsx.jsx("button", { type: "button", disabled: installing != null, onClick: () => install(skill), children: installing === skill.id ? "Installing…" : "Install" })] }, skill.id)) })] });
}
function manageSkillsPage(): unknown { return jsx.jsx(SkillsPage, { initialTab: "skills" }); }
function initializeSkillsPage(): void { initializeApiClient(); }
export { manageSkillsPage as n, initializeSkillsPage as r, SkillsPage as t };
