import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as SkillsPage, r as initializeSkillsPage } from "@rchunk/skills-page-core";

let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeSkillsSettings(): void { if (initialized) return; initialized = true; initializeSkillsPage(); jsx = getJsxRuntime(); }
function SkillsSettings(): unknown { initializeSkillsSettings(); return jsx!.jsx("section", { "aria-label": "Skills settings", "data-settings-section": "skills", children: jsx!.jsx(SkillsPage, {}) }); }
initializeSkillsSettings();
export { SkillsSettings };
