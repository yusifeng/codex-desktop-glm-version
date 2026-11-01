import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "result-values",
  "partition",
  "undo",
  "book-open",
  "diff-preview-tooltip",
  "exec-shell-container",
  "computer-use-native-app-metadata",
  "open-in-button",
  "skill-exploration-labels",
  "plan-implementation-request",
];
const state = (globalThis.__toolResultPrimitivesTest = {});
state.jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
state.workspace = { id: "workspace-1", name: "Acme" };
state.workspaceId = "workspace-1";
state.outboundData = {
  ok: true,
  data: { items: [{ connection_id: "github", display_name: "GitHub" }] },
};
state.react = {
  useEffect(effect) {
    effect();
  },
  useRef(initial) {
    return { current: initial };
  },
  useState(initial) {
    let value = typeof initial === "function" ? initial() : initial;
    return [
      value,
      (next) => {
        value = typeof next === "function" ? next(value) : next;
      },
    ];
  },
};
const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) {
      const name = item.trim().split(/\s+as\s+/)[0];
      if (name && !name.startsWith("type ")) names.add(name);
    }
    imports.set(match[2], names);
  }
}
const overrides = {
  "app-shared": {
    $3: "() => ({ c: size => Array(size).fill(Symbol.for('react.memo_cache_sentinel')) })",
    $O: "{ FIVE_MINUTES: 300000, FIVE_SECONDS: 5000 }",
    BX: "(family, parameter) => ({ data: family?.factory ? globalThis.__toolResultPrimitivesTest.outboundData : family?.read?.(parameter) ?? null })",
    FX: "() => undefined",
    G2: "value => value",
    H3: "() => undefined",
    HI: "(...parts) => parts.join('/')",
    I3: "() => globalThis.__toolResultPrimitivesTest.jsx",
    Jm: "load => props => ({ type: 'lazy', props, load })",
    K2: "() => undefined",
    NB: "'persisted'",
    PB: "'live'",
    QI: "() => undefined",
    QX: "(_scope, factory) => ({ factory })",
    RI: "() => undefined",
    V3: "load => load()",
    ZI: "{ id: 'app-scope' }",
    Y2: "props => props",
    HX: "() => globalThis.__toolResultPrimitivesTest.workspaceId",
    aq: "'visualize'",
    e6: "() => globalThis.__toolResultPrimitivesTest.react",
    ek: "() => undefined",
    c_: "() => undefined",
    o_: "'Tooltip'",
    oq: "'visualize'",
    qm: "() => undefined",
    wL: "() => undefined",
  },
  "app-initial": {
    Ml: "() => false",
    Sun: "() => undefined",
    mnt: "() => undefined",
    mun: "{ name: 'workspace-id' }",
    pnt: "{ environmentConfigs: { listOutboundIdentityConnections: async () => globalThis.__toolResultPrimitivesTest.outboundData } }",
    rht: "() => undefined",
    uht: "() => ({ data: globalThis.__toolResultPrimitivesTest.workspace })",
    R5t: "() => undefined",
    Wpn: "(text,offset) => { const match=/plugin:\\/\\/[^\\s]+/g; match.lastIndex=offset; const found=match.exec(text); return found ? { path: found[0], end: match.lastIndex } : null; }",
    _9t: "() => undefined",
    b9t: "path => path",
    eun: `(scope, method, options) => ({
      method,
      options,
      read(parameter) {
        const config = options(parameter);
        if (!config.enabled) return null;
        if (method === "native-desktop-app-by-bundle-id") {
          return config.select({ app: { appId: parameter, displayName: "Editor" } });
        }
        return config.select({ apps: [{ appId: "com.example.Editor", displayName: "Editor" }] });
      },
    })`,
    nun: "() => undefined",
    g9t: "path => path.endsWith('SKILL.md') ? { isSkillDefinitionFile: true, skillId: 'visualize' } : null",
    qpn: "path => path",
  },
  "ansi-block": {
    n: "() => undefined",
    t: "props => ({ type: 'AnsiBlock', props })",
  },
  "shell-label": {
    n: "() => undefined",
    t: "command => command.includes('zsh') ? 'Z shell' : command.includes('bash') ? 'Bash' : null",
  },
};
const sideEffects = new Set([
  "diff-preview-content",
  "use-app-connect-flow",
  "open-in-google-drive-menu-item",
]);
overrides["rolldown-runtime"] = {
  n: "initializer => { let done = false; return () => { if (!done) { done = true; initializer(); } }; }",
};
function mock(name) {
  if (name === "use-app-connect-flow")
    return "export const n=()=>({connectingApp:null,clearConnectingApp(){},handleAppConnectOAuthStarted(){},handleConnectApp:async()=>{}});export const t=()=>{};";
  if (name === "open-in-google-drive-menu-item")
    return "export const i=()=>{};export const r=()=>null;export const t=()=>null;";
  if (sideEffects.has(name)) return "export {};";
  const names = new Set(imports.get(name) ?? []);
  if (name === "app-initial") names.add("Ml");
  return [...names]
    .map(
      (exportName) =>
        `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`,
    )
    .join("\n");
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
    plugins: [
      {
        name: "tool-result-primitives-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => ({
              contents: mock(importPath),
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
function nodes(root) {
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}
const nodeOfType = (tree, type) =>
  nodes(tree).find((node) => node.type === type);
const textNode = (tree, text) =>
  nodes(tree).find((node) => node.props?.children === text);

// partition: 4
const partition = await bundle("partition");
assert.deepEqual(
  partition.t([1, 2, 3, 4], (value) => value % 2 === 0),
  [
    [2, 4],
    [1, 3],
  ],
);
assert.deepEqual(
  partition.t([], () => true),
  [[], []],
);
assert.deepEqual(
  partition.t(["a", "b"], (_value, index) => index === 0),
  [["a"], ["b"]],
);
assert.equal(typeof partition.t, "function");

// plan-implementation-request: 5
const plan = await bundle("plan-implementation-request");
plan.n();
assert.equal(plan.t, "PLEASE IMPLEMENT THIS PLAN:");
assert.equal(plan.r("PLEASE IMPLEMENT THIS PLAN: ship it"), true);
assert.equal(plan.r(" Please implement this plan"), false);
assert.equal(plan.r("PLEASE IMPLEMENT THIS"), false);
assert.equal(typeof plan.n, "function");

// undo + book-open: 6
const undo = await bundle("undo");
const book = await bundle("book-open");
undo.n();
book.n();
const undoTree = undo.t({ "aria-label": "Undo" });
assert.equal(undoTree.type, "svg");
assert.equal(undoTree.props.width, 20);
assert.equal(undoTree.props["aria-label"], "Undo");
const bookTree = book.t({ className: "book" });
assert.equal(bookTree.type, "svg");
assert.equal(bookTree.props["data-rtl-flip"], "");
assert.equal(bookTree.props.className, "book");

// computer-use-native-app-metadata: 4
const nativeApp = await bundle("computer-use-native-app-metadata");
nativeApp.t();
assert.deepEqual(nativeApp.n({ kind: "appId", appId: "com.example.Editor" }), {
  appId: "com.example.Editor",
  displayName: "Editor",
});
assert.deepEqual(nativeApp.n({ kind: "displayName", displayName: "Editor" }), {
  appId: "com.example.Editor",
  displayName: "Editor",
});
assert.equal(nativeApp.n(null), null);
assert.equal(typeof nativeApp.t, "function");

// diff-preview-tooltip: 5
const diffPreview = await bundle("diff-preview-tooltip");
diffPreview.n();
const diffTree = diffPreview.t({
  children: "main.ts",
  diff: { metadata: { path: "main.ts" } },
  disabled: true,
  displayPath: "main.ts",
  linesAdded: 3,
  linesRemoved: 1,
});
assert.equal(diffTree.type, state.jsx.Fragment);
const diffTooltip = nodeOfType(diffTree, "Tooltip");
assert.equal(diffTooltip.props.disabled, true);
assert.equal(diffTooltip.props.children, "main.ts");
assert.equal(diffTooltip.props.delayDuration, 800);
assert.equal(typeof diffTooltip.props.onPointerEnter, "function");

// exec-shell-container: 17
const shell = await bundle("exec-shell-container");
shell.n();
const shellTree = shell.t({
  command: "/bin/zsh -lc 'npm test'",
  cwd: "/repo",
  output: "passed",
  surface: "plain",
});
assert.equal(shellTree.type, "div");
assert.equal(shellTree.props["data-surface"], "plain");
const shellOutputNode = nodes(shellTree).find(
  (node) => typeof node.type === "function",
);
assert.equal(shellOutputNode.props.cwd, "/repo");
assert.equal(shellOutputNode.props.embeddedAppearance, "plain");
const shellOutput = shellOutputNode.type(shellOutputNode.props);
assert.equal(
  nodes(shellOutput).find((node) => node.props?.["aria-label"] === "$ npm test")
    ?.props.role,
  "button",
);
assert.equal(
  nodes(shellOutput).find(
    (node) =>
      typeof node.type === "function" && node.props?.children === "passed",
  )?.props.children,
  "passed",
);
assert.equal(textNode(shellOutput, "Z shell"), undefined);
assert.equal(
  nodes(
    nodes(shell.t({ command: "true", output: "" }))
      .find((node) => typeof node.type === "function")
      .type({ command: "true", output: "", variant: "embedded" }),
  ).find(
    (node) =>
      typeof node.type === "function" && node.props?.children === "No output",
  ).props.children,
  "No output",
);
assert.equal(
  nodes(
    nodes(shell.t({ command: "true", output: "", isInProgress: true }))
      .find((node) => typeof node.type === "function")
      .type({
        command: "true",
        output: "",
        isInProgress: true,
        variant: "embedded",
      }),
  ).find(
    (node) => typeof node.type === "function" && node.props?.children === "",
  ).props.children,
  "",
);
assert.equal(shell.r({ className: "expand" }).props.className, "expand");
assert.equal(
  shell.t.Footer({ isInProgress: true }).props["aria-label"],
  "Command running",
);
assert.equal(
  shell.t.Footer({ wasInterrupted: true }).props.children.props.children,
  "Stopped",
);
assert.equal(
  shell.t.Footer({ isSuccess: true }).props.children.props.children,
  "Success",
);
assert.equal(
  shell.t.Footer({ exitCode: 2 }).props.children.props.children,
  "Exit code 2",
);

// open-in-button: the shared cluster checks the host guard; native-open behavior
// has a dedicated bridge test because the production component is hook driven.
const openIn = await bundle("open-in-button");
openIn.n();
assert.equal(openIn.t({}), null);
assert.equal(openIn.t({ hostId: "local", variant: "title" }), null);

// skill-exploration-labels: 12
const skills = await bundle("skill-exploration-labels");
skills.n();
skills.s();
assert.equal(skills.a("mkdir ./visualizations/demo"), "create");
assert.equal(
  skills.a("apply_patch\n*** Update File: /tmp/visualizations/demo/index.html"),
  "update",
);
assert.equal(
  skills.a("apply_patch\n*** Delete File: /tmp/visualizations/demo/index.html"),
  null,
);
assert.equal(skills.a("echo hello"), null);
assert.equal(skills.l("completed"), true);
assert.equal(skills.l("failed"), false);
assert.equal(
  skills.c({ isSkillDefinitionFile: true, skillId: "visualize" }),
  true,
);
assert.equal(
  skills.c({
    isSkillDefinitionFile: true,
    skillId: "live",
    pluginId: "visualize",
  }),
  true,
);
const skillIntl = { formatMessage: (descriptor) => descriptor.defaultMessage };
assert.equal(
  skills.i({
    intl: skillIntl,
    kind: "create",
    isFinished: false,
    isLeadingSegment: true,
  }),
  "Creating visualization",
);
assert.equal(
  skills.i({
    intl: skillIntl,
    kind: "update",
    isFinished: true,
    isLeadingSegment: false,
  }),
  "updated visualization",
);
assert.equal(
  skills.o([{ type: "text", text: "Create an interactive chart" }]),
  "soft",
);
assert.equal(
  skills.r({ summary: { type: "read", path: "/tmp/SKILL.md" } }),
  true,
);

// result-values: 10
const values = await bundle("result-values");
values.a();
values.s();
assert.equal(
  values.i({ script: "npm install" }).props.defaultMessage,
  "Configured",
);
assert.equal(values.i({ script: " " }).props.defaultMessage, "Not set");
assert.equal(
  values.t({ policy: { type: "disabled" } }).props.defaultMessage,
  "Disabled",
);
assert.equal(
  values.t({ policy: { type: "unrestricted" } }).props.defaultMessage,
  "Unrestricted",
);
assert.equal(
  values.t({
    policy: {
      type: "restricted",
      egress_rules: [{ host: "a.test" }, { host: "a.test" }],
    },
  }).props.values.count,
  1,
);
assert.equal(
  values.t({
    policy: {
      type: "restricted",
      egress_rules: [],
      presets: ["package_managers"],
    },
  }).props.defaultMessage,
  "Package managers",
);
assert.equal(values.n({}).props.values.workspaceName, "Acme");
state.workspaceId = "workspace-2";
assert.equal(
  values.n({ detail: true }).props.defaultMessage,
  "Everyone in this workspace can access",
);
assert.equal(
  values.r({ requirement: { connection_id: "github" } }).props.children,
  "GitHub",
);
assert.equal(typeof values.o.factory, "function");

console.log("63 tool result primitives cluster assertions passed");
