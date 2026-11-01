import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeMock =
  "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};";
const sharedMock = String.raw`
const component = id => Object.assign(props => ({ id, props }), { __id: id });
export const FX=()=>{}, H3=()=>{}, K2=()=>{}, Z3=()=>{}, Zh=()=>{}, c_=()=>{}, gw=()=>{}, lk=()=>{}, mw=()=>{}, qm=()=>{}, ug=()=>{};
export const _w="feedback-16", hw="feedback-20", pk={key:"toast"};
export const Q3={error:(message,details)=>globalThis.__feedbackCalls.push({type:"error",message,details})};
export const Y2=component("formatted-message"), Yh=component("button"), lg=component("icon"), o_=component("tooltip");
export const Jm=(loader,_options)=>Object.assign(props=>({id:"lazy-dialog",loader,props}),{__id:"lazy-dialog"});
export const V3=loader=>loader();
export const LX=()=>globalThis.__feedbackScope;
export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});
const React={useRef:value=>({current:value})};
export const e6=()=>React;
const jsx=(type,props)=>({type:typeof type==="function"?(type.__id??"component"):type,props});
export const I3=()=>({jsx,jsxs:jsx,Fragment:"fragment"});
export const $3=()=>({c:size=>Array(size).fill(Symbol.for("react.memo_cache_sentinel"))});
`;
const initialMock = String.raw`
const component = id => Object.assign(props => ({ id, props }), { __id: id });
export const $en={key:"scope"}, gfn={key:"plan"};
export const $rt=component("manual-button"), Vi=component("dialog-error");
export const Hi=()=>{}, Vzt=()=>{}, itn=()=>{}, mnt=()=>{}, pfn=()=>{}, rit=()=>{};
export const rtn=()=> "correlation-1";
export const pnt={appInfo:{get:async()=>({version:"1.2.3"})}};
export const Uzt=(_scope,componentValue,props)=>{globalThis.__feedbackDialog={component:componentValue,props};globalThis.__feedbackCalls.push({type:"open",artifacts:props.artifacts,showArtifactSelector:props.showArtifactSelector})};
export const zzt=()=>globalThis.__feedbackCalls.push({type:"close"});
`;
const thumbMock = String.raw`
export const n=()=>{};
export const t=Object.assign(props=>props,{__id:"thumb-mixed"});
export default t;
`;
const dialogMock =
  "export const ArtifactFeedbackDialog=Object.assign(props=>props,{__id:'artifact-dialog'});";
const uploadMock = String.raw`
export const startFeedbackUpload=options=>{globalThis.__feedbackUpload=options;globalThis.__feedbackCalls.push({type:"upload",hostId:options.hostId,initialCorrelationId:options.initialCorrelationId});return{dismiss(){},completion:Promise.resolve("uploaded")}};
`;
const submitMock = String.raw`
export const submitArtifactFeedback=async(_scope,context,answers)=>{globalThis.__feedbackCalls.push({type:"submit",context,answers});return{feedbackId:"feedback-1"}};
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
        name: "artifact-feedback-runtime",
        setup(build) {
          build.onResolve(
            {
              filter: exact ? /^(?:\.\/|@exact-chunk\/).*\.js$/ : /^@rchunk\//,
            },
            ({ path: modulePath }) => {
              const id = modulePath.includes("rolldown-runtime")
                ? "runtime"
                : modulePath.includes("app-shared")
                  ? "shared"
                  : modulePath.includes("app-initial")
                    ? "initial"
                    : modulePath.includes("thumb-mixed")
                      ? "thumb"
                      : modulePath.includes("artifact-feedback-dialog")
                        ? "dialog"
                        : modulePath.includes("feedback-upload")
                          ? "upload"
                          : modulePath.includes("submit-artifact-feedback")
                            ? "submit"
                            : "submit";
              return { path: id, namespace: "mock" };
            },
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: id }) => ({
            contents:
              id === "runtime"
                ? runtimeMock
                : id === "shared"
                  ? sharedMock
                  : id === "initial"
                    ? initialMock
                    : id === "thumb"
                      ? thumbMock
                      : id === "dialog"
                        ? dialogMock
                        : id === "upload"
                          ? uploadMock
                          : submitMock,
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
  "src/renderer/artifact-feedback-button/index.ts",
  false,
);
const exact = await bundle(
  ".reference/app-original/webview/assets/artifact-feedback-button-253b2bfc6015.js",
  true,
);
semantic.n();
exact.n();

const artifacts = [
  {
    artifactType: "code",
    fileFormat: "ts",
    label: "index.ts",
    path: "/repo/index.ts",
  },
];
const value = {
  attachArtifact: true,
  details: "",
  includeLogs: true,
  influences: ["content"],
  rating: "better",
  timeSaved: null,
};
function reset() {
  globalThis.__feedbackCalls = [];
  globalThis.__feedbackDialog = null;
  globalThis.__feedbackUpload = null;
  globalThis.__feedbackScope = {
    value: "scope-value",
    get(signal) {
      if (signal?.key === "toast")
        return {
          danger: (message, options) =>
            globalThis.__feedbackCalls.push({
              type: "toast",
              message,
              options,
            }),
        };
      if (signal?.key === "plan")
        return {
          getContext: () => ({ user: { custom: { plan_type: "pro" } } }),
        };
      return null;
    },
  };
}
const normalize = (valueToNormalize) => {
  if (typeof valueToNormalize === "function") return "[function]";
  if (Array.isArray(valueToNormalize)) return valueToNormalize.map(normalize);
  if (valueToNormalize && typeof valueToNormalize === "object")
    return Object.fromEntries(
      Object.entries(valueToNormalize).map(([key, item]) => [
        key,
        normalize(item),
      ]),
    );
  return valueToNormalize;
};
function findClick(node) {
  if (node?.props?.onClick) return node.props.onClick;
  return node?.props?.children ? findClick(node.props.children) : null;
}
async function exercise(module, variant) {
  reset();
  const tree = module.t({
    artifacts,
    fileSizeBytes: 123,
    hostId: "host-1",
    showArtifactSelector: true,
    variant,
  });
  const rendered = normalize(tree);
  findClick(tree)();
  const opened = normalize(globalThis.__feedbackCalls);
  const submitted = await globalThis.__feedbackDialog.props.onSubmit(
    value,
    artifacts[0],
  );
  const feedbackId = await globalThis.__feedbackUpload.submit();
  return {
    rendered,
    opened,
    submitted,
    feedbackId,
    calls: normalize(globalThis.__feedbackCalls),
  };
}
for (const variant of ["icon", "text", "manualEditHeader"]) {
  assert.deepEqual(
    await exercise(semantic, variant),
    await exercise(exact, variant),
    variant + " parity",
  );
}

console.log("3 artifact feedback button end-to-end parity assertions passed");
