import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const actions = [];
const toasts = [];
const artifactSessions = {
  async supportsNativeOpen() {
    return true;
  },
  async getNativeOpenTargets() {
    return { status: "ready", targets: [] };
  },
  async performNativeFileAction(input) {
    actions.push(input);
    return { status: "completed" };
  },
  async readNativeSnapshot() {
    return {
      status: "completed",
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "text/plain",
      fileName: "report.txt",
    };
  },
};
globalThis.__openInOwnerTest = {
  artifactSessions,
  jsx,
  react: { useState: (initial) => [initial, () => {}] },
  toasts,
};

const sharedMock = `
const test=globalThis.__openInOwnerTest;
export const I3=()=>test.jsx; export const e6=()=>test.react;
export const $O={INFINITE:Infinity,ONE_MINUTE:60000};
export const LX=()=>({get:()=>({danger:message=>test.toasts.push(["danger",message]),success:message=>test.toasts.push(["success",message])})});
export const ZI={}; export const pk={}; export const FZ=()=>new Promise(()=>{}); export const UI=(promise)=>promise;
export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});
export const _L=options=>{const key=options.queryKey?.[0];if(key==="artifact-session-supports-native-open")return{data:true,isError:false,isFetching:false,refetch:async()=>{}};if(key==="artifact-session-native-open-targets")return{data:{status:"ready",fileManagerIcon:"file-manager.png",targets:[{id:"editor",label:"Editor",icon:"editor.png",default:true}]},isError:false,isFetching:false,refetch:async()=>{}};return{data:"downloads.png",isError:false,isFetching:false,refetch:async()=>{}};};
export const jf={Item:"MenuItem",Message:"MenuMessage",Separator:"MenuSeparator"};
export const Y2="FormattedMessage"; export const Yh="Button"; export const kf="Dropdown"; export const cy="Chevron";
export const ug="Icon"; export const vb="Folder16"; export const yb="Folder20"; export const q_="DownloadIcon";
export const Hl="Download16"; export const EO="Download20"; export const cO="Open16"; export const Is="Open20";
export const Ul=()=>{};export const DO=()=>{};export const lO=()=>{};export const Ls=()=>{};export const jZ=()=>{};export const gL=()=>{};export const FX=()=>{};export const K2=()=>{};export const Zh=()=>{};export const If=()=>{};export const lw=()=>{};export const lk=()=>{};export const QI=()=>{};export const ek=()=>{};
`;
const initialMock = `
const test=globalThis.__openInOwnerTest;
export const Ml=hostId=>hostId==="local";
export const E6t=()=>({platform:"macOS"});
export const pnt={artifactSessions:test.artifactSessions,workspaceFiles:{getDownloadsFolderIcon:async()=>"downloads.png"}};
export const Xrt="TitleMenu"; export const ait="ItemIcon"; export const oit="TitleMenuGroup";
export const T6t=()=>{};export const mnt=()=>{};export const Rrt=()=>{};export const jl=()=>{};
`;

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/open-in-button/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "open-in-owner-mocks",
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
                ? sharedMock
                : value === "app-initial"
                  ? initialMock
                  : value === "use-app-connect-flow"
                    ? "export const t=()=>{};export const n=()=>({connectingApp:null,clearConnectingApp(){},handleAppConnectOAuthStarted(){},handleConnectApp:async()=>{}});"
                    : value === "open-in-google-drive-menu-item"
                      ? "export const i=()=>{};export const r='DriveMenuItem';export const t='DriveConnectModal';"
                      : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const openIn = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

openIn.n();
assert.equal(openIn.t({ hostId: "remote" }), null);
const wrapper = openIn.t({
  artifactRef: "artifact-1",
  hostId: "local",
  kind: "document",
  threadId: "thread-1",
  title: "Report",
  variant: "title",
});
assert.equal(wrapper.type, jsx.Fragment);
const menuOwner = wrapper.props.children;
const rendered = menuOwner.type(menuOwner.props);
const titleMenu = rendered.props.children[0];
assert.equal(titleMenu.type, "TitleMenu");
assert.equal(titleMenu.props.fileType, "document");
assert.equal(titleMenu.props.title, "Report");
const openGroup = titleMenu.props.children[0];
const menuContent = openGroup.props.children;
const nativeTarget = menuContent.props.children[0][0];
assert.equal(nativeTarget.type, "MenuItem");
assert.equal(nativeTarget.props.children.props.values.target, "Editor");
nativeTarget.props.onSelect();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(actions[0].action, { type: "open", targetId: "editor" });
const revealItem = menuContent.props.children.at(-1);
assert.equal(revealItem.props.children, "Show in Finder");
revealItem.props.onSelect();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(actions[1].action, { type: "show-in-folder" });
const driveItem = menuContent.props.children.at(-3);
const upload = await driveItem.props.readUploadFile();
assert.equal(upload.fileName, "report.txt");
assert.deepEqual([...upload.bytes], [1, 2, 3]);
const downloadItem = titleMenu.props.children[1];
assert.equal(downloadItem.props.children.props.defaultMessage, "Download");
downloadItem.props.onSelect();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(actions[2].action, { type: "download-copy" });
assert.deepEqual(toasts.at(-1), ["success", "Saved a copy to Downloads"]);

console.log("20 open-in button native bridge assertions passed");
