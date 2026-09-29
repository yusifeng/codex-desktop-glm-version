import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/my-gpts-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(
    (match) => match[1],
  ),
);

assert.deepEqual([...dependencies].sort(), [
  "app-initial",
  "app-shared",
  "directory-banner",
  "gpt-management-url",
  "migrated-plugin-access",
  "migrated-plugin-notice",
  "rolldown-runtime",
  "security-tabs",
  "skills-page-grid",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:appInitialChunk|appSharedChunk|directoryBannerChunk|managementUrlChunk|migratedAccessChunk|migratedNoticeChunk|skillsGridChunk|tabsChunk)\s*\./,
);

const personalAccount = { id: "account-1", name: "Personal", structure: "personal" };
const workspaceAccount = {
  id: "account-1",
  name: "Acme",
  structure: "workspace",
  account_user_id: "workspace-user-1",
};
const draftResource = {
  gizmo: {
    id: "gpt-draft",
    author: { user_id: "user-1" },
    current_user_permission: { can_write: true, can_delete: true },
    display: { name: "", description: "Draft description", profile_picture_url: null },
    live_version: 0,
    migrated_plugin_id: null,
    share_recipient: "private",
    workspace_id: null,
  },
};
const publishedResource = {
  gizmo: {
    id: "gpt-live",
    author: { user_id: "user-1" },
    current_user_permission: { can_write: true, can_delete: true },
    display: { name: "Published GPT", description: "Published description", profile_picture_url: "avatar.png" },
    live_version: 2,
    migrated_plugin_id: null,
    share_recipient: "marketplace",
    vanity_metrics: { num_conversations_str: "2.4K" },
    workspace_id: null,
  },
};

const state = {
  accountId: "account-1",
  userId: "user-1",
  accountQuery: { data: personalAccount, isError: false },
  gates: { "2160578039": true, "1355972088": true },
  gateLoading: false,
  experiments: {
    "2562735250:enabled": true,
    "2826703856:enable_gpt_fe_controls": false,
    "2513446768:disable_gpt_updates": false,
  },
  workspacePermissions: ["chatgpt.workspace.gpt.crud"],
  migrationWorkspaceAccess: true,
  canMigrate: true,
  infiniteQuery: {},
  queryOptions: null,
  fetchCalls: [],
  refetches: 0,
  accountRefetches: [],
  nextPageCalls: 0,
  initializers: [],
  navigations: [],
  externalLinks: [],
  dialogs: [],
  modeCalls: [],
  clearCalls: [],
  stateIndex: 0,
  stateValues: [],
  stateSetCalls: [],
};
state.scope = {
  queryClient: {
    refetchQueries(input) {
      state.accountRefetches.push(input);
    },
  },
};
globalThis.__myGptsPageTest = state;

const mark = (name) => `export const ${name} = () => state.initializers.push(${JSON.stringify(name)});`;
const mocks = {
  "app-shared": [
    "const state = globalThis.__myGptsPageTest;",
    "const marker = name => () => state.initializers.push(name);",
    "export const $3 = marker('compiler'); export const $I = marker('interop'); export const FX = marker('signals');",
    "export const H3 = marker('shared-components'); export const K2 = marker('intl'); export const QI = marker('scope');",
    "export const Zh = marker('button'); export const c_ = marker('tooltip'); export const ek = marker('query');",
    "export const lw = marker('react-query'); export const qm = marker('icons'); export const $O = { ONE_MINUTE: 60000 };",
    "export const Kv = 'WorkspaceIcon'; export const Kx = 'EditIcon'; export const Xv = 'ChatsIcon'; export const YC = 'DeleteIcon';",
    "export const Y2 = 'FormattedMessage'; export const Yh = 'Button'; export const ZI = 'applicationScope';",
    "export const cb = 'PublicIcon'; export const mx = 'PrivateIcon'; export const o_ = 'Tooltip';",
    "export const I3 = () => ({ Fragment: 'Fragment', jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) });",
    "export const e6 = () => ({ useState(value) { const index = state.stateIndex++; const selected = index < state.stateValues.length ? state.stateValues[index] : value; return [selected, next => state.stateSetCalls.push({ index, next })]; } });",
    "export const LX = () => state.scope; export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });",
    "export const Jm = loader => ({ kind: 'lazy', loader });",
    "export const BX = () => ({ data: { permissions: state.workspacePermissions } });",
    "export const eL = options => { state.queryOptions = options; return state.infiniteQuery; };",
  ].join('\n'),
  "app-initial": [
    "const state = globalThis.__myGptsPageTest; const marker = name => () => state.initializers.push(name);",
    "export const $d = marker('account-checks'); export const Dft = marker('external-links'); export const Het = marker('account-runtime');",
    "export const M6t = marker('gpt-resources'); export const Oln = marker('workspace-permissions'); export const P7 = marker('route-runtime');",
    "export const Qgn = marker('auth'); export const Vzt = marker('dialog'); export const iE = marker('navigation');",
    "export const ifn = marker('gates'); export const p7 = marker('page'); export const rht = marker('account-queries');",
    "export const uT = marker('composer'); export const xtn = marker('conversation'); export const gmn = marker('uniq');",
    "export const Dln = 'workspacePermissions'; export const Qd = 'GptAvatar'; export const Ygn = 'Redirect'; export const cT = 'Inset'; export const lT = 'PageLayout';",
    "const HeaderToolbar = () => null; HeaderToolbar.Actions = 'HeaderActions'; export const f7 = { Header: 'Header', HeaderToolbar };",
    "export const _tn = '/'; export const rE = '/gpts/create';",
    "export const N6t = () => ({ accountId: state.accountId, userId: state.userId });",
    "export const ofn = key => state.gates[key] ?? false; export const sfn = () => state.gateLoading;",
    "export const afn = key => ({ get(name, fallback) { return state.experiments[key + ':' + name] ?? fallback; } });",
    "export const uht = () => state.accountQuery; export const o_n = () => destination => state.navigations.push(destination);",
    "export const ytn = id => '/g/' + id; export const Jet = (scope, mode) => state.modeCalls.push({ scope, mode });",
    "export const F7 = (scope, conversationId) => state.clearCalls.push({ scope, conversationId });",
    "export const Oft = input => state.externalLinks.push(input); export const Uzt = (scope, component, props) => state.dialogs.push({ scope, component, props });",
  ].join('\n'),
  "directory-banner": [
    "const state = globalThis.__myGptsPageTest; const marker = name => () => state.initializers.push(name);",
    "export const d = marker('directory-queries'); export const i = marker('directory-actions'); export const l = marker('directory-layout'); export const n = marker('directory-banner');",
    "export const a = 'ErrorState'; export const o = 'LoadingState'; export const r = 'CreateGptAction'; export const t = 'DirectoryBanner';",
    "export const u = input => { state.fetchCalls.push(input); return Promise.resolve({ list: { items: [], cursor: null } }); };",
  ].join('\n'),
  "security-tabs": "const state = globalThis.__myGptsPageTest; export const n = () => state.initializers.push('tabs'); export const t = 'Tabs';",
  "skills-page-grid": "const state = globalThis.__myGptsPageTest; export const r = () => state.initializers.push('skills-grid'); export const t = 'SkillsGrid';",
  "migrated-plugin-access": "const state = globalThis.__myGptsPageTest; export const i = () => state.migrationWorkspaceAccess; export const r = () => state.canMigrate;",
  "gpt-management-url": "const state = globalThis.__myGptsPageTest; export const n = () => state.initializers.push('management-url'); export const t = path => 'https://chatgpt.test' + path;",
  "migrated-plugin-notice": "const state = globalThis.__myGptsPageTest; export const r = () => state.initializers.push('migrated-notice'); export const t = 'MigratedPluginNotice';",
  "gpt-plugin-migration-dialog": "export const GptPluginMigrationDialog = 'GptPluginMigrationDialog';",
  "my-gpt-delete-dialog": "export const MyGptDeleteDialog = 'MyGptDeleteDialog';",
  "rolldown-runtime": "export {};",
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "my-gpts-page-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" }));
    },
  }],
});

const module = await import(
  "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"),
);

let assertions = 3;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function reset() {
  state.accountId = "account-1";
  state.userId = "user-1";
  state.accountQuery = { data: personalAccount, isError: false };
  state.gates = { "2160578039": true, "1355972088": true };
  state.gateLoading = false;
  state.experiments = { "2562735250:enabled": true, "2826703856:enable_gpt_fe_controls": false, "2513446768:disable_gpt_updates": false };
  state.workspacePermissions = ["chatgpt.workspace.gpt.crud"];
  state.migrationWorkspaceAccess = true;
  state.canMigrate = true;
  state.infiniteQuery = { data: { pages: [{ list: { items: [], cursor: null } }] }, isPending: false, refetch: () => { state.refetches += 1; }, fetchNextPage: () => { state.nextPageCalls += 1; } };
  state.queryOptions = null; state.fetchCalls = []; state.refetches = 0; state.accountRefetches = []; state.nextPageCalls = 0;
  state.navigations = []; state.externalLinks = []; state.dialogs = []; state.modeCalls = []; state.clearCalls = [];
  state.stateIndex = 0; state.stateValues = []; state.stateSetCalls = [];
}
function renderPage() {
  state.stateIndex = 0;
  return module.MyGptsPage();
}
function renderContent(account = state.accountQuery.data) {
  const page = renderPage();
  return { page, content: page.type(page.props), account };
}
function pageLayout(content) {
  return content.props.children[1].props.children;
}
function contentBody(content) {
  return pageLayout(content).props.children;
}
function walk(node, predicate, found = []) {
  if (node == null || typeof node !== "object") return found;
  if (predicate(node)) found.push(node);
  const children = node.props?.children;
  if (Array.isArray(children)) children.forEach((child) => walk(child, predicate, found));
  else walk(children, predicate, found);
  return found;
}
function renderFirstRow(content) {
  const fragment = contentBody(content);
  const list = fragment.props.children[0];
  const rowNode = list.props.children[0];
  return rowNode.type(rowNode.props);
}

check(Object.keys(module).length === 1 && typeof module.MyGptsPage === "function", "exports only MyGptsPage");
check(state.initializers.length === 34, "runs every published dependency initializer once");
check(new Set(state.initializers).size === 34, "does not duplicate dependency initialization");

reset(); state.gateLoading = true;
check(renderPage().type === "LoadingState", "shows loading while the feature gate resolves");
reset(); state.gates["2160578039"] = false;
const redirect = renderPage();
check(redirect.type === "Redirect" && redirect.props.to === "/" && redirect.props.replace === true, "redirects when My GPTs is unavailable");
reset(); state.accountQuery = { data: null, isError: true };
const accountError = renderPage();
check(accountError.type === "ErrorState", "shows the shared account error state");
accountError.props.onRetry();
check(state.accountRefetches[0].queryKey.join("/") === "accounts/check", "retries the account check query");
reset(); state.accountId = "other-account";
check(renderPage().type === "LoadingState", "waits for the selected account to match");

reset();
const ready = renderContent();
check(ready.page.key === "account-1", "keys content by account identity");
const layout = pageLayout(ready.content);
check(layout.type === "PageLayout", "uses the shared page layout");
check(layout.props.animateContentLayout === false && layout.props.headerVariant === "compact", "keeps the compact non-animated layout");
check(layout.props.title.props.defaultMessage === "My GPTs", "renders the My GPTs title");
check(layout.props.banner.type === "DirectoryBanner" && layout.props.banner.props.showMigrationAction === false, "renders the directory banner without its migration action");
check(ready.content.props.children[0].type === "Header", "renders the application header");
check(walk(ready.content, (node) => node.type === "CreateGptAction").length === 1, "renders the create GPT action");
check(state.queryOptions.queryKey.join("/") === "chatgpt-gizmos/account-1/my-gpts/mine", "keys the owned GPT query by account and tab");
check(state.queryOptions.staleTime === 60000 && state.queryOptions.initialPageParam === undefined, "uses the published query timing");
check(state.queryOptions.getNextPageParam({ list: { cursor: "cursor-2" } }) === "cursor-2", "continues pagination from the returned cursor");
await state.queryOptions.queryFn({ pageParam: "cursor-1", signal: "abort-signal" });
check(state.fetchCalls[0].cutId === "mine" && state.fetchCalls[0].cursor === "cursor-1" && state.fetchCalls[0].limit === 20, "fetches the selected GPT cut with the published page size");

reset(); state.infiniteQuery = { isPending: true, refetch() {}, fetchNextPage() {} };
check(contentBody(renderContent().content).type === "LoadingState", "shows loading while GPTs are pending");
reset(); state.infiniteQuery = { data: null, refetch: () => { state.refetches += 1; }, fetchNextPage() {} };
const dataError = contentBody(renderContent().content);
check(dataError.type === "ErrorState", "shows an error when GPT data is unavailable");
dataError.props.onRetry();
check(state.refetches === 1, "retries the GPT list query");

reset(); state.accountQuery = { data: workspaceAccount, isError: false };
const workspace = renderContent(workspaceAccount);
const tabs = pageLayout(workspace.content).props.controls.props.children;
check(tabs.type === "Tabs" && tabs.props.variant === "underline", "shows workspace-only underline tabs");
check(tabs.props.selectedKey === "mine" && tabs.props.tabs.length === 2, "defaults to Created by me with both workspace tabs");
tabs.props.onSelect("shared_with_me");
check(state.stateSetCalls[0].next === "shared_with_me", "updates the selected workspace tab");

reset(); state.accountQuery = { data: workspaceAccount, isError: false }; state.stateValues = ["shared_with_me"];
const sharedEmpty = contentBody(renderContent(workspaceAccount).content);
check(sharedEmpty.props.children[1].props.children.props.defaultMessage === "No GPTs have been shared with you yet", "renders the shared-with-me empty state");
check(state.queryOptions.queryKey.at(-1) === "shared_with_me", "queries the shared GPT cut after tab selection");

reset(); state.infiniteQuery = { data: { pages: [{ list: { items: [], cursor: "next" } }] }, hasNextPage: true, isFetchingNextPage: true, isFetchNextPageError: true, refetch() {}, fetchNextPage: () => { state.nextPageCalls += 1; } };
const pagination = contentBody(renderContent().content).props.children[2].props.children;
check(pagination.props.loading === true, "shows pagination progress");
check(pagination.props.children.props.defaultMessage === "Try again", "changes pagination copy after a page failure");
pagination.props.onClick();
check(state.nextPageCalls === 1, "retries the next page");

reset(); state.infiniteQuery = { data: { pages: [{ list: { items: [{ resource: draftResource }, { resource: draftResource }], cursor: null } }] }, refetch() {}, fetchNextPage() {} };
const draftContent = renderContent().content;
const draftFragment = contentBody(draftContent);
check(draftFragment.props.children[0].props.children.length === 1, "deduplicates GPTs by gizmo ID");
const draftRow = renderFirstRow(draftContent);
const draftButton = walk(draftRow, (node) => node.type === "button" && node.props?.type === "button")[0];
check(draftButton.props["aria-label"] === "Untitled", "uses the localized fallback for unnamed GPTs");
check(draftButton.props.disabled === false, "keeps writable drafts interactive");
draftButton.props.onClick({ type: "click" });
check(state.navigations[0].pathname === "/gpts/create" && state.navigations[0].search === "gizmo=gpt-draft", "opens drafts in the in-app builder");
check(walk(draftRow, (node) => node.props?.tooltipContent?.props?.defaultMessage === "Draft").length === 1, "marks unpublished GPTs as drafts");
const deleteButton = walk(draftRow, (node) => node.props?.["aria-label"] === "Delete GPT")[0];
deleteButton.props.onClick();
check(state.dialogs.at(-1).props.resource === draftResource && state.dialogs.at(-1).component.kind === "lazy", "opens the lazy delete dialog for deletable GPTs");
const migrateButton = walk(draftRow, (node) => node.type === "Button" && node.props?.size === "entityRowAction")[0];
migrateButton.props.onClick();
check(state.dialogs.at(-1).props.resource === draftResource, "opens the migration dialog for eligible GPTs");

reset(); state.infiniteQuery = { data: { pages: [{ list: { items: [{ resource: publishedResource }], cursor: null } }] }, refetch() {}, fetchNextPage() {} };
const publishedRow = renderFirstRow(renderContent().content);
const publishedButton = walk(publishedRow, (node) => node.type === "button" && node.props?.type === "button")[0];
publishedButton.props.onClick({ type: "click" });
check(state.modeCalls[0].mode === "chat" && state.clearCalls[0].conversationId === null, "prepares chat state before opening a published GPT");
check(state.navigations[0] === "/g/gpt-live", "navigates published GPTs to their conversation route");
const editButton = walk(publishedRow, (node) => node.props?.["aria-label"] === "Edit GPT")[0];
editButton.props.onClick({ type: "click" });
check(state.externalLinks[0].href === "https://chatgpt.test/gpts/editor/gpt-live", "opens published GPT editing in the external browser");
const audienceNode = walk(
  publishedRow,
  (node) => typeof node.type === "function" && node.type.name === "AudienceDetails",
)[0];
const audience = audienceNode.type(audienceNode.props);
check(walk(audience, (node) => node.type === "ChatsIcon").length === 1, "shows published usage metrics");
check(walk(audience, (node) => node.props?.defaultMessage === "{count} chats" && node.props?.values?.count === "2.4K").length === 1, "renders the formatted chat count");
check(walk(audience, (node) => node.props?.defaultMessage === "Everyone").length === 1, "renders the public audience label");

reset();
const migratedResource = { ...publishedResource, gizmo: { ...publishedResource.gizmo, migrated_plugin_id: "plugin-1" } };
state.infiniteQuery = { data: { pages: [{ list: { items: [{ resource: migratedResource }], cursor: null } }] }, refetch() {}, fetchNextPage() {} };
const migratedRow = renderFirstRow(renderContent().content);
check(walk(migratedRow, (node) => node.type === "MigratedPluginNotice" && node.props.pluginId === "plugin-1").length === 1, "shows the migrated plugin row action");
check(walk(migratedRow, (node) => node.props?.["aria-label"] === "Edit GPT")[0].props.disabled === true, "disables editing migrated GPTs");
check(walk(migratedRow, (node) => node.props?.["aria-label"] === "Delete GPT")[0].props.disabled === true, "disables deleting migrated GPTs");

reset(); state.experiments["2513446768:disable_gpt_updates"] = true; state.infiniteQuery = { data: { pages: [{ list: { items: [{ resource: draftResource }], cursor: null } }] }, refetch() {}, fetchNextPage() {} };
check(walk(renderFirstRow(renderContent().content), (node) => node.type === "button" && node.props?.type === "button")[0].props.disabled === true, "disables draft opening when GPT updates are disabled");

console.log(`${assertions} My GPTs page assertions passed`);
