import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__skillSourceDialogTest = {
  initializers: [],
  jsx: { jsx: (type, props) => ({ type, props }) },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/chatgpt-skill-source-dialog/index.ts"),
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
                  export const I3 = () => globalThis.__skillSourceDialogTest.jsx;
                  export const Jm = component => ({ lazy: component });
                  export const rC = "PluginIcon";
                  export const $3 = () => globalThis.__skillSourceDialogTest.initializers.push("compiler");
                  export const lw = () => globalThis.__skillSourceDialogTest.initializers.push("icons");
                  export const qm = () => globalThis.__skillSourceDialogTest.initializers.push("lazy");
                `,
                "app-initial": `
                  export const _E = "SkillDetailsDialog";
                  export const gE = () => globalThis.__skillSourceDialogTest.initializers.push("skills");
                `,
                "plugin-skill-preview": `
                  export const r = () => globalThis.__skillSourceDialogTest.initializers.push("preview");
                  export const t = "PluginSkillPreview";
                `,
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
const onClose = () => {};
check(
  state.initializers.join(",") === "compiler,skills,icons,lazy,preview",
  "initializes both skill detail routes",
);

const pluginNode = dialog.ChatGptSkillSourceDialog({
  source: {
    label: "Research",
    pluginId: "plugin-1",
    pluginName: "Research Plugin",
  },
  shouldBlockExternalEgress: true,
  onClose,
});
check(
  pluginNode.type === "PluginSkillPreview",
  "routes plugin-backed skills to preview",
);
check(
  pluginNode.props.skillName === "Research" &&
    pluginNode.props.title === "Research",
  "uses the source label",
);
check(
  pluginNode.props.description === "Research Plugin",
  "shows the plugin name",
);
check(
  pluginNode.props.icon.type === "PluginIcon",
  "uses the plugin skill icon",
);
check(pluginNode.props.pluginId === "plugin-1", "forwards the plugin identity");
check(
  pluginNode.props.shouldBlockExternalEgress,
  "forwards external egress policy",
);
check(pluginNode.props.onClose === onClose, "forwards the close callback");

const skillNode = dialog.ChatGptSkillSourceDialog({
  source: { label: "Writing", skillId: "skill-1" },
  shouldBlockExternalEgress: false,
  onClose,
});
check(
  skillNode.type.lazy === "SkillDetailsDialog",
  "routes built-in skills to lazy details",
);
check(
  skillNode.props.skillId === "skill-1",
  "forwards the built-in skill identity",
);
check(
  dialog.ChatGptSkillSourceDialog({
    source: { label: "Unknown" },
    shouldBlockExternalEgress: false,
    onClose,
  }) === null,
  "renders nothing for an unresolved source",
);

console.log(`${assertions} ChatGPT skill source dialog assertions passed`);
