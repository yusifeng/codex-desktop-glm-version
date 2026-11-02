import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  jsx = {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  };
globalThis.__jsx = jsx;
const noop = () => {};
const React = {
  Fragment: jsx.Fragment,
  useContext: () => null,
  useEffect: noop,
  useLayoutEffect: noop,
  useId: () => "usage-id",
  useMemo: (factory) => factory(),
  useRef: (current) => ({ current }),
  useState: (value) => [typeof value === "function" ? value() : value, noop],
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
};
const sharedMock = `
  const noop=()=>{};
  export const I3=()=>globalThis.__jsx;
  export const e6=()=>globalThis.__threadShellReact;
  export const __=value=>value;
  export const m4=(...values)=>values.flat().filter(Boolean).join(" ");
  export const e$=factory=>factory();
  export const o$={div:"div"};
  export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});
  export const o_=props=>props.children;
  export const $3=noop,h4=noop,a$=noop,$Q=noop,FX=noop,g_=noop,K2=noop,c_=noop;
`;
const initialMock = `
  const noop=()=>{};
  export const Ngn=noop,U7=noop,itn=noop,E7=noop,qbt=noop,xlt=noop,JH=noop,Sat=noop,Qa=noop,M0t=noop,Ent=noop,_S=noop;
  export const Slt=()=>false,T7=null,H7=null,YH=null;
  export const wat=()=>null,jat=()=>({height:0});
  export const Agn={timelineScroll:{}};
  export const Za="button";
  export const X5=value=>value==="gpt-6"?"GPT-6":value;
  export const N0t=value=>["none","minimal","low","medium","high","xhigh","max","ultra"].includes(value);
  export const wnt=["red","blue","green"];
  export const gS=(groups,dimension)=>groups.filter(group=>group.dimension===dimension).map(group=>({...group,amountMicros:group.amountMicros??group.amount??0}));
`;
const primaryMock = `export const rt=()=>{};export const et="thread-width";export const tt="spacer";export const xa=()=>{};`;
const scrollContextMock = `export const n=()=>{};export const t="section";export const r=()=>({addScrollListener:()=>()=>{},getLastScrollDistanceFromBottomPx:()=>0,isScrolledFromBottom:false,scrollToBottom:()=>{}});`;
const translationsMock = `export const n=()=>{};export const t="reasoning-effort";`;
globalThis.__threadShellReact = React;
async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)],
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
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: modulePath }) => ({
              loader: "js",
              contents:
                modulePath === "app-shared"
                  ? sharedMock
                  : modulePath === "app-initial"
                    ? initialMock
                    : modulePath === "app-primary"
                      ? primaryMock
                      : modulePath === "thread-scroll-controller-context-value"
                        ? scrollContextMock
                        : modulePath ===
                            "model-and-reasoning-effort-translations"
                          ? translationsMock
                          : "export {};",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`
  );
}

const scroll = await load("thread-scroll-layout");
scroll.n();
const layout = scroll.t({
  children: "turns",
  footer: "composer",
  threadEndContent: "end",
});
assert.equal(layout.type, "section");
assert.equal(typeof layout.props.value.scrollToBottom, "function");
const root = layout.props.children;
assert.equal(root.type, "div");
const scroller = root.props.children[0];
assert.equal(scroller.props["data-pip-anchor-host"], undefined);
assert.match(scroller.props.className, /thread-scroll-container/);
assert.match(scroller.props.className, /overflow-y-auto/);
const motionContent = scroller.props.children[0];
assert.equal(
  motionContent.props.children[1].props[
    "data-thread-user-message-navigation-content"
  ],
  true,
);
assert.equal(motionContent.props.children[1].props.children, "turns");
assert.equal(
  motionContent.props.children[2].props.children.props.children,
  "end",
);
assert.equal(
  scroller.props.children[1].props.children.props.children[1],
  "composer",
);
const compact = scroll.t({
  presentation: "compact",
  hideScrollbar: true,
  children: "compact",
}).props.children.props.children[0];
assert.match(compact.props.className, /hide-scrollbar/);
assert.match(compact.props.className, /flex-col-reverse/);
const custom = scroll.t({
  children: "x",
  footer: "y",
  renderLayout: (parts) => parts,
}).props.children;
assert.equal(custom.content.type, "div");
assert.equal(custom.footer.props.children[1], "y");

assertReleaseOwner("thread-app-shell-chrome");

assertReleaseOwner("thread-user-message-navigation-rail-app");

const usage = await load("thread-usage-breakdown");
usage.r();
assert.equal(usage.t({ dimension: "speed", value: "fast" }), "Fast mode");
assert.equal(usage.t({ dimension: "speed", value: "ultrafast" }), "Ultrafast");
assert.equal(usage.t({ dimension: "speed", value: "standard" }), "Standard");
assert.equal(usage.t({ dimension: "model", value: "gpt-6" }), "GPT-6");
assert.equal(usage.t({ dimension: "model", value: null }), "Other");
const usageView = usage.n({
  usage: {
    creditsUsed: 12.5,
    costUsd: 0.25,
    groups: [
      {
        dimension: "model",
        value: "gpt-6",
        amountMicros: 10,
        netNewInputTokens: 120,
        cachedInputTokens: 30,
        outputTokens: 45,
      },
      { dimension: "speed", value: "fast", amountMicros: 2.5 },
    ],
  },
});
assert.equal(usageView.type, "div");
assert.equal(
  usageView.props.children[0].props.children[0].props.children,
  "Usage in this chat",
);
assert.match(
  usageView.props.children[0].props.children[1].props.children,
  /12.5 credits/,
);
const modelGroup = usageView.props.children[1].type(
  usageView.props.children[1].props,
);
assert.equal(modelGroup.props["data-dimension"], "model");
assert.equal(
  modelGroup.props.children[0].props.children[0].props.children,
  "Models",
);
assert.equal(modelGroup.props.children[1].props.children.length, 1);
assert.equal(modelGroup.props.children[2].props.children.length, 1);
const modelTooltipNode =
  modelGroup.props.children[2].props.children[0].props.tooltipContent;
const modelTooltip = modelTooltipNode.type(modelTooltipNode.props);
assert.match(modelTooltip.props.children[1].props.children, /120/);
const reasoningGroup = usageView.props.children[2].type(
  usageView.props.children[2].props,
);
assert.equal(
  reasoningGroup.props.children[0].props.children[1].props.children,
  "Not available",
);
const usd = usage.n({
  usage: { balanceUnit: "usd", creditsUsed: 0, costUsd: 0.005 },
});
assert.equal(usd.props.children[0].props.children[1].props.children, "$0.005");

const transcript = await load("chatgpt-conversation-transcript");
transcript.n();
const emptyTranscript = transcript.t({
  conversationId: "c1",
  emptyState: "empty",
  turns: [],
});
assert.equal(emptyTranscript.props.children[1], "empty");
const transcriptView = transcript.t({
  conversationId: "c1",
  renderMode: "conversation",
  turns: [
    { id: "u1", role: "user", text: "Hello", timestamp: 10 },
    { id: "a1", role: "assistant", text: "Hi" },
  ],
  pendingSubmission: { text: "Pending" },
});
assert.equal(transcriptView.props["data-conversation-id"], "c1");
assert.equal(transcriptView.props["data-render-mode"], "conversation");
const transcriptBody = transcriptView.props.children[1];
assert.equal(transcriptBody.type, jsx.Fragment);
const renderedTurns = transcriptBody.props.children[0];
assert.equal(renderedTurns.length, 2);
assert.equal(renderedTurns[0].props["data-chatgpt-conversation-turn-id"], "u1");
const userTurnNode = renderedTurns[0].props.children[1];
const userTurn = userTurnNode.type(userTurnNode.props);
assert.equal(userTurn.props["data-role"], "user");
assert.equal(userTurn.props.children[0].props.children, "10");
assert.equal(userTurn.props.children[1].props.children, "Hello");
assert.equal(transcriptBody.props.children[1].type.name, "xa");

const ui = await load("conversation-ui");
ui.i();
const ready = {
  status: "ready",
  context: {
    interactionId: "i1",
    showConversationStarters: true,
    conversationStarters: ["Do it", "Explain it"],
    businessName: "Acme",
    notice: "Operated by Acme",
  },
};
assert.equal(
  ui.n({ conversationId: "c1", fallback: "fallback", state: null }),
  "fallback",
);
assert.equal(
  ui.n({
    conversationId: "c1",
    fallback: "fallback",
    state: { status: "ready", context: { showConversationStarters: false } },
  }),
  "fallback",
);
const loadingHeadingNode = ui.n({
  conversationId: "c1",
  state: { status: "loading", businessName: "Acme" },
});
const loadingHeading = loadingHeadingNode.type(loadingHeadingNode.props);
assert.equal(loadingHeading.props.children[1].props.children, "Acme");
const failedHeadingNode = ui.n({
  conversationId: "c1",
  state: { status: "failed", businessName: "Unavailable agent" },
});
const failedHeading = failedHeadingNode.type(failedHeadingNode.props);
assert.equal(
  failedHeading.props.children[1].props.children,
  "Unavailable agent",
);
assert.equal(
  ui.t({ conversationId: "c1", state: ready }).props["data-interaction-id"],
  "i1",
);
assert.equal(
  ui.t({ conversationId: "c1", state: { status: "loading" } }),
  null,
);
let prompt = null;
const emptyFragment = ui.r({
  conversationId: "c1",
  state: ready,
  onStarterPromptSelect: (value) => {
    prompt = value;
  },
});
assert.equal(emptyFragment.type, jsx.Fragment);
const emptyNode = emptyFragment.props.children[0];
const empty = emptyNode.type(emptyNode.props);
const starters = empty.props.children[3];
assert.equal(starters.props.children.length, 2);
assert.equal(starters.props.children[0].props.children, "Do it");
starters.props.children[0].props.onClick();
assert.equal(prompt, "Do it");
const contextual = ui.r({
  conversationId: "c1",
  fallback: "fallback",
  state: {
    status: "ready",
    context: { interactionId: "i2", showConversationStarters: false },
  },
});
assert.equal(contextual.type, jsx.Fragment);
assert.equal(contextual.props.children[0].props.children[1], "fallback");
console.log("thread shell navigation cluster complete");
