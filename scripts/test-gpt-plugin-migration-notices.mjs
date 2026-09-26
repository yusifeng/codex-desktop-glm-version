import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__migrationNoticesTest = {
  canUse: true,
  opened: null,
  migrated: 0,
  dismissed: 0,
  explored: 0,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/gpt-plugin-migration-notices/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__migrationNoticesTest.jsx;
                  export const n4 = () => ({ locale: "en-US", formatDate: value => "Dec 11:" + value, formatMessage: value => value.defaultMessage });
                  export const BX = () => ({ data: { permissions: [] } });
                  export const Y2 = "FormattedMessage"; export const Yh = "Button";
                  export const S_ = "Icon"; export const Tl = "PluginAsset";
                  export const o_ = "Tooltip"; export const sw = "CloseIcon";
                  export const $3 = () => {}; export const wl = () => {}; export const FX = () => {};
                  export const K2 = () => {}; export const Zh = () => {}; export const C_ = () => {};
                  export const lw = () => {}; export const c_ = () => {};
                `,
                "app-initial": `
                  export const afn = key => ({ get: field => field === "enabled" ? true : field === "retirement_date" ? "2026-12-11" : "https://help.example/{lang}" });
                  export const N6t = () => ({ accountId: "account-1" });
                  export const uht = () => ({ data: { id: "account-1", structure: "personal" } });
                  export const ofn = () => true; export const Dln = "permissions";
                  export const n7 = "Banner";
                  export const Oft = input => { globalThis.__migrationNoticesTest.opened = input; };
                  export const Oln = () => {}; export const M6t = () => {}; export const rht = () => {};
                  export const r7 = () => {}; export const Dft = () => {}; export const ifn = () => {};
                `,
                "gpt-plugin-retirement": `
                  export const t = value => value;
                  export const n = (_locale, template) => template.replace("{lang}", "en");
                  export const r = () => {};
                `,
                "migrated-plugin-access": `export const i = () => globalThis.__migrationNoticesTest.canUse;`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const notices = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let node = notices.n({
  surface: "chat",
  onMigrate: () => state.migrated++,
  onDismiss: () => state.dismissed++,
});
check(
  node.type === "Banner" && node.props.variant === "announcement",
  "renders the migration announcement",
);
check(
  node.props.title.props.values.deadline === "Dec 11:2026-12-11",
  "localizes the migration deadline",
);
let migrateButton = node.props.customCtas.props.children;
check(
  !migrateButton.props.disabled &&
    migrateButton.props.children.props.defaultMessage === "Migrate to plugin",
  "enables current-GPT migration",
);
migrateButton.props.onClick();
node.props.trailingAction.props.onClick();
check(
  state.migrated === 1 && state.dismissed === 1,
  "wires migration and dismissal actions",
);

state.canUse = false;
node = notices.n({ surface: "chat", onMigrate: () => {} });
check(
  node.props.customCtas.props.children.props.disabled,
  "disables migration without plugin permission",
);
check(
  node.props.customCtas.props.tooltipContent.props.defaultMessage.includes(
    "workspace must allow",
  ),
  "explains the missing workspace permission",
);

node = notices.t({
  surface: "migrated",
  onKeepUsingGpt: () => (state.kept = true),
});
check(
  node.props.content.props.defaultMessage.startsWith(
    "This GPT is now a plugin",
  ),
  "explains a blocked migrated plugin",
);
check(
  node.props.title.props.defaultMessage.startsWith("This GPT will be retired"),
  "uses the single-GPT retirement title",
);
node.props.customCtas.props.onClick();
check(state.kept, "wires the keep-using-GPT action");

node = notices.t({ surface: "directory", deadline: 123 });
check(
  node.props.title.props.defaultMessage.startsWith("GPTs will be retired"),
  "uses the directory retirement title",
);
check(
  node.props.content.props.values.deadline === "Dec 11:123",
  "supports an explicit retirement deadline",
);

node = notices.r({ actionPlacement: "below", currentGpt: true });
check(
  node.type === "div" &&
    node.props.children[0].props.variant === "announcementInset",
  "renders the inset retirement layout",
);
const learnMore = node.props.children[1];
check(
  learnMore.props.children.props.defaultMessage === "Learn more" &&
    learnMore.props.size === "detailAction",
  "uses the external learn-more action below",
);
learnMore.props.onClick("event");
check(
  state.opened.href === "https://help.example/en" &&
    state.opened.openTarget === "external-browser",
  "opens localized retirement help externally",
);

state.canUse = true;
node = notices.r({ currentGpt: true, onExplore: () => state.explored++ });
check(
  node.props.content.props.defaultMessage.startsWith(
    "This GPT will only remain",
  ),
  "uses current-GPT retirement guidance",
);
node.props.customCtas.props.onClick();
check(state.explored === 1, "wires plugin exploration for eligible users");

assert.equal(assertions, 16);
console.log(`${assertions} GPT plugin migration notices assertions passed`);
