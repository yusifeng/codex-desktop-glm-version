import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/global-dictation-page/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  clipboard: [],
  handlers: new Map(),
  hostMessages: [],
  initialized: 0,
  logs: [],
  mediaErrors: [],
  microphoneRequests: 0,
  now: 1000,
  openSettings: 0,
  recorderStarts: [],
  recorders: [],
  tracksStopped: 0,
  transcriptQueue: [],
};
const node = (type, props = {}) => ({ type, props });
let hooks = [];
let hookIndex = 0;
let queuedEffects = [];
const sameDependencies = (left, right) =>
  left != null &&
  right != null &&
  left.length === right.length &&
  left.every((value, index) => Object.is(value, right[index]));
const React = {
  __clear() {
    for (const hook of hooks) hook?.cleanup?.();
    hooks = [];
    hookIndex = 0;
    queuedEffects = [];
  },
  __render(component) {
    hookIndex = 0;
    queuedEffects = [];
    const view = component();
    const effects = queuedEffects;
    queuedEffects = [];
    for (const effect of effects) effect();
    return view;
  },
  useEffect(effect, dependencies) {
    const index = hookIndex++;
    const previous = hooks[index];
    if (
      previous == null ||
      !sameDependencies(previous.dependencies, dependencies)
    )
      queuedEffects.push(() => {
        previous?.cleanup?.();
        hooks[index] = { dependencies, cleanup: effect() };
      });
  },
  useRef(initialValue) {
    const index = hookIndex++;
    if (hooks[index] == null) hooks[index] = { current: initialValue };
    return hooks[index];
  },
  useState(initialValue) {
    const index = hookIndex++;
    if (hooks[index] == null)
      hooks[index] =
        typeof initialValue === "function" ? initialValue() : initialValue;
    return [
      hooks[index],
      (next) => {
        hooks[index] = typeof next === "function" ? next(hooks[index]) : next;
      },
    ];
  },
};
const jsx = {
  Fragment: Symbol("fragment"),
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
const initializer = "()=>{globalThis.__globalDictation.state.initialized+=1}";
globalThis.__globalDictation = { React, jsx, node, state };
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__globalDictation;",
    `export const $3=${initializer};`,
    "export const Df=props=>runtime.node('context-menu',props);",
    `export const FX=${initializer};`,
    "export const G3={dispatchMessage:(type,payload)=>runtime.state.hostMessages.push([type,payload])};",
    "export const I3=()=>runtime.jsx;",
    `export const K2=${initializer};`,
    "export const K3=(type,handler)=>runtime.state.handlers.set(type,handler);",
    `export const Of=${initializer};`,
    "export const Q3={warning:(message,details)=>runtime.state.logs.push([message,details])};",
    `export const QI=${initializer};`,
    "export const Qh=props=>runtime.node('spinner',props);",
    `export const W3=${initializer};`,
    "export const Y2=props=>runtime.node('message',props);",
    "export const Yh=props=>runtime.node('button',props);",
    `export const Zh=${initializer};`,
    "export const e6=()=>runtime.React;",
    `export const h4=${initializer};`,
    `export const lw=${initializer};`,
    "export const m4=(...values)=>values.filter(Boolean).join(' ');",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
    `export const wL=${initializer};`,
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__globalDictation;",
    `export const ifn=${initializer};`,
    `export const mnt=${initializer};`,
    "export const pnt={clipboard:{writeText:async text=>runtime.state.clipboard.push(text)},dictationAudio:{cleanupTranscript:async({transcript})=>transcript.trim(),transcribeAudio:async()=>{const next=runtime.state.transcriptQueue.shift();if(next instanceof Error)throw next;return next??''}},systemPermissions:{openAccessibilitySettings:async()=>{runtime.state.openSettings+=1},requestMicrophoneAccess:async()=>{runtime.state.microphoneRequests+=1}}};",
    `export const ypn=${initializer};`,
  ].join("\n"),
  "app-primary": "export {};",
  "use-floating-window-pointer-interactivity": "export {};",
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "global-dictation-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: moduleName }) => ({
            contents: mocks[moduleName] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

class MockTrack {
  stop() {
    state.tracksStopped += 1;
  }
}
class MockStream {
  track = new MockTrack();
  getTracks() {
    return [this.track];
  }
}
class MockMediaRecorder {
  listeners = new Map();
  mimeType = "audio/webm";
  state = "inactive";
  constructor(stream) {
    this.stream = stream;
    state.recorders.push(this);
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
  start(timeslice) {
    this.state = "recording";
    state.recorderStarts.push(timeslice);
  }
  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    this.emit("dataavailable", {
      data: new Blob(["audio"], { type: "audio/webm" }),
    });
    this.emit("stop");
  }
}
globalThis.MediaRecorder = MockMediaRecorder;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    mediaDevices: {
      async getUserMedia() {
        const next = state.mediaErrors.shift();
        if (next instanceof Error) throw next;
        return new MockStream();
      },
    },
  },
});
Date.now = () => state.now;

let assertions = 0;
const check = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};
check(Object.keys(module), ["GlobalDictationPage"]);
check(
  [...source.matchAll(/from \"@rchunk\/([^\"]+)\"/g)].map((match) => match[1]),
  ["app-shared", "app-initial"],
);
for (const edge of [
  "rolldown-runtime",
  "app-primary",
  "use-floating-window-pointer-interactivity",
]) {
  assertions += 1;
  assert.equal(source.includes(`import \"@rchunk/${edge}\"`), true);
}
assertions += 1;
assert.equal(source.includes("import("), false);
assertions += 1;
assert.equal(/\bany\b/.test(source), false);
assertions += 1;
assert.equal(/\b\w+Chunk\s*\./.test(source), false);
check(state.initialized, 13);

function reset() {
  React.__clear();
  state.clipboard.length = 0;
  state.handlers.clear();
  state.hostMessages.length = 0;
  state.logs.length = 0;
  state.mediaErrors.length = 0;
  state.microphoneRequests = 0;
  state.now = 1000;
  state.openSettings = 0;
  state.recorderStarts.length = 0;
  state.recorders.length = 0;
  state.tracksStopped = 0;
  state.transcriptQueue.length = 0;
}
const render = (props) =>
  React.__render(() => module.GlobalDictationPage(props));
const flush = async (count = 8) => {
  for (let index = 0; index < count; index += 1) await Promise.resolve();
};
const children = (value) =>
  Array.isArray(value) ? value : value == null ? [] : [value];
function find(root, predicate) {
  if (root == null || typeof root !== "object") return null;
  if (predicate(root)) return root;
  for (const child of children(root.props?.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}
function send(type, payload = {}) {
  const handler = state.handlers.get(type);
  assert.ok(handler, `missing handler ${type}`);
  handler({ type, ...payload }, () => {});
}
function hostMessages(type) {
  return state.hostMessages.filter(([messageType]) => messageType === type);
}

reset();
let view = render();
await flush();
check(hostMessages("global-dictation-renderer-ready").length, 1);
check(find(view, (item) => item.type === "context-menu") != null, true);
send("global-dictation-idle", {
  configuredHotkey: "Cmd+D",
  configuredToggleHotkey: "Cmd+Shift+D",
});
view = render();
check(
  find(
    view,
    (item) =>
      item.props?.title === "Hold Cmd+D or press Cmd+Shift+D to dictate",
  ) != null,
  true,
);
const hitbox = find(
  view,
  (item) => item.props?.["data-testid"] === "global-dictation-hitbox",
);
hitbox.props.onMouseEnter();
hitbox.props.onMouseLeave();
check(
  hostMessages("global-dictation-pointer-interaction-changed").map(
    (entry) => entry[1].isInteractive,
  ),
  [true, false],
);

state.transcriptQueue.push("  hello world  ");
send("global-dictation-start", {
  sessionId: "session-1",
  startGesture: "hold",
});
await flush();
view = render();
check(state.microphoneRequests, 1);
check(state.recorderStarts, [100]);
check(find(view, (item) => item.type === "canvas") != null, true);
check(hostMessages("global-dictation-recording-started").at(-1)[1], {
  sessionId: "session-1",
  startGesture: "hold",
});
state.now = 1400;
send("global-dictation-stop", { sessionId: "session-1", cancel: false });
await flush(14);
view = render();
check(hostMessages("global-dictation-recording-stopped").length, 1);
check(hostMessages("global-dictation-completed").at(-1)[1], {
  sessionId: "session-1",
  text: "hello world",
});
check(state.tracksStopped, 1);
check(
  find(view, (item) => item.props?.title?.includes("dictate")) != null,
  true,
);

reset();
view = render({ initialStatus: "idle" });
send("global-dictation-start", { sessionId: "session-cancel" });
await flush();
state.now = 1100;
send("global-dictation-stop", { sessionId: "session-cancel", cancel: true });
await flush(10);
check(hostMessages("global-dictation-completed").at(-1)[1], {
  sessionId: "session-cancel",
  text: "",
});
check(state.transcriptQueue.length, 0);

reset();
view = render({ initialStatus: "idle" });
let resolvePendingTranscript;
state.transcriptQueue.push(
  new Promise((resolve) => {
    resolvePendingTranscript = resolve;
  }),
);
send("global-dictation-start", {
  sessionId: "session-cancel-transcription",
});
await flush();
state.now = 1400;
send("global-dictation-stop", {
  sessionId: "session-cancel-transcription",
});
await flush();
view = render();
check(find(view, (item) => item.type === "spinner") != null, true);
send("global-dictation-stop", {
  sessionId: "session-cancel-transcription",
  cancel: true,
});
resolvePendingTranscript("late transcript");
await flush(12);
check(hostMessages("global-dictation-completed").at(-1)[1], {
  sessionId: "session-cancel-transcription",
  text: "",
});

reset();
view = render({ initialStatus: "idle" });
state.transcriptQueue.push(new Error("network transcription failed"));
send("global-dictation-start", { sessionId: "session-retry" });
await flush();
state.now = 1400;
send("global-dictation-stop", { sessionId: "session-retry" });
await flush(14);
view = render();
check(
  find(view, (item) => item.props?.["aria-label"] === "Retry") != null,
  true,
);
check(hostMessages("global-dictation-failed").at(-1)[1].stage, "transcription");
state.transcriptQueue.push("retry succeeded");
find(view, (item) => item.props?.["aria-label"] === "Retry").props.onClick();
await flush(12);
check(
  hostMessages("global-dictation-completed").at(-1)[1].text,
  "retry succeeded",
);

reset();
view = render({ initialStatus: "idle" });
state.transcriptQueue.push("interrupted recorder transcript");
send("global-dictation-start", { sessionId: "session-interrupted" });
await flush();
state.now = 1400;
const interruptedRecorder = state.recorders.at(-1);
interruptedRecorder.emit("dataavailable", {
  data: new Blob(["audio"], { type: "audio/webm" }),
});
interruptedRecorder.state = "inactive";
interruptedRecorder.emit("stop");
await flush(14);
check(hostMessages("global-dictation-completed").at(-1)[1], {
  sessionId: "session-interrupted",
  text: "interrupted recorder transcript",
});

reset();
view = render({ initialStatus: "idle" });
state.mediaErrors.push(new DOMException("denied", "NotAllowedError"));
send("global-dictation-start", { sessionId: "session-denied" });
await flush();
view = render();
check(hostMessages("global-dictation-failed").at(-1)[1], {
  sessionId: "session-denied",
  stage: "recording",
});
check(
  find(view, (item) => item.props?.["aria-label"] === "Dismiss") != null,
  true,
);
find(view, (item) => item.props?.["aria-label"] === "Dismiss").props.onClick();
check(
  hostMessages("global-dictation-dismiss").at(-1)[1].sessionId,
  "session-denied",
);

reset();
view = render({ initialStatus: "idle" });
send("global-dictation-paste-failed", {
  failure: { copied: false, reason: "accessibility", text: "recovered words" },
});
view = render();
check(
  find(
    view,
    (item) => item.type === "main" && item.props.onMouseEnter != null,
  ) != null,
  true,
);
find(
  view,
  (item) => item.type === "button" && item.props.children === "Copy transcript",
).props.onClick();
await flush();
check(state.clipboard, ["recovered words"]);
view = render();
check(
  find(
    view,
    (item) =>
      item.type === "button" && item.props.children === "Copy transcript",
  ) == null,
  true,
);
find(
  view,
  (item) => item.type === "button" && item.props.children === "Open Settings",
).props.onClick();
await flush();
check(state.openSettings, 1);
find(
  view,
  (item) => item.type === "button" && item.props["aria-label"] === "Dismiss",
).props.onClick();
check(hostMessages("global-dictation-close").at(-1)[1], { sessionId: null });

reset();
view = render({ initialStatus: "idle" });
const contextMenu = find(view, (item) => item.type === "context-menu");
contextMenu.props.items[0].onSelect();
check(hostMessages("global-dictation-close").at(-1)[1], { sessionId: null });

console.log(`global-dictation-page assertions: ${assertions}`);
