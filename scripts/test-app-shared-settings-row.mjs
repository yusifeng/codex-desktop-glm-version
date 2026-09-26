import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/settings-row.ts")],
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
globalThis.__RENDERER_REACT__ = {
  useId: () => ":settings-row:",
};

const settings = await import(
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

let receivedAria;
let node = settings.SettingsRow({
  id: "theme-row",
  label: "Theme",
  description: "Choose an appearance",
  icon: "palette",
  control: (aria) => {
    receivedAria = aria;
    return { type: "select", props: aria };
  },
  className: "extra",
});
equal(node.type, "div", "renders a settings row container");
equal(node.props.id, "theme-row", "forwards the row id");
check(
  node.props.className.includes("@container/settings-row"),
  "marks the settings container",
);
check(node.props.className.includes("gap-6 py-3"), "uses default row spacing");
check(node.props.className.includes("extra"), "merges row classes");
const [label, control] = node.props.children;
equal(label.type.name, "SettingsLabel", "renders the shared label layout");
equal(label.props.label, "Theme", "forwards the row label");
equal(
  label.props.description,
  "Choose an appearance",
  "forwards the description",
);
equal(label.props.icon, "palette", "forwards the leading icon");
equal(
  receivedAria,
  {
    "aria-labelledby": ":settings-row:-label",
    "aria-describedby": ":settings-row:-description",
  },
  "connects function controls to labels and descriptions",
);
equal(
  control.props.children.type,
  "select",
  "renders the function control result",
);

node = settings.SettingsRow({
  label: "Compact",
  control: "toggle",
  size: "compact",
  variant: "featured",
  verticalAlignment: "start",
});
check(node.props.className.includes("gap-6 py-4"), "uses featured spacing");
check(node.props.className.includes("items-start"), "supports top alignment");
equal(
  node.props.children[1].props.children,
  "toggle",
  "renders direct controls",
);

node = settings.SettingsRow({
  label: "Nested",
  control: "value",
  variant: "nested",
});
check(node.props.className.includes("min-h-10"), "uses nested row layout");
check(
  node.props.children[1].props.className.includes("max-sm:justify-stretch"),
  "lets nested controls stretch on small surfaces",
);

node = settings.SettingsRow({
  label: "Stacked",
  control: "wide",
  variant: "stacked",
});
check(node.props.className.includes("flex-col"), "uses stacked row layout");
equal(
  node.props.children[1].props.className,
  "w-full",
  "makes stacked controls full width",
);

node = settings.SettingsRow({ control: "only" });
equal(node.props.children[0], null, "omits empty label regions");

node = settings.SettingsDescription({ children: "Secondary copy" });
equal(node.type, "span", "renders inline descriptions");
equal(node.props.children, "Secondary copy", "preserves description content");
check(
  node.props.className.includes("text-secondary"),
  "styles secondary descriptions",
);

node = settings.SettingsFieldRow({
  label: "Branch",
  children: "main",
  valueAlignment: "end",
});
equal(node.type, "div", "renders a field row grid");
check(
  node.props.className.includes("sm:grid-cols"),
  "uses responsive field columns",
);
equal(
  node.props.children[0].props.children,
  "Branch",
  "renders the field label",
);
equal(node.props.children[1].props.children, "main", "renders the field value");
check(
  node.props.children[1].props.className.includes("text-end"),
  "aligns requested values",
);

node = settings.SettingsFieldRow({
  label: "Mode",
  children: "Auto",
  variant: "compact",
});
check(
  node.props.className.includes("h-[1.875rem]"),
  "uses compact field height",
);
check(
  node.props.children[0].props.className.includes("ps-1"),
  "insets compact labels",
);
check(
  node.props.children[1].props.className.includes("overflow-hidden"),
  "contains compact field values",
);

let clicked = 0;
node = settings.SettingsActionRow({
  label: "Open project",
  description: "Browse files",
  icon: "folder",
  trailing: "⌘O",
  actions: "more",
  ariaLabel: "Open project settings",
  onClick: () => (clicked += 1),
});
equal(node.type, "div", "renders an action row wrapper");
check(
  node.props.className.includes("hover:bg-primary"),
  "styles interactive action rows",
);
const [button, actions] = node.props.children;
equal(button.type, "button", "uses a native action button");
equal(button.props.type, "button", "prevents implicit form submission");
equal(
  button.props["aria-label"],
  "Open project settings",
  "forwards action labels",
);
button.props.onClick({});
equal(clicked, 1, "runs action callbacks");
equal(
  button.props.children[0].type.name,
  "SettingsLabel",
  "reuses label layout",
);
equal(
  button.props.children[1].props.children,
  "⌘O",
  "renders trailing content",
);
equal(actions.props.children, "more", "renders secondary actions");

node = settings.SettingsActionRow({
  label: "Unavailable",
  disabled: true,
  actions: "hidden",
  variant: "recommendation",
});
equal(node.props.children[0].props.disabled, true, "disables action buttons");
equal(node.props.children[1], null, "hides actions for disabled rows");
check(
  node.props.className.includes("dark:bg-primary"),
  "styles recommendation rows",
);

node = settings.SettingsRow({
  label: "Empty description",
  description: "",
  control: () => "control",
});
equal(
  node.props.children[0].props.descriptionId,
  undefined,
  "does not label empty descriptions",
);

equal(
  settings.initializeSettingsRows(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared settings row behavior: ${assertions}/${assertions} assertions passed`,
);
