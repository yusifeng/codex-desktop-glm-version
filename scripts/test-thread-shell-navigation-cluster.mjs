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

assertReleaseOwner("thread-scroll-layout");

assertReleaseOwner("thread-app-shell-chrome");

assertReleaseOwner("thread-user-message-navigation-rail-app");

assertReleaseOwner("thread-usage-breakdown");

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
