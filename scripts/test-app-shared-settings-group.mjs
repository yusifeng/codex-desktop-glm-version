import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/ui/settings-group.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

globalThis.__RENDERER_JSX_RUNTIME__ = {
  jsx: (type, props, key) => ({ type, props, key }),
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

check(
  settings.settingsDividerClassName.includes("after:bottom-0"),
  "exports the divider layout class",
);
check(
  settings.settingsDividerClassName.includes("after:bg-border"),
  "styles divider borders",
);

let node = settings.SettingsGroup({ children: "rows", className: "extra" });
equal(node.type, "div", "renders a settings group container");
equal(node.props.children, "rows", "preserves group content");
check(
  node.props.className.includes(settings.settingsDividerClassName),
  "enables dividers by default",
);
check(node.props.className.includes("rounded-2xl"), "uses default rounding");
check(
  node.props.className.includes("overflow-hidden"),
  "clips content by default",
);
check(
  node.props.className.includes("border border-default"),
  "uses the default border treatment",
);
check(node.props.className.includes("extra"), "merges custom classes");
equal(
  node.props.style,
  {
    backgroundColor:
      "var(--color-background-panel, var(--color-background-primary-soft-alpha))",
  },
  "uses the panel background fallback",
);

node = settings.SettingsGroup({
  contentOverflow: "visible",
  dividers: false,
  variant: "metered",
});
check(
  node.props.className.startsWith("flex flex-col"),
  "keeps a column layout without dividers",
);
check(
  node.props.className.includes("overflow-visible"),
  "supports visible overflow",
);
check(
  node.props.className.includes("ring-border-subtle"),
  "styles metered groups",
);
check(
  node.props.style != null,
  "keeps the panel background for metered groups",
);

node = settings.SettingsGroup({ variant: "secondary" });
check(
  node.props.className.includes("bg-surface-secondary/92"),
  "styles secondary groups",
);
equal(
  node.props.style,
  undefined,
  "omits inline backgrounds for secondary groups",
);

node = settings.SettingsGroup({ variant: "form" });
check(node.props.className.includes("border-subtle"), "styles form borders");
check(node.props.className.includes("bg-surface"), "styles form surfaces");

node = settings.SettingsGroup({
  decoration: "daybreak",
  variant: "recommendation",
});
check(
  node.props.className.includes("rounded-[20px]"),
  "uses recommendation rounding",
);
check(
  node.props.className.includes("bg-surface-secondary"),
  "styles recommendation surfaces",
);
check(
  node.props.className.includes("_daybreak_1ajk7_1"),
  "applies daybreak decoration",
);
equal(
  node.props.style,
  undefined,
  "omits inline backgrounds for recommendation groups",
);

equal(
  settings.initializeSettingsDividers(),
  undefined,
  "keeps divider initialization idempotent",
);
equal(
  settings.initializeSettingsGroup(),
  undefined,
  "keeps group initialization idempotent",
);

console.log(
  `app-shared settings group behavior: ${assertions}/${assertions} assertions passed`,
);
