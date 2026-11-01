import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const reactRuntime = {
  useEffect(effect) {
    effect();
  },
  useMemo(factory) {
    return factory();
  },
  useRef(value) {
    return { current: value };
  },
  useState(value) {
    return [value, () => {}];
  },
};
const jsxRuntime = {
  Fragment: "fragment",
  jsx(type, props, key) {
    return typeof type === "function" ? type(props) : { type, props, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function" ? type(props) : { type, props, key };
  },
};
globalThis.__sidebarChecklistTest = {
  collapsed: [],
  dismissed: [],
  jsxRuntime,
  reactRuntime,
  views: [],
};

const mockModules = {
  "app-initial": `
    export const N6t = () => ({ accountId: "account-1", planAtLogin: "pro" });
    export const pnt = { systemPermissions: { openNotificationSettings: async () => {} } };
    export const Bfn = () => {}; export const M6t = () => {};
    export const xwt = "account-collection"; export const bwt = "debug-override";
    export const uwt = () => null;
    export const Ewt = (scope, accountId) => globalThis.__sidebarChecklistTest.views.push({ scope, accountId });
    export const vwt = (scope, accountId, collapsed) => globalThis.__sidebarChecklistTest.collapsed.push({ scope, accountId, collapsed });
    export const cwt = (scope, accountId) => globalThis.__sidebarChecklistTest.dismissed.push({ scope, accountId });
  `,
  "app-primary": "export {};",
  "app-shared": `
    export const e6 = globalThis.__sidebarChecklistTest.reactRuntime;
    export const I3 = () => globalThis.__sidebarChecklistTest.jsxRuntime;
    export const n4 = () => ({ locale: "en", formatMessage: descriptor => descriptor.defaultMessage });
    export const ZI = Symbol("scope");
    export const LX = () => "scope"; export const HX = () => null;
    export const FX = () => {}; export const QI = () => {};
  `,
  "external-agent-config-import-flow":
    "export const openExternalAgentImport = async () => {};",
  "onboarding-mail-provider": "export const a = value => value;",
  "rolldown-runtime": "export {};",
  "sidebar-onboarding-checklist-task-config": `
    export const a = () => {};
    export const c = () => ({});
    export const m = () => {};
    export const v = () => {};
  `,
  "use-imported-setup-opportunity": `
    export const ft = item => item.label;
    export const pt = ({ items }) => items;
  `,
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/sidebar-onboarding-checklist/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock-renderer-chunk" },
          ({ path: importPath }) => ({
            contents: mockModules[importPath],
            loader: "js",
          }),
        );
      },
    },
  ],
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
const { SidebarOnboardingChecklist } = await import(moduleUrl);

function descendants(node) {
  if (node == null || typeof node !== "object") return [];
  const children = node.props?.children;
  return [
    node,
    ...(Array.isArray(children)
      ? children.flatMap(descendants)
      : descendants(children)),
  ];
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let activated = null;
const tree = SidebarOnboardingChecklist({
  items: [
    { id: "done", label: "Done task", completed: true },
    { id: "open", label: "Open task", action: "custom" },
  ],
  onItemAction(item) {
    activated = item.id;
  },
});
const nodes = descendants(tree);
check(tree.type === "section", "renders a semantic section");
check(tree.props["aria-label"] === "Getting started", "labels the region");
check(
  nodes.some((node) => node.props?.children === "1 of 2"),
  "renders progress count",
);
check(
  nodes.some((node) => node.props?.style?.width === "50%"),
  "renders progress width",
);
const taskButtons = nodes.filter(
  (node) =>
    node.type === "button" &&
    ["Open task", "Done task"].includes(node.props?.["aria-label"]),
);
check(
  taskButtons[0].props["aria-label"] === "Open task",
  "sorts pending tasks first",
);
check(taskButtons[1].props.disabled === true, "disables completed tasks");
check(
  descendants(taskButtons[1]).some((node) =>
    node.props?.className?.includes("line-through"),
  ),
  "strikes completed labels",
);
await taskButtons[0].props.onClick();
check(activated === "open", "dispatches item actions");
check(
  nodes.some((node) => node.props?.["aria-label"] === "Hide setup"),
  "offers a hide control when expanded",
);
check(
  globalThis.__sidebarChecklistTest.views[0]?.accountId === "account-1",
  "records the checklist view for the active account",
);
nodes
  .find((node) => node.props?.["aria-label"] === "Collapse checklist")
  .props.onClick();
check(
  globalThis.__sidebarChecklistTest.collapsed[0]?.collapsed === true,
  "persists the collapsed state through the scoped onboarding store",
);
nodes.find((node) => node.props?.["aria-label"] === "Hide setup").props.onClick();
check(
  globalThis.__sidebarChecklistTest.dismissed[0]?.accountId === "account-1",
  "dismisses the checklist through the scoped onboarding store",
);

const collapsedTree = SidebarOnboardingChecklist({
  accountState: { collapsed: true },
  items: [
    { id: "done", label: "Done task", completed: true },
    { id: "open", label: "Open task" },
  ],
});
const collapsedNodes = descendants(collapsedTree);
check(
  collapsedNodes.some(
    (node) => node.props?.["aria-label"] === "Expand checklist",
  ),
  "collapsed mode exposes expand control",
);
check(
  collapsedNodes.some((node) => node.props?.["aria-valuenow"] === 50),
  "collapsed mode preserves progress semantics",
);
check(
  SidebarOnboardingChecklist({ isVisible: false, items: [{ id: "open" }] }) ===
    null &&
    SidebarOnboardingChecklist({ items: [{ id: "done", completed: true }] }) ===
      null,
  "hides invisible and completed checklists",
);

assert.equal(assertions, 15);
console.log(`${assertions} sidebar onboarding checklist assertions passed`);
