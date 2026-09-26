import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/toast.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

globalThis.__RENDERER_JSX_RUNTIME__ = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};

const toasts = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let primaryClicks = 0;
let secondaryClicks = 0;
let node = toasts.Toast({
  title: "Upload failed",
  description: "Try again later",
  level: "danger",
  primaryAction: {
    label: "Retry",
    loading: true,
    onClick: () => (primaryClicks += 1),
  },
  secondaryAction: {
    label: "Dismiss",
    onClick: () => (secondaryClicks += 1),
  },
  onClose: () => {},
  testId: "upload-toast",
});
equal(node.type.name, "Alert", "composes the shared Alert component");
equal(node.props.announce, false, "does not duplicate alert announcements");
equal(node.props.actionsInline, false, "places actions below descriptions");
equal(node.props.fullWidth, true, "fills the toast width");
equal(node.props.level, "danger", "forwards the alert level");
equal(node.props.richColors, true, "uses rich alert colors");
equal(node.props.testId, "upload-toast", "forwards the test id");
check(
  node.props.className.includes("_alert_1msoq_11"),
  "uses toast alert styles",
);
equal(
  node.props.leading.props.asset.name,
  "circle-exclamation-mark-light-16",
  "uses the danger icon",
);
equal(
  node.props.children.props.children[0].props.children,
  "Upload failed",
  "renders the title",
);
equal(
  node.props.children.props.children[1].props.children,
  "Try again later",
  "renders the description",
);
check(
  node.props.children.props.children[1].props.className.includes(
    "text-danger/80",
  ),
  "styles danger descriptions",
);

const [secondary, primary] = node.props.actions.props.children;
equal(secondary.type.name, "Button", "renders the secondary action button");
equal(secondary.props.color, "secondary", "styles the secondary action");
equal(secondary.props.size, "compact", "uses compact action buttons");
equal(primary.props.loading, true, "forwards primary loading state");
secondary.props.onClick();
primary.props.onClick();
equal(secondaryClicks, 1, "runs the secondary action");
equal(primaryClicks, 1, "runs the primary action");

node = toasts.Toast({
  title: "Saved",
  level: "success",
  primaryAction: { label: "Open", onClick() {} },
  leading: "custom-leading",
});
equal(node.props.actionsInline, true, "inlines actions without a description");
equal(node.props.leading, "custom-leading", "prefers supplied leading content");
equal(
  node.props.children.props.children[1],
  null,
  "omits missing descriptions",
);

node = toasts.Toast({
  title: "Ready",
  description: "Continue",
  level: "success",
  variant: "successNeutral",
});
check(
  node.props.children.props.children[1].props.className.includes(
    "text-primary-solid/80",
  ),
  "styles neutral-success descriptions",
);
equal(node.props.actions, undefined, "omits missing actions");

equal(
  toasts.initializeToastStyles(),
  undefined,
  "keeps style initialization idempotent",
);
equal(
  toasts.initializeToast(),
  undefined,
  "keeps toast initialization idempotent",
);

console.log(
  `app-shared toast behavior: ${assertions}/${assertions} assertions passed`,
);
