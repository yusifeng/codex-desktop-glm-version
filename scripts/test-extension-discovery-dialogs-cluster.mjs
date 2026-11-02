import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
globalThis.__extensionCluster = {
  analytics: [],
  jsx,
  mentionSections: [],
  query: { data: undefined, isLoading: false },
  installedPlugins: { data: [], error: null, isLoading: false },
  pluginSearch: {
    data: [],
    error: null,
    fetchNextPage: async () => {},
    hasNextPage: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isLoading: false,
  },
};
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
            path: value.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: value }) => ({
              contents:
                value === "app-shared"
                  ? `export const I3=()=>globalThis.__extensionCluster.jsx;
       export const $O={FIVE_MINUTES:300000,ONE_MINUTE:60000};
       export const $3=()=>{}; export const FX=()=>{}; export const ek=()=>{}; export const dO=()=>{}; export const cT=()=>{}; export const Oc=()=>{};
       export const K2=()=>{}; export const If=()=>{}; export const Km=()=>{}; export const jZ=()=>{}; export const g4=()=>{}; export const QI=()=>{};
       export const e6=()=>({useRef:value=>({current:value}),useState:value=>[value,()=>{}],useEffect:effect=>effect(),useEffectEvent:callback=>callback});
       export const Bk={CODEX_APPGEN_INTERACTION_ACTION_MENTION_SUGGESTIONS_LOADED:'loaded'};
       export const Hk={CODEX_APPGEN_INTERACTION_SOURCE_AT_MENTION:'at-mention'};
       export const Eu=()=>{}; export const wu={getState:state=>state};
       export const BX=query=>query==='version-query'?'0.147.0':query==='roots-query'?{data:{roots:[]},error:null,isLoading:false}:globalThis.__extensionCluster.query;
       export const ZI={}; export const QX=(_scope,factory)=>({factory}); export const oZ=(_scope,initial)=>({initial}); export const FZ=()=>{};
       export const LX=()=>({}); export const CL=()=>({}); export const HX=()=>{};
       export const eL=()=>globalThis.__extensionCluster.pluginSearch; export const uL=value=>value; export const MZ={}; export const tY=()=>1;
       export const q4=()=>({trim(){return this},catch(){return this}}); export const E4=()=>({catch(){return this}});
       export const n4=()=>({formatMessage:message=>message.defaultMessage});
       export const jf={CheckboxItem:'MenuCheckboxItem',FlyoutSubmenuItem:'FlyoutSubmenuItem',Item:'MenuItem',ItemIcon:'MenuItemIcon',Message:'MenuMessage',SearchInput:'MenuSearchInput',Section:'MenuSection',Separator:'MenuSeparator'};
       export const Y2='FormattedMessage'; export const Gm='PluginFallback';
       export const kc='chevron'; export const lT='plugins'; export const uO='browse';`
                  : value === "rolldown-runtime"
                    ? `export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};`
                    : value === "app-initial"
                      ? `export const G3t=()=>({}); export const K3t=()=>{}; export const pdn=()=>{}; export const q6t=value=>value; export const udn={safeGet:async()=>({})};
         export const I1t=()=>{}; export const z2t=()=>{}; export const G6t=()=>{}; export const i4t=()=>{}; export const E4t=options=>options?.plugins?.filter(plugin=>(plugin.plugin.name+' '+(plugin.displayName??'')).toLowerCase().includes((options.query??'').toLowerCase()))??[]; export const pfn=()=>{}; export const Olt=()=>{}; export const _v=()=>{};
         export const HZ=()=>({view:{state:{active:true,activation:'typed',kind:'at-mention',trigger:'@',range:{from:7}}}}); export const UZ=(value,selector)=>selector(value);
         export const Man=()=>{}; export const Nan=()=>{}; export const VZ=()=>{}; export const jan='sites'; export const Pan=(_scope,event)=>globalThis.__extensionCluster.analytics.push(event);
         export const m4t=['plugins']; export const H6t={}; export const dv=value=>({id:value.plugin.id,...value}); export const Dlt='PluginLogo';
         export const ugn='local'; export const Cht=value=>value; export const P6t=()=>({authMethod:'apikey'}); export const Ifn='version-query'; export const bcn='roots-query';
         export const c4t=()=>globalThis.__extensionCluster.installedPlugins; export const e8t=()=>({}); export const afn=()=>({value:true}); export const Bv=()=>({hiddenPluginIds:[]});
         export const L4t=()=>true; export const jv=value=>value; export const R3t=value=>value.id; export const gv=(value)=>value;
         export const LWt=plugin=>({displayName:plugin.displayName??plugin.plugin.name,iconSmall:null}); export const wDt=plugin=>plugin.plugin.name;`
                      : value === "app-primary"
                        ? `export const Al=()=>{}; export const Gl=source=>source?.kind==='specialized'; export const Hl=sections=>sections;
           export const Sl=input=>({kind:'threads',input}); export const Ul=()=>{}; export const Wl=()=>{}; export const bl=()=>{}; export const xl=()=>{};
           export const jl=()=>({sections:globalThis.__extensionCluster.mentionSections}); export const vl='SpecializedMentionList'; export const yl='ComposerMentionList';`
                        : value === "connect-plugins-submenu-item"
                          ? "export const n=()=>{};export const t='ConnectPluginsSubmenuItem';"
                          : value === "use-search-plugins"
                            ? "export const t=()=>{};"
                            : "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}
const nodes = (root) => {
  const out = [];
  const visit = (v) => {
    if (v == null || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(visit);
    if ("type" in v && "props" in v) out.push(v);
    visit(v.props?.children);
  };
  visit(root);
  return out;
};

const canonical = await bundle("canonical-plugin-query");
canonical.n();
const canonicalQuery = canonical.t("app-1", "account-1");
assert.deepEqual(canonicalQuery.queryKey, [
  "plugins",
  "canonical-app",
  "account-1",
  "app-1",
]);
assert.equal(canonicalQuery.enabled, true);
assert.equal(canonical.t("app-1", null).enabled, false);
assertReleaseOwner("plugin-skill-queries");

const ecosystem = await bundle("ecosystem-widget-queries");
ecosystem.n();
const widget = ecosystem.t({
  accountId: "a",
  appUri: "ui://widget",
  hostId: "local",
});
assert.equal(widget.enabled, true);
assert.equal(widget.staleTime, Infinity);
assert.equal(ecosystem.t({ appUri: "", hostId: "local" }).enabled, false);
const search = await bundle("use-search-plugins");
search.t();
assert.equal(search.n({ searchTerm: "" }).data, undefined);
globalThis.__extensionCluster.pluginSearch = {
  data: [
    {
      plugin: {
        plugin: { id: "drive", enabled: true, installed: false },
        logoPath: "drive.png",
      },
      pluginServicePlugin: null,
    },
  ],
  error: null,
  fetchNextPage: async () => {},
  hasNextPage: true,
  isFetchNextPageError: false,
  isFetchingNextPage: false,
  isLoading: false,
};
const searchResult = search.n({
  directoryTab: "workspace",
  hostId: "local",
  limit: 20,
  searchTerm: "drive",
});
assert.equal(searchResult.data[0].id, "drive");
assert.equal(searchResult.data[0].logoPath, "drive.png");
assert.equal(searchResult.hasNextPage, true);
const connect = await bundle("connect-plugins-submenu-item");
connect.n();
let connected = null;
let directoryOpened = false;
const featured = [
  {
    id: "calendar",
    displayName: "Calendar",
    remotePluginId: "remote-calendar",
  },
  { id: "drive", displayName: "Drive" },
];
const connectTree = connect.t({
  featuredPlugins: featured,
  label: "Connect plugins",
  onConnectPlugin(plugin) {
    connected = plugin.id;
  },
  onOpenPluginDirectory() {
    directoryOpened = true;
  },
  workRecommendationsHostId: "local",
});
assert.equal(connectTree.type, "FlyoutSubmenuItem");
assert.equal(connectTree.props.label, "Connect plugins");
const connectItems = nodes(connectTree).filter(
  (node) => node.type === "MenuItem",
);
assert.equal(connectItems.length, 3);
assert.equal(
  connectItems[0].props["data-plugin-impression-id"],
  "remote-calendar",
);
connectItems[0].props.onSelect();
assert.equal(connected, "calendar");
connectItems.at(-1).props.onSelect();
assert.equal(directoryOpened, true);
assert.equal(
  nodes(connectTree).some((node) => node.type === "MenuSeparator"),
  true,
);
const mention = await bundle("primary-composer-at-mention-list");
globalThis.__extensionCluster.mentionSections = [
  { items: [{ key: "plugin:plugin://sites" }] },
];
const typedSitesMentionRef = { current: 7 };
const mentionWrapper = mention.PrimaryComposerAtMentionList({
  hostId: "local",
  query: "sites",
  source: { kind: "primary" },
  typedSitesMentionRef,
});
const mentionTree = mentionWrapper.type(mentionWrapper.props);
assert.equal(mentionTree.type, "ComposerMentionList");
assert.equal(
  mentionTree.props.sections[0].items[0].key,
  "plugin:plugin://sites",
);
assert.equal(globalThis.__extensionCluster.analytics.at(-1).action, "loaded");
const specialized = mention.PrimaryComposerAtMentionList({
  source: { kind: "specialized" },
});
assert.equal(specialized.type, "SpecializedMentionList");
const picker = await bundle("plugin-picker-menu-content");
picker.a();
picker.r();
picker.n();
const plugins = [
  { plugin: { id: "a", name: "Alpha" }, displayName: "Alpha plugin" },
  { plugin: { id: "b", name: "Beta" }, displayName: "Beta plugin" },
];
const usage = {};
picker.o(
  {
    get(signal) {
      return signal === undefined ? null : "account-1";
    },
    set(_family, accountId, update) {
      usage[accountId] = update(usage[accountId] ?? {});
    },
  },
  plugins[0],
);
assert.equal(usage["account-1"].Alpha, 1);
let changed = null;
const pickerTree = picker.t({
  connectedPlugins: plugins,
  defaultConnectedPluginLimit: 10,
  featuredPlugins: [],
  hasLoadError: false,
  onConnectPlugin() {},
  onOpenPluginDirectory() {},
  onPluginSelectionChange(plugin, selected) {
    changed = [plugin.plugin.id, selected];
  },
  selectedPluginIds: ["a"],
  workRecommendationsHostId: "local",
});
const pickerItems = nodes(pickerTree).filter((node) => node.props.plugin?.plugin?.id);
assert.equal(pickerItems.length, 2);
const renderedSecondPlugin = pickerItems[1].type(pickerItems[1].props);
assert.equal(renderedSecondPlugin.type, "MenuCheckboxItem");
renderedSecondPlugin.props.onCheckedChange(true);
assert.deepEqual(changed, ["b", true]);
assertReleaseOwner("plugin-skill-preview");

assertReleaseOwner("mcp-extension-quick-action-dialog-core");

assertReleaseOwner("connector-post-connect-dialog");
console.log("36 extension discovery and dialogs cluster assertions passed");
