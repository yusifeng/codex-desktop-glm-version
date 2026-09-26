import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(mocks) {
  const result = await esbuild.build({
    entryPoints: [
      path.join(ROOT, "src/renderer/home-artifact-template-card/index.ts"),
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
              contents: mocks[importPath] ?? "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

globalThis.__templateCardTest = {
  beforeView: 0,
  deleted: 0,
  opened: [],
  previews: [],
  thumbnailBuilds: 0,
  used: 0,
  jsx: {
    Fragment: "fragment",
    jsx(type, props, key) {
      return { type, props, key };
    },
    jsxs(type, props, key) {
      return { type, props, key };
    },
  },
  react: {
    createElement(type, props) {
      return { type, props };
    },
    useState(value) {
      return [value, () => {}];
    },
  },
};

const templateCard = await loadModule({
  "app-shared": `
    export const I3 = globalThis.__templateCardTest.jsx;
    export const e6 = globalThis.__templateCardTest.react;
    export const LX = () => ({ id: "scope" });
    export const n4 = () => ({ formatMessage: (descriptor, values) => descriptor.defaultMessage.replace("{title}", values.title) });
    export const kf = "Menu";
    export const jf = { Item: "MenuItem" };
    export const gu = "MenuTrigger";
    export const Ih = "Dialog";
    export const Oh = "DialogBody";
    export const kh = "DialogActions";
    export const Yh = "Button";
    export const $h = "DialogHeader";
  `,
  "app-initial": `
    export const $en = Symbol("scope");
    export const QY = () => {};
    export const YY = "TemplateViewer";
    export const JY = "TemplateViewerContent";
    export const O3t = "DocsIcon";
    export const E3t = "SheetsIcon";
    export const w3t = "SlidesIcon";
    export const M5t = skill => skill.title;
    export const S5t = skill => skill.templateId ?? null;
    export const k5t = kind => kind.startsWith("google-");
    export const X3 = () => {
      globalThis.__templateCardTest.thumbnailBuilds += 1;
      return "Thumbnail";
    };
    export const Ult = (...args) => globalThis.__templateCardTest.previews.push(args);
    export const kft = options => globalThis.__templateCardTest.opened.push(options);
    export const $Wt = skill => skill.description;
  `,
});

const skill = {
  title: "Quarterly plan",
  description: "A planning template",
  path: "/skills/quarterly-plan",
  templateId: "template-1",
};
const card = templateCard.t({
  deleteDisabled: false,
  hostId: "local-host",
  isSelected: true,
  onBeforeView: () => {
    globalThis.__templateCardTest.beforeView += 1;
  },
  onDelete: () => {
    globalThis.__templateCardTest.deleted += 1;
  },
  onEdit: () => {},
  onUse: () => {
    globalThis.__templateCardTest.used += 1;
  },
  skill,
  templateKind: "google-docs",
});
check(
  card.props.className.includes("group/template-card") &&
    card.props.children[0].props["aria-pressed"],
  "renders a selected template card",
);
card.props.children[0].props.onClick();
check(globalThis.__templateCardTest.used === 1, "forwards template selection");
check(
  card.props.children[0].props.children[0].props.className.includes(
    "aspect-[4/5]",
  ),
  "uses a portrait preview for document templates",
);
const actionsNode = card.props.children[1].props.children;
const actions = actionsNode.type(actionsNode.props);
actions.props.children[0].props.onSelect();
check(
  globalThis.__templateCardTest.beforeView === 1 &&
    globalThis.__templateCardTest.previews[0][1] === "template-1" &&
    globalThis.__templateCardTest.previews[0][2].isPreview,
  "opens an installed template in artifact preview mode",
);
const deleteNode = card.props.children[3];
const deleteDialog = deleteNode.type(deleteNode.props);
let prevented = false;
deleteDialog.props.children.props.onSubmit({
  preventDefault() {
    prevented = true;
  },
});
check(
  prevented && globalThis.__templateCardTest.deleted === 1,
  "confirms template deletion through the dialog form",
);

templateCard.t({
  hostId: "local-host",
  onUse() {},
  skill,
  templateKind: "google-docs",
});
check(
  globalThis.__templateCardTest.thumbnailBuilds === 1,
  "caches generated thumbnail components per skill",
);

const remoteSkill = { title: "Drive template", path: "/drive/template" };
const remoteCard = templateCard.t({
  hostId: "remote-host",
  onBeforeView: () => {
    globalThis.__templateCardTest.beforeView += 1;
  },
  onUse() {},
  skill: remoteSkill,
  sourceUrl: "https://drive.google.com/template",
  templateKind: "google-slides",
});
const remoteActionsNode = remoteCard.props.children[1].props.children;
const remoteActions = remoteActionsNode.type(remoteActionsNode.props);
remoteActions.props.children[0].props.onSelect();
check(
  globalThis.__templateCardTest.opened[0].openTarget === "in-app-browser" &&
    globalThis.__templateCardTest.opened[0].originHostId === "remote-host",
  "opens source templates in the originating host's in-app browser",
);
check(
  remoteCard.props.children[2].type === "TemplateViewer" &&
    remoteCard.props.children[2].props.children.type ===
      "TemplateViewerContent",
  "keeps the skill viewer available when no artifact template id exists",
);

assert.equal(assertions, 8);
console.log(`${assertions} Home artifact template card assertions passed`);
