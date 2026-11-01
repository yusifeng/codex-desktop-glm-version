import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeMock =
  "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};";
const sharedMock = String.raw`
export const BX = (_selector, input) => input.fallbackState;
export const FC = props => ({ component: "gitlab", props });
export const FX=()=>{}, QI=()=>{}, lw=()=>{}, wL=()=>{};
export const ZI = { key: "application-scope" };
export const aW = value => "root:" + value;
export const iW = value => "cwd:" + value;
const React = { createElement: (type, props = {}) => ({ type: typeof type === "function" ? "component" : type, props }) };
export const e6 = () => React;
export const rZ = (_scope, selector) => selector;
export const $3 = () => ({ c: size => Array(size).fill(Symbol.for("react.memo_cache_sentinel")) });
`;
const initialMock = String.raw`
export const Dyt={key:"host"}, Syt={key:"cwd"}, mpn={key:"intl"};
export const _g="pull-request-route", gy={key:"account-query"}, hdt={key:"repository-query"}, gf={key:"status-query"};
export const Cdt=()=>{}, E$=()=>{}, Ef=()=>{}, PXt=()=>{}, Wvt=()=>{}, Yy=()=>{}, _3t=()=>{}, _vt=()=>{}, byt=()=>{}, hf=()=>{}, hg=()=>{}, i5t=()=>{}, pdt=()=>{}, ppn=()=>{}, vg=()=>{}, yy=()=>{};
export const FXt=()=>true;
export const T$=props=>props, g3t=props=>props, w$=props=>props;
export const Cf=async(_scope,hostId)=>({hostId,name:"gitlab"});
export const s5t=url=>{try{const value=new URL(url);const [owner,repository,_pull,number]=value.pathname.split("/").filter(Boolean);return{hostname:value.hostname,owner,repository,number:Number(number)}}catch{return null}};
export const X8t=pr=>"https://"+pr.hostname+"/"+pr.owner+"/"+pr.repository+"/pull/"+pr.number;
export const a5t=(candidate,pr)=>candidate.url===X8t(pr);
export const _y=async()=>({title:"Canonical title"});
export const wf=async()=>({title:"GitLab title"});
export const Xy=async(_operation,input)=>({status:"success",items:[{cwd:input.cwd,headBranch:"feature",number:Number(input.searchQuery),state:"open",title:"Board title",url:"https://github.com/acme/repo/pull/"+input.searchQuery}]});
export const xdt=value=>value;
export const of=()=> "ready";
export const sf=input=>input.hasMergeConflicts?"conflicts":input.status;
export const gvt=()=>null;
export const Gvt=(_scope,_api,descriptor)=>globalThis.__prTabCalls.push({type:"open",descriptor});
export const vvt=(_scope,target)=>globalThis.__prTabCalls.push({type:"focus",target});
export const gg=handlers=>handlers;
`;

async function bundle(entry, exact) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "pull-request-tab-runtime",
        setup(build) {
          build.onResolve(
            { filter: exact ? /^\.\/.*\.js$/ : /^@rchunk\// },
            ({ path: modulePath }) => ({
              path: modulePath.includes("rolldown-runtime")
                ? "runtime"
                : modulePath.includes("app-shared")
                  ? "shared"
                  : "initial",
              namespace: "mock",
            }),
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: id }) => ({
            contents:
              id === "runtime"
                ? runtimeMock
                : id === "shared"
                  ? sharedMock
                  : initialMock,
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${exact ? "exact" : "semantic"}`
  );
}

const semantic = await bundle(
  "src/renderer/open-thread-pull-request-side-panel-tab/index.ts",
  false,
);
const exact = await bundle(
  ".reference/app-original/webview/assets/open-thread-pull-request-side-panel-tab-4cc87983599f.js",
  true,
);
semantic.t();
exact.t();

function createScope({
  cwd = "/repo",
  hostId = "host-1",
  routeKind = "local-thread",
} = {}) {
  return {
    value: { routeKind },
    get(signal) {
      if (signal?.key === "cwd") return cwd;
      if (signal?.key === "host") return hostId;
      if (signal?.key === "intl")
        return {
          formatMessage: (_descriptor, values) => `PR #${values.number}`,
        };
    },
    query: {
      async getOrFetch(query) {
        if (query?.key === "account-query")
          return { status: "success", account: { hostId } };
        if (query?.key === "repository-query") return { root: "/repo-root" };
        return null;
      },
    },
  };
}
const normalize = (value) => {
  if (typeof value === "function") return "[function]";
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalize(item)]),
    );
  return value;
};
async function capture(operation) {
  globalThis.__prTabCalls = [];
  const result = await operation();
  return { result, calls: normalize(globalThis.__prTabCalls) };
}

const boardOptions = {
  provider: "github",
  hostId: "host-1",
  item: {
    cwd: "/repo",
    headBranch: "feature",
    number: 42,
    state: "open",
    title: "Board title",
    url: "https://github.com/acme/repo/pull/42",
  },
  repo: "github.com/acme/repo",
  repositoryTarget: { cwd: "/repo", hostId: "host-1", root: "/repo-root" },
  statusKey: {
    cwd: "/repo",
    headBranch: "feature",
    hostId: "host-1",
    operationSource: "sidebar_task_pr_chip",
    url: "https://github.com/acme/repo/pull/42",
  },
};
assert.deepEqual(
  await capture(() =>
    semantic.r(createScope(), boardOptions, true, "right", {
      insertPosition: 2,
    }),
  ),
  await capture(() =>
    exact.r(createScope(), boardOptions, true, "right", { insertPosition: 2 }),
  ),
);

const canonicalOptions = {
  request: {
    provider: "github",
    account: { hostId: "host-1" },
    pullRequest: {
      hostname: "github.com",
      owner: "acme",
      repository: "repo",
      number: 42,
    },
  },
  repositoryTarget: { cwd: "/repo", hostId: "host-1", root: "/repo-root" },
  title: "Canonical title",
};
assert.deepEqual(
  await capture(() =>
    semantic.n(createScope(), canonicalOptions, {
      revealAndFocus: true,
      target: "left",
    }),
  ),
  await capture(() =>
    exact.n(createScope(), canonicalOptions, {
      revealAndFocus: true,
      target: "left",
    }),
  ),
);

const canonicalRoute = {
  cwd: "/repo",
  hostId: "host-1",
  repositoryRoot: "/repo-root",
  source: "canonical",
  url: "https://github.com/acme/repo/pull/42",
};
assert.deepEqual(
  await capture(() =>
    semantic.i(createScope(), canonicalRoute, {
      revealAndFocus: true,
      target: "right",
    }),
  ),
  await capture(() =>
    exact.i(createScope(), canonicalRoute, {
      revealAndFocus: true,
      target: "right",
    }),
  ),
);
const boardRoute = { ...canonicalRoute, source: "board" };
assert.deepEqual(
  await capture(() =>
    semantic.i(createScope(), boardRoute, {
      revealAndFocus: false,
      target: "left",
      tabId: "restored-pr",
    }),
  ),
  await capture(() =>
    exact.i(createScope(), boardRoute, {
      revealAndFocus: false,
      target: "left",
      tabId: "restored-pr",
    }),
  ),
);
assert.equal(
  await semantic.i(createScope({ routeKind: "home" }), canonicalRoute, {}),
  false,
);
assert.equal(
  await exact.i(createScope({ routeKind: "home" }), canonicalRoute, {}),
  false,
);
assert.equal(
  await semantic.i(createScope({ cwd: "/other" }), canonicalRoute, {}),
  false,
);
assert.equal(
  await exact.i(createScope({ cwd: "/other" }), canonicalRoute, {}),
  false,
);

console.log("8 pull-request side-panel tab parity assertions passed");
