import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/alert.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

globalThis.__RENDERER_JSX_RUNTIME__ = {
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};
const formattedDescriptors = [];
globalThis.__RENDERER_INTL__ = {
  formatMessage(descriptor) {
    formattedDescriptors.push(descriptor);
    return descriptor.defaultMessage;
  },
};

const alerts = await import(
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

let removed = 0;
function LeadingIcon() {}
let node = alerts.Alert({
  actions: "Retry",
  children: "Something failed",
  className: "extra",
  fullWidth: true,
  icon: LeadingIcon,
  level: "danger",
  onRemove: () => (removed += 1),
  richColors: true,
  testId: "failure-alert",
});
equal(node.type, "div", "renders an alert container");
equal(node.props.role, "alert", "announces alerts by default");
equal(node.props["data-testid"], "failure-alert", "forwards the test id");
check(node.props.className.includes("flex"), "supports full-width alerts");
check(
  node.props.className.includes("border-danger-outline"),
  "uses the danger border",
);
check(node.props.className.includes("text-danger"), "uses rich danger text");
check(node.props.className.includes("extra"), "merges custom classes");

const [mainRow, footer] = node.props.children;
const [leading, content, close] = mainRow.props.children;
equal(leading.props.children.type, LeadingIcon, "renders the supplied icon");
equal(
  leading.props.children.props.className,
  "icon-xs",
  "sizes supplied icons",
);
equal(
  content.props.children[0].props.children.props.children,
  "Something failed",
  "wraps string content with medium weight",
);
equal(content.props.children[1], null, "omits inline actions by default");
equal(footer.props.children, "Retry", "renders actions in the footer");
equal(close.type, "button", "renders a native close button");
equal(close.props.type, "button", "prevents implicit form submission");
equal(close.props["aria-label"], "Close", "localizes the close label");
equal(
  close.props.children.props.asset.name,
  "xmark-md-light-16",
  "uses the source close icon",
);
close.props.onClick({});
equal(removed, 1, "runs the remove callback");
equal(
  formattedDescriptors[0].id,
  "codex.alert.closeAriaLabel",
  "requests the source localization message",
);

node = alerts.Alert({
  actions: "Open",
  actionsInline: true,
  announce: false,
  children: { type: "strong" },
  leading: "custom-leading",
  level: "success",
  richColors: true,
});
equal(node.props.role, undefined, "supports silent alerts");
check(
  node.props.className.includes("bg-background-success-surface"),
  "uses the rich success surface",
);
equal(
  node.props.children[0].props.children[0].props.children,
  "custom-leading",
  "prefers custom leading content",
);
equal(
  node.props.children[0].props.children[1].props.children[0].props.children,
  { type: "strong" },
  "preserves non-string content",
);
equal(
  node.props.children[0].props.children[1].props.children[1].props.children,
  "Open",
  "renders inline actions",
);
equal(node.props.children[1], null, "omits footer actions when inline");

node = alerts.Alert({ children: "Saved", variant: "successNeutral" });
check(
  node.props.className.includes("bg-primary-solid"),
  "styles neutral success",
);
node = alerts.Alert({ children: "Blocked", variant: "dangerSolid" });
check(node.props.className.includes("bg-danger-solid"), "styles solid danger");
node = alerts.Alert({ children: "Careful", level: "warning" });
check(node.props.className.includes("bg-warning-surface"), "styles warnings");
check(
  node.props.className.includes("text-default"),
  "keeps non-rich text neutral",
);

equal(alerts.initializeAlert(), undefined, "keeps initialization idempotent");

console.log(
  `app-shared alert behavior: ${assertions}/${assertions} assertions passed`,
);
