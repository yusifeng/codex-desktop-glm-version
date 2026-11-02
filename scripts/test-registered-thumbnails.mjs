import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const expected = {
  "registered-automation-thumbnail": [
    [
      "rolldown-runtime",
      "app-shared",
      "app-initial",
      "model-and-reasoning-effort-translations",
    ],
    "export { RegisteredAutomationThumbnail }",
  ],
  "create-text-file-tab-thumbnail": [
    ["app-shared", "registered-text-file-thumbnail-core"],
    "export { CreateTextFileTabThumbnail }",
  ],
  "registered-browser-thumbnail": [
    ["rolldown-runtime", "app-shared", "app-initial"],
    "export { RegisteredBrowserThumbnail }",
  ],
  "registered-terminal-thumbnail": [
    ["rolldown-runtime", "app-shared", "app-initial", "terminal-thumbnail"],
    "export { RegisteredTerminalThumbnail }",
  ],
  "registered-text-file-thumbnail-core": [
    ["rolldown-runtime", "app-shared", "app-initial", "thumbnail-386f09e9e7b3"],
    "export { initializeRegisteredTextFileThumbnail as n, RegisteredTextFileThumbnail as t }",
  ],
  "create-file-tab-thumbnail": [
    [
      "rolldown-runtime",
      "app-shared",
      "app-initial",
      "thumbnail-7c714f359bb7",
      "registered-text-file-thumbnail-core",
    ],
    "export { CreateFileTabThumbnail }",
  ],
  "registered-goal-thumbnail": [
    ["rolldown-runtime", "app-shared", "app-initial", "app-primary"],
    "export { RegisteredGoalThumbnail }",
  ],
  "registered-cloud-browser-thumbnail": [
    ["rolldown-runtime", "app-shared", "app-initial"],
    "export { RegisteredCloudBrowserThumbnail }",
  ],
  "create-image-tab-thumbnail": [
    ["rolldown-runtime", "app-shared", "app-initial", "thumbnail-7c714f359bb7"],
    "export { CreateImageTabThumbnail }",
  ],
};
let sourceAssertions = 0;
for (const [name, [dependencies, exportText]] of Object.entries(expected)) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", name, "index.ts"),
    "utf8",
  );
  const actual = [
    ...source.matchAll(/(?:from\s+|import\s+)["']@rchunk\/([^"']+)["']/g),
  ].map((match) => match[1]);
  assert.deepEqual(actual, dependencies, name + " exact dependencies");
  sourceAssertions++;
  assert.equal(
    source.includes('import("@rchunk/'),
    false,
    name + " no dynamic dependencies",
  );
  sourceAssertions++;
  assert.equal(/\bany\b/.test(source), false, name + " no any");
  sourceAssertions++;
  assert.equal(
    /\w+Chunk\.[A-Za-z_$]/.test(source),
    false,
    name + " no namespace member access",
  );
  sourceAssertions++;
  assert.equal(source.includes(exportText), true, name + " exact exports");
  sourceAssertions++;
}
sourceAssertions += assertReleaseOwner("registered-review-thumbnail");

const state = (globalThis.__registeredThumbnailsTest = {
  initialized: [],
  signals: new Map(),
  scope: null,
});
const jsx = {
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
  createElement: (type, props) => ({ type, props }),
};
state.jsx = jsx;
state.React = {
  createElement: jsx.createElement,
  useState(initial) {
    return [typeof initial === "function" ? initial() : initial, () => {}];
  },
};
const mark = (name) =>
  "() => globalThis.__registeredThumbnailsTest.initialized.push(" +
  JSON.stringify(name) +
  ")";
const component = (name) => JSON.stringify(name);
const shared = [
  "export const $3=" +
    mark("runtime") +
    ";export const FX=" +
    mark("signals") +
    ";export const K2=" +
    mark("compiler") +
    ";export const lw=" +
    mark("icons") +
    ";export const wL=" +
    mark("links") +
    ";export const Um=" +
    mark("url") +
    ";export const gg=" +
    mark("file-icons") +
    ";",
  "export const I3=()=>globalThis.__registeredThumbnailsTest.jsx;export const e6=()=>globalThis.__registeredThumbnailsTest.React;export const LX=()=>globalThis.__registeredThumbnailsTest.scope;",
  "export const BX=(signal,key)=>signal?.factory?signal.factory(key,{scope:globalThis.__registeredThumbnailsTest.scope}):globalThis.__registeredThumbnailsTest.signals.get(signal?.id??signal);export const HX=signal=>signal?.factory?signal.factory({scope:globalThis.__registeredThumbnailsTest.scope}):globalThis.__registeredThumbnailsTest.signals.get(signal?.id??signal);",
  "export const oZ=(scope,factory)=>({scope,factory});export const pZ=(scope,factory)=>({scope,factory});export const n4=()=>({formatMessage:d=>d.defaultMessage,formatNumber:v=>String(v)});",
  'export const Hm=url=>{try{return new URL(url).hostname}catch{return null}};export const OK=url=>url.trim();export const zY=value=>value?.kind==="heartbeat";export const mg=path=>"FileIcon:"+path;',
  "export const Y2=" +
    component("FormattedMessage") +
    ";export const wy=" +
    component("AutomationIcon") +
    ";export const Ib=" +
    component("BrowserIcon") +
    ";export const mb=" +
    component("StopIcon") +
    ";export const Vx=" +
    component("PauseIcon") +
    ";export const ey=" +
    component("CheckIcon") +
    ";export const fS=" +
    component("ActivityIcon") +
    ";export const CS=" +
    component("ReviewIcon") +
    ";",
  'export const vV=()=>"findLast";export const aJ=1000000;export const lW=4096;',
].join("\n");
const initial = [
  'export const cet={id:"app-scope"};export const $en={id:"route-scope"};export const Xd=' +
    component("TabThumbnail") +
    ";export const Zd=" +
    mark("tab-thumbnail") +
    ";const initializeAppScope=" +
    mark("app-scope") +
    ";export { initializeAppScope as let };export const nun=" +
    mark("queries") +
    ";",
  'export const $ln=(name,input)=>[name,JSON.stringify(input??{})];export const Rgn={getSnapshot:id=>({cwd:"/snapshot/"+id}),getRenderedOutput:id=>[id+": output"]};export const Lgn=' +
    mark("terminal-snapshots") +
    ";",
  'export const Ctt=()=>"cloud schedule";export const HYt=({rrule})=>"schedule:"+rrule;export const Lg=({request})=>request.resolved??{type:"missing",automationId:"missing"};export const Rtt=({seed})=>seed;export const M0t=value=>Boolean(value);export const QCt={id:"local-automations"};export const stt={id:"cloud-automation"};',
  "export const Dtt=" +
    mark("automation-format") +
    ";export const GYt=" +
    mark("schedule-format") +
    ";export const N0t=" +
    mark("reasoning") +
    ";export const Xtt=" +
    mark("automation-request") +
    ";export const ZCt=" +
    mark("automation-selectors") +
    ";export const ttt=" +
    mark("cloud-automation") +
    ";",
  'export const $1={id:"browser-tab"};export const Q1={id:"browser-shot"};export const Fgt=()=>null;export const Mgt=' +
    mark("browser-restore") +
    ";export const e0=" +
    mark("browser-query") +
    ";export const mnt=" +
    mark("browser-tabs") +
    ";export const pnt={browserHost:true};",
  'export const JUt=path=>path.endsWith(".png")?"image":undefined;export const q9t=path=>path.endsWith(".png")?"png":"none";export const XUt=' +
    mark("file-kinds") +
    ";export const Y9t=" +
    mark("image-kinds") +
    ";",
  "export const HZt=" +
    mark("conversation") +
    ';export const Xit=value=>value+"ms";export const Zit=' +
    mark("duration") +
    ';export const vZt={id:"host-registry"};',
  'export const BL={id:"cloud-screenshots"};export const zL={id:"cloud-mode"};export const dWt=value=>value?.subtitle??null;export const hWt=value=>value?.sites===true;export const VL=()=>0;export const mWt=' +
    mark("screenshot-helpers") +
    ";export const HL=" +
    mark("cloud-browser") +
    ";",
  'export const y5t=()=>"sumBy";export const uat=' +
    component("DiffStats") +
    ';export const uk={id:"review-source"};export const gO={id:"review-env"};export const pO={id:"cloud-review"};export const fO={id:"review-cwd"};export const jO={id:"git-review"};export const b$t=({path})=>path.replace(/^\\/repo\\//,"");export const ck=' +
    mark("review-model") +
    ";export const dat=" +
    mark("diff-stats") +
    ';export const C$t={id:"cloud-diff"};export const dO={id:"review-data"};',
  'export const FZt=()=>"resolved-host";export const itn=' +
    mark("route") +
    ';export const mQt={id:"conversation-images"};export const ttn=route=>route.conversationId??null;',
].join("\n");
const mocks = {
  "rolldown-runtime":
    'export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};export const o=value=>({default:value==="findLast"?(items,predicate)=>[...items].reverse().find(predicate):(items,mapper)=>items.reduce((sum,item)=>sum+mapper(item),0)});',
  "app-shared": shared,
  "app-initial": initial,
  "app-primary":
    "export const $r=" +
    component("GoalStatusLabel") +
    ";export const ei=" +
    mark("goal-status") +
    ";",
  "model-and-reasoning-effort-translations":
    "export const n=" +
    mark("reasoning-translations") +
    ";export const t=" +
    component("ReasoningEffortTranslation") +
    ";",
  "terminal-thumbnail":
    "export const n=" +
    mark("terminal-thumbnail") +
    ";export const t=" +
    component("TerminalThumbnail") +
    ";",
  "thumbnail-386f09e9e7b3":
    "export const n=" +
    mark("text-thumbnail") +
    ";export const t=" +
    component("TextThumbnail") +
    ";",
  "thumbnail-7c714f359bb7":
    "export const i=" +
    mark("file-helpers") +
    ";export const n=" +
    mark("file-thumbnail") +
    ";export const r=" +
    component("FileThumbnail") +
    ";export const t=" +
    component("ImageThumbnail") +
    ";",
  "registered-text-file-thumbnail-core":
    "export const n=" +
    mark("registered-text") +
    ";export const t=" +
    component("RegisteredTextThumbnail") +
    ";",
};
let bundleIndex = 0;
async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")],
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
          build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({
            path: specifier.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: dependency }) => ({
              contents: mocks[dependency] ?? "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  const output = path.join(
    "/tmp",
    "registered-thumbnails-" + process.pid + "-" + bundleIndex++ + ".mjs",
  );
  fs.writeFileSync(output, result.outputFiles[0].text);
  const module = await import(pathToFileURL(output).href);
  fs.unlinkSync(output);
  return module;
}
let runtimeAssertions = 0;
const runtimeAssert = (actual, expected, message) => {
  runtimeAssertions++;
  assert.deepEqual(actual, expected, message);
};

state.scope = {
  queryClient: {
    getQueryData(key) {
      if (key[0] === "read-file-metadata")
        return { contentKind: "text", sizeBytes: 12 };
      if (key[0] === "read-file") return { contents: "disk" };
      if (key[0] === "home-directory") return { homeDirectory: "/home/test" };
    },
    getQueriesData() {
      return [];
    },
  },
  query: {
    getData() {
      return null;
    },
  },
  value: { conversationId: "c1", hostId: "local", routeKind: "local-thread" },
  get() {
    return null;
  },
};
const text = await load("registered-text-file-thumbnail-core");
text.n();
const textNode = text.t({
  hostId: "local",
  path: "notes.md",
  readState: () => ({
    draft: {
      content: "draft",
      document: { baseContent: "disk", kind: "clean" },
    },
  }),
  title: "Notes",
});
runtimeAssert(Object.keys(text).sort(), ["n", "t"], "text exports");
runtimeAssert(textNode.type, "TextThumbnail", "text delegate");
runtimeAssert(
  [textNode.props.hasUnsavedChanges, textNode.props.content],
  [true, "draft"],
  "text snapshot",
);
state.initialized = [];
const entry = await load("create-text-file-tab-thumbnail");
runtimeAssert(
  Object.keys(entry),
  ["CreateTextFileTabThumbnail"],
  "entry export",
);
runtimeAssert(state.initialized, ["registered-text"], "entry initialization");
const terminal = await load("registered-terminal-thumbnail");
const terminalNode = terminal.RegisteredTerminalThumbnail({
  cwd: "/fallback",
  hostId: "local",
  sessionId: "s1",
  title: "Shell",
});
runtimeAssert(terminalNode.type, "TerminalThumbnail", "terminal delegate");
runtimeAssert(
  [terminalNode.props.cwd, terminalNode.props.outputTail],
  ["/snapshot/s1", ["s1: output"]],
  "terminal snapshot",
);
state.signals.set("browser-tab", { canCapture: true, isNewTab: true, url: "" });
state.signals.set("browser-shot", {
  data: null,
  isError: false,
  isSuccess: true,
});
const browser = await load("registered-browser-thumbnail");
const browserNode = browser.RegisteredBrowserThumbnail({
  props: { browserConversationId: "c1", browserTabId: "b1" },
  tab: { title: "" },
});
runtimeAssert(browserNode.type.name, "BrowserThumbnailView", "browser view");
runtimeAssert(
  browserNode.type(browserNode.props).props.sections[0].fill,
  true,
  "browser new tab",
);
const automation = await load("registered-automation-thumbnail");
const automationNode = automation.RegisteredAutomationThumbnail({
  readState: () => null,
  request: { type: "site", proposal: { rrule: "FREQ=DAILY" } },
  title: "Daily",
});
runtimeAssert(
  automationNode.type.name,
  "AutomationThumbnailView",
  "automation view",
);
runtimeAssert(
  automationNode.type(automationNode.props).props.sections.length,
  2,
  "automation metadata",
);
state.scope.queryClient.getQueryData = (key) =>
  key[0] === "read-file-metadata"
    ? { contentKind: "image", sizeBytes: 99 }
    : null;
const file = await load("create-file-tab-thumbnail");
const fileNode = file.CreateFileTabThumbnail({
  hostId: "local",
  path: "photo.png",
  title: "Photo",
});
runtimeAssert(fileNode.type, "ImageThumbnail", "file image route");
runtimeAssert(fileNode.props.sources, ["photo.png"], "file sources");
state.scope = {
  get(signal) {
    if (signal?.id === "host-registry")
      return {
        getConversation: () => ({
          threadGoal: {
            status: "active",
            timeUsedSeconds: 2,
            updatedAt: Date.now() / 1000,
            tokenBudget: 100,
            tokensUsed: 25,
          },
        }),
      };
    return null;
  },
};
const goal = await load("registered-goal-thumbnail");
const goalNode = goal.RegisteredGoalThumbnail({
  props: { conversationId: "c1", hostId: "local" },
  title: "Goal",
});
runtimeAssert(goalNode.type.name, "GoalThumbnailView", "goal view");
runtimeAssert(
  goalNode.type(goalNode.props).props.sections.length,
  2,
  "goal sections",
);
state.scope = {
  get(signal) {
    if (signal?.id === "cloud-screenshots")
      return [
        { tab_id: "old", subtitle: "Old" },
        { tab_id: "tab-2", sites: true, tool_summary: "Built site" },
      ];
    if (signal?.id === "cloud-mode") return { mode: "live" };
    return null;
  },
};
const cloud = await load("registered-cloud-browser-thumbnail");
const cloudNode = cloud.RegisteredCloudBrowserThumbnail({
  conversationId: "c1",
  targetTabId: "tab-2",
  tab: { title: "Browser" },
});
runtimeAssert(cloudNode.type.name, "CloudBrowserThumbnailView", "cloud view");
runtimeAssert(
  cloudNode.type(cloudNode.props).props.sections[0].content,
  "Built site",
  "cloud summary",
);
state.scope = {
  value: { conversationId: "c1", hostId: "local", routeKind: "local-thread" },
  get() {
    return null;
  },
};
const image = await load("create-image-tab-thumbnail");
const imageNode = image.CreateImageTabThumbnail({
  title: "Image",
  icon: "icon",
  readState: () => ({ activeImageId: "g1" }),
  props: {
    generatedImages: [{ id: "g1", previewSrc: "preview.png", src: "full.png" }],
  },
});
runtimeAssert(imageNode.type, "ImageThumbnail", "image delegate");
runtimeAssert(
  [imageNode.props.sources, imageNode.props.hostId],
  [["preview.png", "full.png"], "local"],
  "image sources and host",
);
console.log(
  sourceAssertions +
    " source assertions and " +
    runtimeAssertions +
    " runtime assertions passed",
);
