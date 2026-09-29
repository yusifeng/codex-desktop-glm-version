import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/projects-index-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const hooks = [];
let hookIndex = 0;
const runtime = { initialized: [], navigated: [], showTitleInToolbar: false };
const React = { Fragment: "Fragment", useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__projectsIndex = { React, jsx, runtime };
const mocks = {
  "app-shared": "const r=globalThis.__projectsIndex;export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
  "app-initial": "const r=globalThis.__projectsIndex;export const o_n=()=>((destination,options)=>r.runtime.navigated.push({destination,options}));",
  "use-searchable-page-title-visibility": "const r=globalThis.__projectsIndex;export const t=()=>r.runtime.initialized.push('title');export const n=()=>({scrollContainerRef:()=>{},showTitleInToolbar:r.runtime.showTitleInToolbar,titleRef:()=>{}});",
  "thread-emoji": "const r=globalThis.__projectsIndex;export const n=()=>r.runtime.initialized.push('emoji');export const t=props=>({type:'thread-emoji',props});",
  "thread-overflow-menu": "const r=globalThis.__projectsIndex;export const n=()=>r.runtime.initialized.push('overflow');export const t=props=>({type:'thread-overflow',props});",
  "rolldown-runtime": "export {};", "app-primary": "export {};",
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "projects-index-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function reset() { hooks.length = 0; hookIndex = 0; runtime.navigated.length = 0; runtime.showTitleInToolbar = false; }
function render(props = {}) { hookIndex = 0; return module.ProjectsIndexPage(props); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" "); return text(value.props?.children); }
function find(view, type, label) { return walk(view).find((node) => node.type === type && (label == null || text(node) === label)); }
function findAll(view, type, label) { return walk(view).filter((node) => node.type === type && (label == null || text(node) === label)); }

deepEqual(Object.keys(module), ["ProjectsIndexPage"]);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "thread-emoji", "thread-overflow-menu", "use-searchable-page-title-visibility"]);
equal([...source.matchAll(/import\(/g)].length, 0);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual(runtime.initialized, ["title", "emoji", "overflow"]);

const threads = [
  { id: "t1", title: "Build dashboard", modifiedAt: 100, unread: true },
  { id: "t2", title: "Review metrics", modifiedAt: 90 },
  { id: "t3", title: "Write summary", modifiedAt: 80 },
  { id: "t4", title: "Publish report", modifiedAt: 70 },
];
const alpha = { id: "alpha", kind: "local", name: "Alpha", path: "/workspace/alpha", modifiedAt: 100, threads };
const beta = { id: "beta", kind: "cloud", name: "Beta", modifiedAt: 200, pinned: true, threads: [{ id: "t5", title: "Cloud planning" }] };
const locked = { id: "locked", kind: "cloud", name: "Locked", modifiedAt: null, canDelete: false, threads: [] };
let events = [];
const props = { projects: [alpha, beta, locked], onArchiveProjectThreads: (project) => events.push("archive:" + project.id), onCreateProject: (kind) => events.push("create:" + kind), onOpenProject: (project) => events.push("open:" + project.id), onOpenThread: (project, thread) => events.push("thread:" + project.id + ":" + thread.id), onPinChange: (project, pinned) => events.push("pin:" + project.id + ":" + pinned), onRemoveProject: (project) => events.push("remove:" + project.id), onRetry: () => events.push("retry"), onStartChat: (project) => events.push("start:" + project.id) };

reset(); let view = render(props);
equal(text(view).includes("Projects"), true);
ok(find(view, "input"));
equal(find(view, "input").props.placeholder, "Search projects");
ok(find(view, "button", "Create"));
equal(text(view).indexOf("Beta") < text(view).indexOf("Alpha"), true);
equal(text(view).includes("Local project"), true);
equal(text(view).includes("No projects"), false);
equal(findAll(view, "article").length, 3);
equal(find(view, "button", "Unpin project") != null, true);
equal(find(view, "button", "Pin project") != null, true);
equal(findAll(view, "button", "Remove project").length, 2);

find(view, "button", "Alpha").props.onClick();
deepEqual(events, ["open:alpha"]);
find(view, "button", "Pin project").props.onClick();
equal(events.includes("pin:alpha:true"), true);
find(view, "button", "Start new local chat in project").props.onClick();
equal(events.includes("start:alpha"), true);
find(view, "button", "Archive chats").props.onClick();
equal(events.some((entry) => entry.startsWith("archive:")), true);
find(view, "button", "Remove project").props.onClick();
equal(events.some((entry) => entry.startsWith("remove:")), true);

findAll(view, "button", "Expand").find((node) => node.props["aria-expanded"] === false).props.onClick();
view = render(props);
equal(text(view).includes("Recent chats in Beta"), true);
ok(find(view, "thread-emoji"));
ok(find(view, "thread-overflow"));
walk(view).find((node) => node.type === "button" && text(node).includes("Cloud planning")).props.onClick();
equal(events.includes("thread:beta:t5"), true);

reset(); view = render(props);
find(view, "input").props.onChange({ currentTarget: { value: "dashboard" } });
view = render(props);
equal(text(view).includes("Alpha"), true);
equal(text(view).includes("Beta"), false);
equal(text(view).includes("Search matches in Alpha"), true);
equal(text(view).includes("Build dashboard"), true);
equal(text(view).includes("unread"), true);

reset(); view = render(props);
find(view, "button", "Name").props.onClick();
view = render(props);
equal(text(view).indexOf("Alpha") < text(view).indexOf("Beta"), true);
find(view, "button", "Name").props.onClick();
view = render(props);
equal(text(view).indexOf("Locked") < text(view).indexOf("Beta"), true);

reset(); view = render({ ...props, projects: [alpha] });
find(view, "button", "Expand").props.onClick(); view = render({ ...props, projects: [alpha] });
equal(findAll(view, "li").length, 3);
ok(find(view, "button", "Show more"));
find(view, "button", "Show more").props.onClick(); view = render({ ...props, projects: [alpha] });
equal(findAll(view, "li").length, 4);
ok(find(view, "button", "Show less"));

reset(); view = render({ projects: [], onCreateProject: props.onCreateProject });
equal(text(view).includes("Create a ChatGPT project"), true);
ok(find(view, "button", "New project"));
equal(find(view, "input"), undefined);
find(view, "button", "New project").props.onClick();
equal(events.at(-1), "create:cloud");

reset(); view = render({ projects: [], showChatGptProjects: false, showLocalProjects: true, workMode: false, onCreateProject: props.onCreateProject });
equal(text(view).includes("give ChatGPT access to folders"), true);
find(view, "button", "New project").props.onClick();
equal(events.at(-1), "create:local");

reset(); view = render({ ...props, isLoading: true, projects: [] }); equal(text(view).includes("Loading projects"), true); ok(find(view, "p"));
reset(); view = render({ ...props, projectListError: true, projects: [] }); equal(text(view).includes("Unable to load projects"), true); ok(find(view, "button", "Retry")); find(view, "button", "Retry").props.onClick(); equal(events.at(-1), "retry");
reset(); view = render({ ...props, cloudSearchError: true, projects: [alpha] }); find(view, "input").props.onChange({ currentTarget: { value: "missing" } }); view = render({ ...props, cloudSearchError: true, projects: [alpha] }); equal(text(view).includes("Couldn’t search ChatGPT chats"), true);
reset(); view = render({ ...props, cloudSearchError: true }); find(view, "input").props.onChange({ currentTarget: { value: "alpha" } }); view = render({ ...props, cloudSearchError: true }); equal(text(view).includes("Some ChatGPT chats may be missing"), true);
reset(); view = render({ ...props, isSearching: true }); find(view, "input").props.onChange({ currentTarget: { value: "alpha" } }); view = render({ ...props, isSearching: true }); equal(text(view).includes("Searching ChatGPT chats…"), true);

reset(); runtime.showTitleInToolbar = true; view = render(props); equal(findAll(view, "h1", "Projects").length, 2);
reset(); view = render({ ...props, showChatGptProjects: false }); equal(text(view).includes("Beta"), false); equal(text(view).includes("Alpha"), true);
reset(); view = render({ ...props, showLocalProjects: false }); equal(text(view).includes("Alpha"), false); equal(text(view).includes("Beta"), true);

reset(); view = render({ projects: [alpha] }); find(view, "button", "Alpha").props.onClick(); equal(runtime.navigated.at(-1).destination, "/projects?projectId=alpha");
reset(); view = render({ projects: [alpha] }); find(view, "button", "Expand").props.onClick(); view = render({ projects: [alpha] }); walk(view).find((node) => node.type === "button" && text(node).includes("Build dashboard")).props.onClick(); equal(runtime.navigated.at(-1).destination, "/c/t1");

console.log("projects-index-page tests passed (" + assertions + " assertions)");
