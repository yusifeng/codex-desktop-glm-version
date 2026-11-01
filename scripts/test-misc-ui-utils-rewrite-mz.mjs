import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  [
    "preload-bridge-a281bb5f90a3.js",
    "pinned-content-tab-preload-bridge",
    ["PinnedContentTabPreloadBridge"],
  ],
  ["rehype-katex-afac91f609b4.js", "rehype-katex", ["default"]],
  [
    "renderer-60f4bb7aa0fd.js",
    "interactive-poll-renderer",
    ["InteractivePoll"],
  ],
  [
    "renderer-d200041fe18f.js",
    "conversational-onboarding-writing-renderer",
    ["ConversationalOnboardingWriting"],
  ],
  [
    "restoration-10682af29157.js",
    "background-terminal-tab-restoration",
    ["restoreBackgroundTerminalTabRoute"],
  ],
  [
    "restoration-f11722b5d1a1.js",
    "plan-tab-restoration",
    ["restorePlanTabRoute"],
  ],
  [
    "restrictions-e423e45ffc9f.js",
    "math-expression-restrictions",
    ["a", "i", "n", "r", "t"],
  ],
  [
    "sensitive-image-reminder-e42962fc2c0e.js",
    "sensitive-image-reminder",
    ["ChatGptSensitiveImageReminder"],
  ],
  [
    "shared-snapshot-continuation-c3634fe7a1b8.js",
    "shared-snapshot-continuation",
    ["SharedSnapshotContinuation"],
  ],
  [
    "spoken-language-options-a8b38a93da0c.js",
    "spoken-language-options",
    ["n", "r", "t"],
  ],
];
const dependencyAliases = {
  "chatgpt-image-upload-reminder-dialog-core":
    "chatgpt-image-upload-reminder-dialog",
  "katex-runtime": "katex",
  "rehype-katex-runtime-lib": "lib",
};
const deps = (source, pattern) =>
  [...source.matchAll(pattern)].map((match) => {
    const name = match[1].replace(/-[a-f0-9]{12}$/u, "");
    return dependencyAliases[name] ?? name;
  });
let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(
    path.join(assetRoot, asset.replace(/\.js$/u, ".ts")),
    "utf8",
  );
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    deps(original, /from "\.\/([^"]+)\.js"/gu),
    deps(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu),
  );
  assert.equal(
    (original.match(/import\(/gu) ?? []).length,
    (recovered.match(/import\(/gu) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error/u.test(recovered), false);
  assert.ok(recovered.includes(`Release chunk: ${asset}`));
  assert.equal(/from\s+["']\./u.test(recovered), false);
  sourceAssertions += 5;
}

globalThis.DOMParser = class {
  parseFromString() {
    return { nodeType: 9, childNodes: [] };
  }
};
globalThis.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
};
const jsx = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props) => ({ type, props }),
};
const React = {
  useContext: () => false,
  useState: (value) => [
    typeof value === "function" ? value() : value,
    (next) => {
      globalThis.__mzSetState = next;
    },
  ],
  useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  useRef: (value) => ({ current: value }),
  useId: () => "mz-id",
  useLayoutEffect: (effect) => effect(),
  useEffect: () => {},
  useEffectEvent: (callback) => callback,
};
const noops = new Proxy(
  {},
  { get: (_target, key) => (key === "then" ? undefined : () => undefined) },
);
const signal = (name) => Symbol.for(`mz.${name}`);
const shared = new Proxy(
  {
    I3: () => jsx,
    e6: () => React,
    $3: () => ({
      c: (size) => Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
    }),
    LX: () =>
      globalThis.__mzScope ?? {
        value: {
          pathname: "/",
          routeKind: "local-thread",
          conversationId: "conversation",
        },
        get: () => ({ danger() {} }),
        query: { cancel: async () => {}, invalidate: async () => {} },
        watch: () => () => {},
      },
    ZI: signal("context"),
    Mm: "artifact",
    Q3: { warning() {}, error() {} },
    kB: "/c/:conversationId",
    __: (factory) => factory(),
    x_: () => 1,
    BX: (_key, input) => {
      globalThis.__mzLastBX = input;
      return (
        globalThis.__mzBXValue ?? (typeof input === "string" ? null : undefined)
      );
    },
    G4: () => ({ parse: (value) => value }),
    I4: () => undefined,
    q4: () => undefined,
    Y2: "FormattedMessage",
    Yh: "Button",
    n4: () => ({
      locale: "en",
      formatMessage: (descriptor) => descriptor.defaultMessage,
    }),
    pk: signal("toast"),
    HX: () => ({ accountId: "account", userId: "user" }),
    yL: (value) => {
      globalThis.__mzQueries = value;
      return null;
    },
    QX: (key, factory) => {
      globalThis.__mzQueryFactory = factory;
      return { key, factory };
    },
    iW: (value) => value.path,
  },
  { get: (target, key) => (key in target ? target[key] : noops[key]) },
);
const initial = new Proxy(
  {
    $en: signal("routeScope"),
    bl: signal("bridgeContext"),
    L0t: signal("pin"),
    evt: signal("identity"),
    lpn: signal("route"),
    Q_t: signal("pinnedIds"),
    tvt: signal("blocked"),
    dyt: signal("conversation"),
    I0t: signal("pins"),
    mun: signal("account"),
    cyt: signal("layout"),
    wVt: signal("serverId"),
    _Qt: signal("turns"),
    mpn: signal("intl"),
    wQt: signal("host"),
    wZt: signal("planModel"),
    Icn: signal("hideCode"),
    Syt: signal("workspace"),
    pRt: signal("uploads"),
    vqt: signal("session"),
    B4: signal("composerVersion"),
    Dyt: signal("hostId"),
    d3: signal("attachments"),
    kht: signal("queryKey"),
    qvt: { tabById$: signal("rightTabs") },
    Vvt: { tabById$: signal("bottomTabs") },
    aut: "terminal",
    Jst: "image",
    tct: "browser",
    uut: "plan",
    SY: "RouteProvider",
    ggt: {
      getSnapshot: () => ({ isLoading: false, isSuspended: false }),
      subscribe: () => () => {},
      pages: { getHost: () => ({ hasRegisteredNativeHost: () => true }) },
      isBrowserUseTab: () => false,
    },
    N6t: () => ({
      isLoading: true,
      accountId: "account",
      userId: "user",
      authMethod: "chatgpt",
    }),
    mH: "PollLoading",
    rJt: { safePost: async () => ({ status: "success", data: {} }) },
    Ugn: (scope, host) => globalThis.__mzManager(scope, host),
    O6: () => ({ isPending: () => true, succeed() {}, fail() {} }),
    mst: (value) => value,
    udn: { safeGet: async () => ({ title: "Snapshot" }) },
    Gzt: () => false,
    lfn: () => ({}),
    rfn: () => ({ get: () => false }),
    wCn: (tree, _test, visitor) => {
      const walk = (node, ancestors) => {
        if (node.type === "element") visitor(node, ancestors);
        for (const child of node.children ?? [])
          walk(child, [...ancestors, node]);
      };
      walk(tree, []);
    },
    SCn: signal("skip"),
  },
  { get: (target, key) => (key in target ? target[key] : noops[key]) },
);
for (const name of [
  "FX",
  "K2",
  "Nm",
  "QI",
  "Z3",
  "Zh",
  "g4",
  "g_",
  "lk",
  "vL",
  "wL",
  "y_",
]) {
  if (!Object.hasOwn(shared, name)) shared[name] = () => undefined;
}
Object.assign(initial, {
  $gn: () => null,
  BDt: () => false,
  Gkt: () => undefined,
  Ken: () => "conversation",
  LDt: () => true,
  Mgt: () => undefined,
  Wkt: () => undefined,
  XW: "WriteOnboardingSuggestion",
  clt: () => ({ browserTabId: "browser" }),
  etn: ({ pathname }) => pathname,
  jDt: () => ({ enabled: true }),
  oyt: (value) => value,
  rg: async () => true,
  xR: signal("sharedPollSession"),
  xpn: () => undefined,
});
for (const name of [
  "B0",
  "CCn",
  "CY",
  "ECn",
  "F0t",
  "Fcn",
  "FDt",
  "Fgt",
  "H0t",
  "HZt",
  "I0t",
  "Kun",
  "M6",
  "M6t",
  "Qgn",
  "Rht",
  "Run",
  "Sqt",
  "Vzt",
  "Wgn",
  "Wvt",
  "Yen",
  "Yst",
  "ZW",
  "Z_t",
  "_R",
  "_gt",
  "aL",
  "byt",
  "cJt",
  "dut",
  "fpn",
  "hH",
  "ifn",
  "itn",
  "mRt",
  "nct",
  "ng",
  "nvt",
  "out",
  "iyt",
  "pdn",
  "ppn",
  "pst",
  "slt",
  "uHt",
  "xl",
  "x3",
  "ypn",
  "zDt",
]) {
  if (!Object.hasOwn(initial, name)) initial[name] = () => undefined;
}
const equation = {
  u() {},
  b() {},
  x: (value) => value,
  S: (value) => value.split(","),
  g: (value) =>
    /^-?\d+(?:\.\d+)?$/.test(value.trim())
      ? [{ type: "number", value: value.trim() }]
      : [{ type: "identifier", value: value.trim() }],
  i: ({ tokens, ...context }) =>
    tokens[0].type === "number"
      ? Number(tokens[0].value)
      : Number(context[tokens[0].value]),
  s: (...expressions) => [
    ...new Set(
      expressions
        .flat()
        .filter((token) => token.type === "identifier")
        .map((token) => token.value),
    ),
  ],
};
globalThis.__mzMocks = {
  "@rchunk/rolldown-runtime": {},
  "@rchunk/app-shared": shared,
  "@rchunk/app-initial": initial,
  "@rchunk/app-primary": {
    Ma() {},
    Na: () => () => {},
    gr() {},
    pr: async () => ({ id: "file" }),
  },
  "@rchunk/webview": { n() {}, t: "Webview" },
  "@rchunk/katex-runtime": {
    c() {},
    l: {
      renderToString: (content, options) =>
        globalThis.__mzKatex(content, options),
    },
  },
  "@rchunk/rehype-katex-runtime-lib": {
    n() {},
    r: (tagName, properties, children) => ({
      type: "element",
      tagName,
      properties,
      children,
    }),
    t: (tagName, properties, children) => ({
      type: "element",
      tagName,
      properties,
      children,
    }),
  },
  "@rchunk/index-ymUnTRBB": { r: "PollWidget" },
  "@rchunk/dist-e0bb3d63cc62": { t() {} },
  "@rchunk/view-state-persistence": {
    d: signal("pollState"),
    n() {},
    r() {},
    t: () => ({
      markInteraction() {},
      setItem() {},
      flush: async () => {},
      hydrate() {},
      getSnapshot: () => null,
      dispose() {},
    }),
  },
  "@rchunk/tabs": { n() {}, t: "Tabs" },
  "@rchunk/quick-chat-writing-block-adapter": { r() {}, t: "WritingBlock" },
  "@rchunk/command-execution-command": { t: (item) => item.commandText },
  "@rchunk/local-conversation-plan-model": {
    n() {},
    t: (source, key) => globalThis.__mzFindPlan(source, key),
  },
  "@rchunk/equation": equation,
  "@rchunk/chatgpt-image-upload-reminder-dialog-core": {
    n() {},
    t: "ReminderDialog",
  },
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, "src/renderer", directory, "index.ts")],
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
          build.onResolve({ filter: /^@rchunk\// }, ({ path: name }) => ({
            path: name,
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: name }) => ({
              contents: `module.exports = globalThis.__mzMocks[${JSON.stringify(name)}];`,
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}
const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, exports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...exports].sort());
  runtimeAssertions += 1;
}
assert.equal(
  loaded
    .get("pinned-content-tab-preload-bridge")
    .PinnedContentTabPreloadBridge(),
  null,
);
runtimeAssertions += 1;
const preloadBridgeSource = fs.readFileSync(
  path.join(
    root,
    "src/renderer/pinned-content-tab-preload-bridge/index.ts",
  ),
  "utf8",
);
assert.match(preloadBridgeSource, /snapshot\.get\(initial\.I0t\)/u);
assert.match(
  preloadBridgeSource,
  /this\.scope\.get\(initial\.dyt\) === conversationId/u,
);
assert.match(preloadBridgeSource, /initial\.iyt\(\)/u);
runtimeAssertions += 3;
globalThis.__mzKatex = (content, options) => [
  {
    type: "element",
    tagName: "span",
    properties: { className: ["katex"], displayMode: options.displayMode },
    children: [{ type: "text", value: content }],
  },
];
const tree = {
  type: "root",
  children: [
    {
      type: "element",
      tagName: "span",
      properties: { className: ["math-inline"] },
      children: [{ type: "text", value: "x^2" }],
    },
  ],
};
loaded.get("rehype-katex").default()(tree, {
  message() {
    throw new Error("unexpected message");
  },
});
assert.equal(tree.children[0].properties.className[0], "katex");
assert.equal(tree.children[0].children[0].value, "x^2");
runtimeAssertions += 2;
assert.equal(
  loaded.get("interactive-poll-renderer").InteractivePoll({
    widget: {},
    state: {},
    widgetRefId: "ref",
    messageId: "message",
    turn: { conversationId: "conversation" },
  }).type,
  "PollLoading",
);
runtimeAssertions += 1;
const state = {
  tab: "professional_email",
  ask_me_label: "Write",
  translation_tab_label: "Translate",
  translation_question: "Translate?",
  email_tab_label: "Email",
  email_question: "Email?",
  message_tab_label: "Message",
  message_question: "Message?",
  translation: {
    source_text: "Hello",
    translated_text: "Hola",
    source_language: "en",
    target_language: "es",
  },
  email: { id: "email", content: "Body", subject: "Subject" },
  message: { id: "message", content: "Hi" },
};
const writing = loaded
  .get("conversational-onboarding-writing-renderer")
  .ConversationalOnboardingWriting({
    state,
    sourceMessageId: "source",
    turnContext: {},
  });
const writingBody = writing.props.children[1].props.children[2];
assert.equal(writingBody.type, "WritingBlock");
assert.equal(writingBody.props.directive.variant, "email");
runtimeAssertions += 2;
let turns = [];
globalThis.__mzManager = () => ({
  hydrateBackgroundThreads: async () => {
    turns = [
      {
        items: [
          {
            type: "commandExecution",
            id: "cmd",
            commandText: "npm test",
            cwd: "/repo",
            processId: 7,
          },
        ],
      },
    ];
  },
  ensureConversationHistoryLoaded: async () => {},
});
const restoreScope = {
  value: { routeKind: "local-thread", conversationId: "conversation" },
  get(key) {
    if (key === signal("turns")) return turns;
    if (key === signal("host")) return "host";
    if (key === signal("intl"))
      return { formatMessage: (descriptor) => descriptor.defaultMessage };
    return null;
  },
};
let terminal;
assert.equal(
  await loaded
    .get("background-terminal-tab-restoration")
    .restoreBackgroundTerminalTabRoute(
      {
        revealAndFocus: true,
        descriptor: { tabId: "tab" },
        scope: restoreScope,
      },
      "cmd",
      (input) => {
        terminal = input;
        return "tab";
      },
    ),
  true,
);
assert.equal(terminal.backgroundTerminal.command, "npm test");
runtimeAssertions += 2;
let planSource = null;
globalThis.__mzFindPlan = (source, key) =>
  source?.key === key ? source : null;
globalThis.__mzManager = () => ({
  ensureConversationHistoryLoaded: async () => {
    planSource = { key: "plan", content: "Do work" };
  },
});
const planScope = {
  value: { routeKind: "local-thread", conversationId: "conversation" },
  get(key) {
    if (key === signal("planModel")) return planSource;
    if (key === signal("turns")) return [];
    if (key === signal("host")) return "host";
    if (key === signal("workspace")) return { path: "/repo" };
    if (key === signal("hideCode")) return true;
    if (key === signal("intl"))
      return { formatMessage: (descriptor) => descriptor.defaultMessage };
    return null;
  },
};
let plan;
assert.equal(
  await loaded
    .get("plan-tab-restoration")
    .restorePlanTabRoute(
      { revealAndFocus: false, descriptor: { tabId: "tab" }, scope: planScope },
      "plan",
      (_scope, input) => {
        plan = input;
        return "tab";
      },
    ),
  true,
);
assert.deepEqual(
  [plan.content, plan.cwd, plan.hideCodeBlocks],
  ["Do work", "/repo", true],
);
runtimeAssertions += 2;
const restrictions = loaded.get("math-expression-restrictions");
restrictions.i();
const parsed = restrictions.a("x^2 {0<x<10}", {});
assert.deepEqual(restrictions.r(parsed.restrictions, "x", {}), {
  max: 10,
  maxInclusive: false,
  min: 0,
  minInclusive: false,
});
assert.equal(restrictions.t(parsed.restrictions, { x: 5 }), true);
assert.equal(restrictions.n(parsed.restrictions, {}).length, 2);
runtimeAssertions += 3;
globalThis.__mzBXValue = [];
assert.equal(
  loaded.get("sensitive-image-reminder").ChatGptSensitiveImageReminder({
    conversationId: "conversation",
    hasCompetingDialog: false,
  }),
  null,
);
assert.equal(globalThis.__mzQueries.queries.length, 0);
runtimeAssertions += 2;
assert.equal(
  loaded
    .get("shared-snapshot-continuation")
    .SharedSnapshotContinuation({ shareId: "share" }),
  null,
);
assert.equal(globalThis.__mzLastBX.shareId, "share");
assert.equal(typeof globalThis.__mzQueryFactory, "function");
runtimeAssertions += 3;
const languages = loaded.get("spoken-language-options");
languages.r();
const intl = {
  locale: "en",
  formatMessage: (descriptor) => descriptor.defaultMessage,
};
assert.equal(languages.t("auto", intl), "Auto-detect");
const options = languages.n(intl);
assert.equal(options[0].value, "auto");
assert.equal(
  new Set(options.map((option) => option.label)).size,
  options.length,
);
runtimeAssertions += 3;
console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
