import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenSettingsDialogTest = {
  closed: 0,
  initialized: 0,
  formatted: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-settings-dialog/index.ts"),
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
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__appgenSettingsDialogTest.jsx;
                  export const n4 = () => ({ formatMessage: (descriptor) => { globalThis.__appgenSettingsDialogTest.formatted.push(descriptor); return descriptor.defaultMessage; } });
                  export const Ih = "Dialog"; export const Oh = "DialogContent";
                  export const Ah = "DialogHeading"; export const Rh = "DialogTitle"; export const Y2 = "FormattedMessage";
                  export const $3 = () => {}; export const K2 = () => {}; export const zh = () => {}; export const Ph = () => {};
                `,
                "appgen-settings-page": `export const r = () => globalThis.__appgenSettingsDialogTest.initialized++; export const t = "SettingsPage";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const dialog = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
check(state.initialized === 1, "initializes the settings page dependency");
const node = dialog.AppgenSettingsDialog({
  projectId: "project-1",
  onClose: () => state.closed++,
});
check(node.type === "Dialog" && node.props.open, "renders an open dialog");
check(node.props.size === "xwide", "uses the extra-wide dialog size");
check(
  node.props.contentClassName === "h-[720px] max-h-[92vh]",
  "caps the settings viewport height",
);
check(
  node.props.contentProps["aria-describedby"] === undefined,
  "omits an unrelated dialog description reference",
);
check(
  node.props.dialogCloseLabel === "Close Site settings" &&
    state.formatted[0].id === "appgenSettings.dialog.close",
  "formats an accessible close label",
);

const content = node.props.children;
check(
  content.type === "DialogContent" && content.props.size === "full",
  "uses full-size dialog content",
);
const [heading, settingsPage] = content.props.children;
check(
  heading.props.children[0].props.className === "sr-only" &&
    heading.props.children[1].props.titleClassName === "truncate pe-8",
  "renders accessible and visible title variants",
);
check(
  settingsPage.type === "SettingsPage" &&
    settingsPage.props.projectId === "project-1",
  "renders settings for the selected project",
);
settingsPage.props.onDeleted();
check(state.closed === 1, "closes after project deletion");
node.props.onOpenChange(true);
check(state.closed === 1, "ignores an open-state notification");
node.props.onOpenChange(false);
check(state.closed === 2, "closes when the dialog is dismissed");

console.log(`${assertions} Appgen settings dialog assertions passed`);
