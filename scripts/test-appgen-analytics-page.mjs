import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenAnalyticsTest = {
  initialized: [],
  projectId: "site-1",
  gate: true,
  navigated: [],
  queries: [],
  queryResults: new Map(),
  toolCalls: [],
  now: Date.UTC(2026, 8, 30, 10, 25),
  states: [],
  stateIndex: 0,
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
});

const moduleSource = await readFile(
  path.join(ROOT, "src/renderer/appgen-analytics-page/index.ts"),
  "utf8",
);

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-analytics-page/index.ts")],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{
    name: "mock-renderer-chunks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ loader: "js", contents: ({
        "rolldown-runtime": "export const n = {};",
        "app-shared": `
          const s = globalThis.__appgenAnalyticsTest;
          const init = (name) => () => s.initialized.push(name);
          export const $3=init("runtime"), FX=init("signals"), QI=init("scope"), K2=init("components"), h4=init("intl"), xD=init("schemas");
          export const $O={FIVE_MINUTES:300000}, ZI={};
          export const I3=()=>s.jsx;
          export const e6=()=>({useState(initial){const index=s.stateIndex++; if(!(index in s.states)) s.states[index]=initial; return [s.states[index], value=>{s.states[index]=typeof value==="function"?value(s.states[index]):value;}];}});
          export const QX=(scope, options)=>{const family={options};s.queries.push(family);return family;};
          export const BX=(family,param)=>s.queryResults.get(family) ?? {data:undefined,isError:false,isFetching:false,refetch(){s.refetched=(s.refetched??0)+1;}};
          export const Qh="Spinner",Y2="FormattedMessage",Yh="Button";
          export const Z4=()=>({source:"analytics"});
          export const n4=()=>({locale:"en",formatNumber:n=>String(n),formatDate:n=>"date-"+n,formatDateTimeRange:(a,b)=>a+"-"+b,formatMessage:d=>d.defaultMessage});
        `,
        "app-initial": `
          const s=globalThis.__appgenAnalyticsTest; const init=name=>()=>s.initialized.push(name);
          export const Qgn=init("router"),_an=init("routing"),ifn=init("gates"),lnn=init("queries");
          export const fan=async(name,args,context)=>{s.toolCalls.push({name,args,context});return s.toolResponses?.[name];};
          export const l_n=()=>({projectId:s.projectId}); export const o_n=()=>to=>s.navigated.push(to); export const ofn=()=>s.gate;
          export const inn=id=>"/sites/"+id+"/analytics"; export const rnn=id=>"/sites/"+id+"/analytics/events";
          export const Ygn="Navigate",ket="EmptyState";
        `,
        "security-tabs": `export const n=()=>globalThis.__appgenAnalyticsTest.initialized.push("tabs");export const t="Tabs";`,
        "appgen-site-detail-layout": `export const n=()=>globalThis.__appgenAnalyticsTest.initialized.push("layout");export const t="SiteDetailLayout";`,
        "i18n": `const init=n=>()=>globalThis.__appgenAnalyticsTest.initialized.push(n);export const a="Chart",i=init("chart-i18n"),o=init("chart-locale"),r=init("chart-messages"),n="ChartLocale";`,
        "chart-stores": `export const n=()=>globalThis.__appgenAnalyticsTest.initialized.push("chart-stores");export const r=()=>({});export const t=()=>({});`,
      }[name] ?? "export {};") }));
    },
  }],
});

const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function resetRenderState(values = []) { state.states = values; state.stateIndex = 0; }
function render(node) {
  if (node == null || typeof node !== "object") return node;
  if (typeof node.type === "function") return render(node.type(node.props));
  return node;
}
function children(node) { const value=node?.props?.children; return Array.isArray(value)?value:value==null?[]:[value]; }
function find(node, predicate) {
  const current=render(node); if (current==null || typeof current!=="object") return null;
  if (predicate(current)) return current;
  for (const child of children(current)) { const match=find(child,predicate); if(match) return match; }
  return null;
}

check(typeof module.AppgenAnalyticsPage === "function", "exports AppgenAnalyticsPage");
check(Object.keys(module).join(",") === "AppgenAnalyticsPage", "preserves the single public export");
check(state.queries.length === 3, "creates all three analytics query families");
check(state.initialized.includes("tabs") && state.initialized.includes("layout"), "initializes navigation and layout dependencies");
check(state.initialized.includes("chart-stores") && state.initialized.includes("chart-i18n"), "initializes chart dependencies");
const forbiddenAnyAnnotations = [":" + " any", " as" + " any"];
check(
  forbiddenAnyAnnotations.every((annotation) => !moduleSource.includes(annotation)),
  "does not introduce any",
);
check(!/\b(?:appSharedChunk|appInitialChunk|tabsChunk|siteDetailLayoutChunk|chartI18nChunk|chartStoresChunk)\.[A-Za-z_$]/.test(moduleSource), "does not consume namespace members directly");
for (const dependency of ["rolldown-runtime","app-shared","app-initial","security-tabs","appgen-site-detail-layout","i18n","chart-stores"]) check(moduleSource.includes(`@rchunk/${dependency}`), `keeps ${dependency} dependency`);

const [overviewFamily,catalogFamily,eventFamily]=state.queries;
let options=overviewFamily.options({projectId:"site-1",range:"7d",granularity:"auto"});
check(options.queryKey.join("|") === "appgen|analytics|overview|site-1|7d|hourly", "uses hourly granularity for 7d overview");
check(options.retry === false && options.staleTime === 300000, "disables retries and caches overview for five minutes");
const originalNow=Date.now; Date.now=()=>state.now;
state.toolResponses={
  "sites.get_site_analytics_overview":{project_id:"site-1",window:{start_time_ms:1,end_time_ms:2,granularity:"1h"},overall:{page_views:{value:9},unique_visitors:{value:4}},timeseries:{points:[{timestamp_ms:1,page_views:9,unique_visitors:4}]},top_pages:[{path:"/",page_views:9,unique_visitors:4}]},
  "sites.list_site_analytics_events":{project_id:"site-1",event_names:["signup","purchase"]},
  "sites.query_site_analytics_event":{project_id:"site-1",event_name:"signup",window:{start_time_ms:1,end_time_ms:2,granularity:"1d"},overall:{occurrences:{value:6},unique_visitors:{value:3}},timeseries:{points:[{timestamp_ms:1,occurrences:6}]}}
};
const overview=await options.queryFn();
check(overview.summary.pageViews===9 && overview.summary.uniqueVisitors===4, "parses overview metrics");
check(overview.traffic[0].pageViews===9 && overview.topPages[0].path==="/", "parses traffic and top pages");
let call=state.toolCalls.at(-1);
check(call.name==="sites.get_site_analytics_overview" && call.args.granularity==="1h", "calls the overview tool with hourly granularity");
check(call.args.end_time_ms % 3600000 === 0, "rounds hourly overview end to the next hour");
options=catalogFamily.options("site-1"); const catalog=await options.queryFn();
check(options.queryKey.join("|")==="appgen|analytics|events|site-1", "builds the event catalog key");
check(catalog.eventNames.join(",")==="signup,purchase", "parses custom event names");
call=state.toolCalls.at(-1); check(call.name==="sites.list_site_analytics_events", "calls the event catalog tool");
check(call.args.end_time_ms % 86400000 === 28800000, "aligns daily windows to the 08:00 UTC anchor");
options=eventFamily.options({projectId:"site-1",eventName:"signup",range:"30d"}); const event=await options.queryFn();
check(options.queryKey.join("|")==="appgen|analytics|event|site-1|signup|30d", "builds the event aggregate key");
check(event.totalOccurrences===6 && event.occurrences[0].count===6, "parses event totals and series");
check(state.toolCalls.at(-1).name==="sites.query_site_analytics_event", "calls the event aggregate tool");
Date.now=originalNow;

state.projectId=null; resetRenderState(); let node=render(module.AppgenAnalyticsPage({section:"overview"}));
check(node.type==="Navigate" && node.props.to==="/sites" && node.props.replace===true, "redirects when project id is missing");
state.projectId="site-1"; state.gate=true; resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"overview"}));
check(node.type==="SiteDetailLayout" && node.props.selectedTab==="analytics", "renders inside the analytics site layout");
let page=render(node.props.children()); let tabs=find(page,n=>n.type==="Tabs");
check(tabs.props.selectedKey==="overview" && tabs.props.tabs.length===2, "shows overview and events tabs when eligible");
tabs.props.onSelect("events"); check(state.navigated.at(-1)==="/sites/site-1/analytics/events", "navigates to the events section");
tabs.props.onSelect("overview"); check(state.navigated.at(-1)==="/sites/site-1/analytics", "navigates back to overview");
state.gate=false; resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"overview"})); page=render(node.props.children());
check(find(page,n=>n.type==="Tabs")===null, "hides section navigation when the eligibility gate is off");

state.gate=true; state.queryResults.set(overviewFamily,{data:undefined,isError:false,refetch(){}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"overview"})); page=render(node.props.children());
check(find(page,n=>n.type==="Spinner")!=null, "shows overview loading state");
let retries=0; state.queryResults.set(overviewFamily,{data:undefined,isError:true,refetch(){retries++;}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"overview"})); page=render(node.props.children());
const retry=find(page,n=>n.type==="Button"); retry.props.onClick(); check(retries===1, "retries a failed overview request");
const overviewData={...overview,summary:{pageViews:0,uniqueVisitors:0},traffic:[],topPages:[]}; state.queryResults.set(overviewFamily,{data:overviewData,isError:false,refetch(){}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"overview"})); page=render(node.props.children());
check(find(page,n=>n.props?.defaultMessage==="No traffic in this period")!=null, "shows the traffic empty state");
check(find(page,n=>n.props?.defaultMessage==="No page views in this period")!=null, "shows the top-pages empty state");
state.queryResults.set(overviewFamily,{data:overview,isError:false,refetch(){}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"overview"})); page=render(node.props.children());
check(find(page,n=>n.type==="Chart")!=null, "renders the overview chart for traffic data");
check(find(page,n=>n.type==="table")!=null, "renders the top pages table");

state.queryResults.set(catalogFamily,{data:undefined,isError:false,refetch(){}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"events"})); page=render(node.props.children());
check(find(page,n=>n.type==="Spinner")!=null, "shows event catalog loading state");
state.queryResults.set(catalogFamily,{data:{projectId:"site-1",eventNames:[]},isError:false,refetch(){}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"events"})); page=render(node.props.children());
check(find(page,n=>n.type==="EmptyState")!=null, "shows the no-events empty state");
state.queryResults.set(catalogFamily,{data:{projectId:"site-1",eventNames:["signup"]},isError:false,refetch(){}}); state.queryResults.set(eventFamily,{data:event,isError:false,isFetching:false,refetch(){retries++;}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"events"})); page=render(node.props.children());
check(find(page,n=>n.type==="form")!=null, "renders event and date controls");
check(find(page,n=>n.type==="Chart")!=null, "renders the event occurrences chart");
const form=find(page,n=>n.type==="form"); const before=retries; form.props.onSubmit({preventDefault(){}}); check(retries===before+1, "refetches when running an unchanged event query");
state.queryResults.set(eventFamily,{data:{...event,totalOccurrences:0,occurrences:[]},isError:false,isFetching:false,refetch(){}}); resetRenderState(); node=render(module.AppgenAnalyticsPage({section:"events"})); page=render(node.props.children());
check(find(page,n=>n.props?.defaultMessage==="No occurrences in this period")!=null, "shows the zero-occurrences empty state");

console.log(`${assertions} Appgen analytics assertions passed`);
