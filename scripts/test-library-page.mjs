import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/library-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import(?:\s*\()?)\s*["']@rchunk\/([^"']+)/g)].map((match) => match[1]),
);
assert.deepEqual([...dependencies].sort(), [
  "app-connect-modal-by-id", "app-initial", "app-primary", "app-shared",
  "library-cloud-file-preview-entry", "library-empty-trash", "library-file-display-title", "library-file-preview-kind",
  "library-file-preview-loading", "library-image-preview", "library-item-actions",
  "library-item-dialogs", "library-move-dialog", "library-multiplayer-access",
  "library-note-preview", "library-trash-analytics", "open-library-item",
  "rolldown-runtime", "timestamps", "use-app-connect-flow",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:appConnectModalChunk|appInitialChunk|appSharedChunk|displayTitleChunk|previewKindChunk|previewLoadingChunk|itemActionsChunk|multiplayerAccessChunk|trashAnalyticsChunk|openLibraryItemChunk|timestampsChunk|appConnectFlowChunk)\s*\./,
);

const imageItem = { canDelete: true, canMove: true, canRename: true, canRestore: true, node: { id: "image-1", kind: "file", file_name: "photo.png", mime_type: "image/png", modified_at: "2026-09-20T10:00:00Z" } };
const textItem = { canDelete: true, canMove: true, canRename: true, canRestore: true, node: { id: "text-1", kind: "file", file_name: "notes.md", mime_type: "text/markdown" } };
const state = {
  access: { status: "allowed" }, accountId: "account-1", actions: [], analytics: [], apiGets: [], apiPosts: [],
  hookIndex: 0, hookValues: [], initializers: [], invalidations: [], lazyLoads: [], location: { pathname: "/library", search: "", hash: "", state: null },
  navigations: [], openCalls: [], query: { data: { items: [] }, error: null, isPending: false, refetches: 0 }, queryOptions: null, userId: "user-1",
};
state.scope = { queryClient: { invalidateQueries(input) { state.invalidations.push(input); } } };
globalThis.__libraryPageTest = state;

const mocks = {
  "rolldown-runtime": "export {};",
  "app-primary": "export {};",
  "app-shared": [
    "const s=globalThis.__libraryPageTest;const mark=name=>()=>s.initializers.push(name);",
    "export const $3=mark('compiler');export const FX=mark('signals');export const K2=mark('intl');export const QI=mark('scope');export const wL=mark('queries');",
    "export const Qh='Spinner';export const Y2='FormattedMessage';export const Yh='Button';export const ZI='applicationScope';",
    "export const HX=()=>s.access;export const LX=()=>s.scope;export const _L=options=>{s.queryOptions=options;return{...s.query,refetch(){s.query.refetches+=1}}};",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key}),jsxs:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key})});",
    "export const e6=()=>({lazy(loader){return props=>{s.lazyLoads.push(loader);return{type:'Lazy',props:{...props,loader}}}},useEffect(effect){effect()},useRef(value){return{current:value}},useState(value){const index=s.hookIndex++;if(!(index in s.hookValues))s.hookValues[index]=value;return[s.hookValues[index],next=>{s.hookValues[index]=typeof next==='function'?next(s.hookValues[index]):next}]}});",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__libraryPageTest;const mark=name=>()=>s.initializers.push(name);",
    "export const Qgn=mark('auth');export const cJt=mark('api');export const bL='accessSignal';",
    "export const N6t=()=>({accountId:s.accountId,userId:s.userId});export const i_n=()=>s.location;export const o_n=()=>((destination,options)=>s.navigations.push({destination,options}));",
    "export const rJt={safeGet:async(path,options)=>{s.apiGets.push({path,options});return s.query.data},safePost:async(path,options)=>{s.apiPosts.push({path,options});return{success:true}}};",
  ].join("\n"),
  "app-connect-modal-by-id": "const s=globalThis.__libraryPageTest;export const r=()=>s.initializers.push('app-connect-modal');export const n='AppConnectModalById';",
  "use-app-connect-flow": "export const t=()=>globalThis.__libraryPageTest.initializers.push('app-connect-flow');",
  timestamps: "const s=globalThis.__libraryPageTest;export const t=()=>s.initializers.push('timestamps');export const a=value=>'formatted:'+value;",
  "library-multiplayer-access": "export const r=()=>globalThis.__libraryPageTest.initializers.push('multiplayer');",
  "library-file-display-title": "export const t=item=>'title:'+item.file_name;",
  "library-file-preview-kind": [
    "const s=globalThis.__libraryPageTest;export const i=()=>s.initializers.push('preview-kind');",
    "export const r=item=>item.mime_type?.startsWith('image/')?'image':item.file_name.endsWith('.md')?'markdown':item.file_name.endsWith('.txt')?'text':'artifact';",
  ].join("\n"),
  "library-file-preview-loading": "const s=globalThis.__libraryPageTest;export const n=()=>s.initializers.push('preview-loading');export const t='PreviewLoading';",
  "library-item-actions": "const s=globalThis.__libraryPageTest;export const t=()=>s.initializers.push('item-actions');export const i=async(scope,item,action)=>{s.actions.push({item,action});await scope.invalidate(action);return true};",
  "library-trash-analytics": "const s=globalThis.__libraryPageTest;export const i=()=>s.initializers.push('trash-analytics');export const n=(event,item)=>s.analytics.push({event,item});",
  "open-library-item": "const s=globalThis.__libraryPageTest;export const t=()=>s.initializers.push('open-item');export const n=(scope,item,entryPoint)=>s.openCalls.push({scope,item,entryPoint});",
  "library-move-dialog": "export const MoveLibraryItemsDialog='MoveLibraryItemsDialog';",
  "library-item-dialogs": "export const ConfirmLibraryItemsDialog='ConfirmLibraryItemsDialog';export const RenameLibraryItemDialog='RenameLibraryItemDialog';",
  "library-cloud-file-preview-entry": "export const LibraryCloudFilePreview='LibraryCloudFilePreview';",
  "library-note-preview": "export const LibraryNotePreview='LibraryNotePreview';",
  "library-image-preview": "export const LibraryImagePreview='LibraryImagePreview';",
};

const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "library-page-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 3;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function reset() {
  state.access = { status: "allowed" }; state.accountId = "account-1"; state.actions = []; state.analytics = []; state.apiGets = []; state.apiPosts = [];
  state.hookIndex = 0; state.hookValues = []; state.invalidations = []; state.lazyLoads = []; state.location = { pathname: "/library", search: "", hash: "", state: null };
  state.navigations = []; state.openCalls = []; state.query = { data: { items: [] }, error: null, isPending: false, refetches: 0 }; state.queryOptions = null; state.userId = "user-1";
}
function render() { state.hookIndex = 0; return module.LibraryPage(); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function textContent(value) { if (value == null) return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" "); return value.props?.defaultMessage ?? textContent(value.props?.children); }
function byType(view, type) { return walk(view).find((node) => node.type === type); }
function button(view, label) { return walk(view).find((node) => (node.type === "button" || node.type === "Button") && textContent(node) === label); }
async function tick() { await new Promise((resolve) => setTimeout(resolve, 0)); }

assert.deepEqual(Object.keys(module), ["LibraryPage"]); assertions += 1;
check(state.initializers.length === 16 && new Set(state.initializers).size === 16, "initializes all static library runtimes once");

reset(); state.access.status = "loading";
let view = render();
check(byType(view, "Spinner") != null, "shows access loading state");

reset(); state.access.status = "denied";
view = render();
check(textContent(view).includes("Sign in to ChatGPT"), "shows signed-out access state");

reset(); state.query = { data: null, error: null, isPending: true, refetches: 0 };
view = render();
check(byType(view, "PreviewLoading") != null, "shows library loading state");
check(state.queryOptions.queryKey[0] === "library" && state.queryOptions.enabled === true, "builds the account-scoped library query");
await state.queryOptions.queryFn({ signal: {} });
check(state.apiGets[0].path === "/files/library", "loads the library endpoint");

reset(); state.query = { data: null, error: new Error("failed"), isPending: false, refetches: 0 };
view = render();
check(textContent(view).includes("couldn’t be loaded"), "shows query error state");
button(view, "Try again").props.onClick();
check(state.query.refetches === 1, "retries the library query");

reset(); view = render();
check(walk(view).some((node) => node.props?.["data-empty"] === "library"), "shows default empty state");
reset(); state.location.search = "?search=missing"; view = render();
check(walk(view).some((node) => node.props?.["data-empty"] === "search"), "shows search empty state");
reset(); state.location.search = "?deleted=true"; view = render();
check(walk(view).some((node) => node.props?.["data-empty"] === "trash"), "shows trash empty state");

reset(); state.location.search = "?entry_point=global_search&search=photo"; render();
check(state.navigations[0].options.replace === true && !String(state.navigations[0].destination.search).includes("entry_point"), "cleans the global-search entry point");

reset(); state.query = { data: { items: [imageItem, textItem] }, error: null, isPending: false, refetches: 0 };
view = render();
check(textContent(view).includes("title:photo.png") && textContent(view).includes("formatted:2026-09-20"), "renders display titles and timestamps");
const searchInput = walk(view).find((node) => node.type === "input" && node.props?.["aria-label"] === "Search Library");
searchInput.props.onChange({ currentTarget: { value: "photo" } });
check(String(state.navigations.at(-1).destination.search).includes("search=photo"), "updates URL-backed search");
button(view, "image").props.onClick();
check(String(state.navigations.at(-1).destination.search).includes("category=image"), "updates the category tab");
button(view, "Trash").props.onClick();
check(String(state.navigations.at(-1).destination.search).includes("deleted=true"), "opens the trash view");

button(view, "title:photo.png").props.onClick();
check(state.openCalls.length === 1, "opens selected library items");
view = render();
const imagePreview = byType(view, "Lazy");
const imageModule = await imagePreview.props.loader();
check(imageModule.default === "LibraryImagePreview", "loads the image preview lazily");

reset(); state.query = { data: { items: [textItem] }, error: null, isPending: false, refetches: 0 };
view = render(); button(view, "title:notes.md").props.onClick(); view = render();
const noteModule = await byType(view, "Lazy").props.loader();
check(noteModule.default === "LibraryNotePreview", "loads note previews lazily");

reset(); state.location.search = "?deleted=true"; state.query = { data: { items: [imageItem] }, error: null, isPending: false, refetches: 0 };
view = render(); button(view, "Restore").props.onClick(); await tick();
check(state.actions[0].action.type === "restore" && state.analytics[0].event === "restore", "restores trash items and records analytics");
check(state.invalidations.length === 1, "invalidates library data after an item action");

reset(); state.query = { data: { items: [imageItem] }, error: null, isPending: false, refetches: 0 };
view = render();
const main = byType(view, "main");
main.props.onDrop({ preventDefault() {}, dataTransfer: { files: [{ name: "upload.txt" }] } }); await tick();
check(state.apiPosts[0].path === "/files/library/files" && state.invalidations.length === 1, "uploads dropped files and refreshes the library");

button(view, "Rename").props.onClick(); view = render();
const renameModule = await walk(view).find((node) => node.type === "Lazy" && node.props.onClose != null).props.loader();
check(renameModule.default === "RenameLibraryItemDialog", "loads rename dialogs lazily");

reset(); state.query = { data: { items: [imageItem] }, error: null, isPending: false, refetches: 0 };
view = render(); button(view, "Move").props.onClick(); view = render();
const moveModule = await walk(view).find((node) => node.type === "Lazy" && node.props.items != null).props.loader();
check(moveModule.default === "MoveLibraryItemsDialog", "loads move dialogs lazily");

console.log(assertions + " library page assertions passed");
