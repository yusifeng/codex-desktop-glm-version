import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
globalThis.__extensionCluster = {
  jsx,
  query: { data: undefined, isLoading: false },
  installedPlugins: { data: [], error: null, isLoading: false },
  pluginSearch: { data: [], error: null, fetchNextPage: async()=>{}, hasNextPage: false, isFetchNextPageError: false, isFetchingNextPage: false, isLoading: false },
};
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ contents: value === "app-shared"
    ? `export const I3=()=>globalThis.__extensionCluster.jsx;
       export const $O={FIVE_MINUTES:300000,ONE_MINUTE:60000};
       export const $3=()=>{}; export const FX=()=>{}; export const ek=()=>{};
       export const e6=()=>({useRef:value=>({current:value})});
       export const BX=query=>query==='version-query'?'0.147.0':query==='roots-query'?{data:{roots:[]},error:null,isLoading:false}:globalThis.__extensionCluster.query;
       export const ZI={}; export const QX=(_scope,factory)=>({factory}); export const FZ=()=>{};
       export const LX=()=>({}); export const CL=()=>({}); export const HX=()=>{};
       export const eL=()=>globalThis.__extensionCluster.pluginSearch; export const uL=value=>value; export const MZ={}; export const tY=()=>1;
       export const q4=()=>({trim(){return this},catch(){return this}}); export const E4=()=>({catch(){return this}});
       export const jf={FlyoutSubmenuItem:'FlyoutSubmenuItem',Item:'MenuItem',ItemIcon:'MenuItemIcon',Message:'MenuMessage',Section:'MenuSection',Separator:'MenuSeparator'};
       export const Y2='FormattedMessage'; export const Gm='PluginFallback';
       export const kc='chevron'; export const lT='plugins'; export const uO='browse';`
    : value === "app-initial"
      ? `export const G3t=()=>({}); export const K3t=()=>{}; export const pdn=()=>{}; export const q6t=value=>value; export const udn={safeGet:async()=>({})};
         export const m4t=['plugins']; export const H6t={}; export const dv=value=>({id:value.plugin.id,...value}); export const Dlt='PluginLogo';
         export const ugn='local'; export const Cht=value=>value; export const P6t=()=>({authMethod:'apikey'}); export const Ifn='version-query'; export const bcn='roots-query';
         export const c4t=()=>globalThis.__extensionCluster.installedPlugins; export const e8t=()=>({}); export const afn=()=>({value:true}); export const Bv=()=>({hiddenPluginIds:[]});
         export const L4t=()=>true; export const jv=value=>value; export const R3t=value=>value.id; export const gv=(value)=>value;`
      : "export {};", loader: "js" })); } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
const nodes = (root) => { const out=[]; const visit=(v)=>{ if(v==null||typeof v!=="object") return; if(Array.isArray(v)) return v.forEach(visit); if("type" in v&&"props" in v) out.push(v); visit(v.props?.children); }; visit(root); return out; };

const canonical = await bundle("canonical-plugin-query"); canonical.n(); const canonicalQuery = canonical.t("app-1", "account-1"); assert.deepEqual(canonicalQuery.queryKey, ["plugins", "canonical-app", "account-1", "app-1"]); assert.equal(canonicalQuery.enabled, true); assert.equal(canonical.t("app-1", null).enabled, false);
const queries = await bundle("plugin-skill-queries"); queries.i(); assert.equal(queries.n({ connector_id: "drive", auth_status: "admin_connected" }), "drive"); assert.equal(queries.n({ connector_id: "drive", auth_status: "disconnected" }), null); assert.deepEqual(queries.t("plugin", "skill").queryKey, ["plugins", "skill", "plugin", "skill"]); assert.deepEqual(queries.r("plugin").queryKey, ["plugins", "plugin"]);
const ecosystem = await bundle("ecosystem-widget-queries"); ecosystem.n(); const widget = ecosystem.t({ accountId: "a", appUri: "ui://widget", hostId: "local" }); assert.equal(widget.enabled, true); assert.equal(widget.staleTime, Infinity); assert.equal(ecosystem.t({ appUri: "", hostId: "local" }).enabled, false);
const search = await bundle("use-search-plugins"); search.t(); assert.equal(search.n({searchTerm:""}).data,undefined); globalThis.__extensionCluster.pluginSearch={data:[{plugin:{plugin:{id:"drive",enabled:true,installed:false},logoPath:"drive.png"},pluginServicePlugin:null}],error:null,fetchNextPage:async()=>{},hasNextPage:true,isFetchNextPageError:false,isFetchingNextPage:false,isLoading:false}; const searchResult=search.n({directoryTab:"workspace",hostId:"local",limit:20,searchTerm:"drive"}); assert.equal(searchResult.data[0].id,"drive"); assert.equal(searchResult.data[0].logoPath,"drive.png"); assert.equal(searchResult.hasNextPage,true);
const connect = await bundle("connect-plugins-submenu-item"); connect.n(); let connected=null; let directoryOpened=false; const featured=[{id:"calendar",displayName:"Calendar",remotePluginId:"remote-calendar"},{id:"drive",displayName:"Drive"}]; const connectTree=connect.t({ featuredPlugins:featured, label:"Connect plugins", onConnectPlugin(plugin){connected=plugin.id;}, onOpenPluginDirectory(){directoryOpened=true;}, workRecommendationsHostId:"local" }); assert.equal(connectTree.type,"FlyoutSubmenuItem"); assert.equal(connectTree.props.label,"Connect plugins"); const connectItems=nodes(connectTree).filter(node=>node.type==="MenuItem"); assert.equal(connectItems.length,3); assert.equal(connectItems[0].props["data-plugin-impression-id"],"remote-calendar"); connectItems[0].props.onSelect(); assert.equal(connected,"calendar"); connectItems.at(-1).props.onSelect(); assert.equal(directoryOpened,true); assert.equal(nodes(connectTree).some(node=>node.type==="MenuSeparator"),true);
const picker = await bundle("plugin-picker-menu-content"); picker.i(); const selected = [{ id: "a", name: "A", selected: true }, { id: "b", name: "B" }]; assert.deepEqual(picker.a(selected), ["a"]); assert.equal(picker.o(selected, "b")[1].selected, true); let changed=null; const pickerTree=picker.t({ plugins: selected, onChange(ids){changed=ids;} }); assert.equal(nodes(pickerTree).filter((node)=>node.type==="button").length, 2); nodes(pickerTree).filter((node)=>node.type==="button")[1].props.onClick(); assert.deepEqual(changed, ["a", "b"]);
const preview = await bundle("plugin-skill-preview"); preview.n(); const previewTree=preview.t({ pluginId: "p", skillName: "summarize", title: "Summarize", description: "Makes summaries" }); assert.equal(previewTree.props["data-plugin-id"], "p"); assert.equal(nodes(previewTree).find((node)=>node.type==="h2").props.children, "Summarize"); assert.equal(preview.r("# Skill").type, "pre"); assert.equal(preview.r(null), null);
const quick = await bundle("mcp-extension-quick-action-dialog-core"); quick.n(); let opened=false; const quickTree=quick.t({ action: { name: "Open calendar" }, onOpen(value){opened=value;}, view: "widget" }); assert.equal(nodes(quickTree).find((node)=>node.type==="button").props.children, "Open calendar"); nodes(quickTree).find((node)=>node.type==="button").props.onClick(); assert.equal(opened, true); assert.equal(nodes(quickTree).find((node)=>node.type==="section").props.children, "widget");
const postConnect = await bundle("connector-post-connect-dialog"); assert.equal(postConnect.ConnectorPostConnectDialog({ open: false }), null); let continued=false; const dialog=postConnect.ConnectorPostConnectDialog({ connectorName: "Drive", onContinue(){continued=true;} }); assert.equal(dialog.props.role, "dialog"); assert.equal(nodes(dialog).find((node)=>node.type==="h2").props.children, "Drive connected"); nodes(dialog).find((node)=>node.type==="button"&&node.props.children==="Continue").props.onClick(); assert.equal(continued, true);
console.log("31 extension discovery and dialogs cluster assertions passed");
