import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resetState() {
  globalThis.__fileEditorFoundationTest = {
    derivedFactories: [],
    hostCalls: [],
    invalidations: [],
    mutation: null,
    mutationPending: false,
    normalizedPaths: [],
    textKind: "text",
    toasts: [],
    jsx: {
      jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
      jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
    },
  };
  return globalThis.__fileEditorFoundationTest;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "file-editor-foundation-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
          if (value === "app-shared") return { contents: `
            const state=globalThis.__fileEditorFoundationTest;
            const noop=()=>{};
            export const $3=noop,FX=noop,K2=noop,LX=()=>({get:()=>({
              success:(message)=>state.toasts.push({kind:"success",message}),
              danger:(message,options)=>state.toasts.push({kind:"danger",message,options}),
            })}),QI=noop,SL=noop,Zh=noop,h4=noop,lk=noop,rL=noop,wL=noop;
            export const I3=()=>state.jsx,Y2=Symbol("FormattedMessage"),Yh=Symbol("IconButton"),$d=Symbol("CodeBlock");
            export const CL=()=>({invalidateQueries:async(options)=>{state.invalidations.push(options);}});
            export const ZI={},pk={},jU="request-client",lW=4096;
            export const iL=(options)=>{state.mutation=options;return {
              get isPending(){return state.mutationPending},
              mutateAsync:async()=>{try{await options.mutationFn();await options.onSuccess();}catch(error){options.onError(error);throw error}},
            }};
            export const iW=(value)=>{state.normalizedPaths.push(value);return "normalized:"+value};
            export const m4=(...values)=>values.filter(Boolean).join(" ");
            export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace("{message}",values?.message??"").replace("{colorName}",values?.colorName??"")});
            export const rZ=(_scope,factory)=>{state.derivedFactories.push(factory);return {factory}};
            export const uW=async()=>state.textKind;
            export const ef=noop;
          `, loader: "js" };
          if (value === "app-initial") return { contents: `
            const state=globalThis.__fileEditorFoundationTest;
            const noop=()=>{};
            export const $ln=(name)=>[name],$on=noop,Con=noop,HZt=noop,Oyt=noop,TM=noop,kyt={target:true},nun=noop,yZt={clients:true};
            export const _on=()=>"host-config-id";
            export const won=()=>({request:async(payload)=>{state.hostCalls.push({event:"git",payload});}});
            export const Qln=async(event,payload)=>{state.hostCalls.push({event,payload});return state.hostHandler(event,payload)};
            export const Fon=(value)=>Buffer.from(value).toString("base64");
            export const Non=(value)=>Uint8Array.from(Buffer.from(value,"base64"));
            export const xM={
              black:{swatchClassName:"swatch-black"},blue:{swatchClassName:"swatch-blue"},green:{swatchClassName:"swatch-green"},
              orange:{swatchClassName:"swatch-orange"},pink:{swatchClassName:"swatch-pink"},purple:{swatchClassName:"swatch-purple"},
              red:{swatchClassName:"swatch-red"},yellow:{swatchClassName:"swatch-yellow"},
            };
          `, loader: "js" };
          return { contents: "export {};", loader: "js" };
        });
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

// text-file-storage: local/cloud reads, validation, optimistic writes and derived access.
let state = resetState();
state.hostHandler = async (event) => event === "read-file-metadata"
  ? { contentKind: "text", mtimeMs: 20, sizeBytes: 5 }
  : event === "read-file" ? { contents: "hello" } : { outcome: "saved", mtimeMs: 21 };
const storage = await bundle("text-file-storage");
storage.n();
assert.equal(state.derivedFactories.length, 1);
const requestClient = { sendRequest: async () => ({}) };
const getDerived = (target) => state.derivedFactories[0]("conversation", {
  get: (_signal, parameter) => parameter?.kind === "app-server" ? target : requestClient,
});
assert.deepEqual(getDerived({ hostId: "durable", environmentId: "env" }), { environmentId: "env", requestClient });
assert.equal(getDerived({ hostId: "local", environmentId: "env" }), undefined);
const localRead = await storage.r({ filePath: "/tmp/a", hostId: "host", maximumSizeBytes: 10, requireTextContent: true });
assert.deepEqual(localRead, { content: "hello", mtimeMs: 20, sizeBytes: 5 });
assert.deepEqual(state.hostCalls.map(({ event }) => event), ["read-file-metadata", "read-file"]);
assert.equal(state.hostCalls[0].payload.params.contentSampleByteLimit, 4096);
state.hostHandler = async (event) => event === "read-file-metadata" ? { contentKind: "text", sizeBytes: 50 } : { contents: "large" };
await assert.rejects(storage.r({ filePath: "/tmp/a", hostId: "host", maximumSizeBytes: 10 }), /too large/);
state.hostHandler = async () => ({ contentKind: "binary", sizeBytes: 5 });
await assert.rejects(storage.r({ filePath: "/tmp/a", hostId: "host", requireTextContent: true }), /not text/);
const cloudCalls = [];
const cloudClient = { sendRequest: async (method, parameters) => {
  cloudCalls.push({ method, parameters });
  return method === "fs/getMetadata" ? { modifiedAtMs: 30 } : { dataBase64: Buffer.from("cloud").toString("base64") };
} };
const cloudRead = await storage.r({ cloudFileAccess: { environmentId: "env", requestClient: cloudClient }, filePath: "/a", hostId: "durable" });
assert.deepEqual(cloudRead, { content: "cloud", mtimeMs: 30, sizeBytes: 5 });
assert.deepEqual(cloudCalls.map(({ method }) => method), ["fs/getMetadata", "fs/readFile"]);
const conflict = await storage.i({ cloudFileAccess: { environmentId: "env", requestClient: cloudClient }, content: "new", expectedMtimeMs: 29, filePath: "/a", hostId: "durable" });
assert.deepEqual(conflict, { mtimeMs: 30, outcome: "conflict" });
let metadataRead = 0;
const savingClient = { sendRequest: async (method, parameters) => {
  cloudCalls.push({ method, parameters });
  if (method === "fs/getMetadata") return { modifiedAtMs: metadataRead++ === 0 ? 30 : 31 };
  return {};
} };
const saved = await storage.i({ cloudFileAccess: { environmentId: "env", requestClient: savingClient }, content: "new", expectedMtimeMs: 30, filePath: "/a", hostId: "durable" });
assert.deepEqual(saved, { mtimeMs: 31, outcome: "saved" });
assert.equal(cloudCalls.at(-2).parameters.dataBase64, Buffer.from("new").toString("base64"));
state.hostHandler = async () => ({ outcome: "saved", mtimeMs: 40 });
assert.deepEqual(await storage.i({ content: "local", expectedMtimeMs: 39, filePath: "/a", hostId: "host" }), { outcome: "saved", mtimeMs: 40 });

// use-create-git-repository: mutation payload, success invalidation, disabled and error paths.
state = resetState();
const createGit = await bundle("use-create-git-repository");
const errors = [];
const gitHook = createGit.n({ cwd: "/repo", hostConfig: { kind: "local" }, onErrorMessage: (message) => errors.push(message), showErrorToast: true });
assert.equal(gitHook.canCreateGitRepository, true);
assert.equal(gitHook.isCreatingGitRepository, false);
assert.deepEqual(state.mutation.mutationKey, ["git", "init-repo", "host-config-id", "/repo"]);
await gitHook.createGitRepository();
assert.equal(state.hostCalls[0].payload.method, "git-init-repo");
assert.equal(state.hostCalls[0].payload.params.cwd, "normalized:/repo");
assert.equal(state.hostCalls[0].payload.params.operationSource, "review_model");
assert.deepEqual(state.toasts[0], { kind: "success", message: "Git repository created" });
assert.deepEqual(state.invalidations, [{ queryKey: ["git-origins"] }, { queryKey: ["git", "metadata", "host-config-id", "/repo"] }]);
state.mutation.mutationFn = async () => { throw new Error("denied"); };
await gitHook.createGitRepository();
assert.deepEqual(errors, ["denied"]);
assert.equal(state.toasts.at(-1).kind, "danger");
const disabledHook = createGit.n({ cwd: null, hostConfig: {} });
assert.equal(disabledHook.canCreateGitRepository, false);
await disabledHook.createGitRepository();
assert.equal(state.hostCalls.length, 1);

// color-palette: accessible eight-color selection and custom default swatch.
state = resetState();
const palette = await bundle("color-palette");
const selected = [];
const paletteTree = palette.t({ color: "red", defaultSwatchColor: "#123456", disabled: true, groupAriaLabel: "Project color", onColorChange: (color) => selected.push(color) });
assert.equal(paletteTree.props.role, "group");
assert.equal(paletteTree.props["aria-label"], "Project color");
assert.equal(paletteTree.props.children.length, 8);
assert.equal(paletteTree.props.children[0].props.children.props.style.backgroundColor, "#123456");
assert.equal(paletteTree.props.children[1].props["aria-pressed"], true);
assert.equal(paletteTree.props.children[1].props.color, "secondary");
assert.equal(paletteTree.props.children[1].props.disabled, true);
assert.match(paletteTree.props.children[5].props.children.props.className, /swatch-blue/);
paletteTree.props.children[5].props.onClick();
assert.deepEqual(selected, ["blue"]);

// python-analysis-details: empty, stream, result, traceback and code rendering.
state = resetState();
const pythonDetails = await bundle("python-analysis-details");
const emptyAnalysis = pythonDetails.t({ item: { code: "", output: [] } });
assert.equal(emptyAnalysis.props.children[0], null);
assert.equal(emptyAnalysis.props.children[1].type(emptyAnalysis.props.children[1].props), null);
const analysis = pythonDetails.t({ item: { code: "print(1)", output: [
  { kind: "stdout", text: "one" }, { kind: "stderr", text: "warn" },
  { kind: "result", text: "1" }, { kind: "error", text: "trace" },
] } });
assert.equal(analysis.props.children[0].props.language, "python");
assert.equal(analysis.props.children[0].props.content, "print(1)");
const outputElement = analysis.props.children[1];
const output = outputElement.type(outputElement.props);
assert.equal(output.props.children[0].props.children[1].props.children.length, 2);
assert.equal(output.props.children[0].props.children[1].props.children[1].props.className, "text-execution-output-error");
assert.equal(output.props.children[1].length, 2);
assert.match(output.props.children[1][0].props.className, /bg-execution-output/);
assert.match(output.props.children[1][1].props.className, /bg-execution-traceback/);
assert.match(output.props.children[1][1].props.children[1].props.className, /border-text-danger/);

console.log("45 file and editor foundation cluster assertions passed");
