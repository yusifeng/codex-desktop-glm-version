import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(mocks) {
  const result = await esbuild.build({
    entryPoints: [
      path.join(ROOT, "src/renderer/home-artifact-templates/index.ts"),
    ],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    define: {
      "import.meta.url": JSON.stringify(
        pathToFileURL(
          path.join(
            ROOT,
            "app/webview/assets/home-artifact-templates-1e0738b7ddeb.js",
          ),
        ).href,
      ),
    },
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

function walk(node, predicate, matches = []) {
  if (node == null || typeof node !== "object") return matches;
  if (predicate(node)) matches.push(node);
  const children = node.props?.children;
  if (Array.isArray(children)) {
    for (const child of children.flat(Infinity))
      walk(child, predicate, matches);
  } else {
    walk(children, predicate, matches);
  }
  return matches;
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

globalThis.__artifactTemplatesTest = {
  active: true,
  appended: [],
  attachmentEvents: [],
  closed: 0,
  focusCount: 0,
  inserted: [],
  mentions: [],
  metadata: new Map(),
  mutationInput: null,
  skills: [],
  useEvents: [],
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
    Fragment: "fragment",
    useRef(value) {
      return { current: value };
    },
    useState(value) {
      return [value, () => {}];
    },
    useEffect(effect) {
      effect();
    },
  },
  composer: {
    appendPromptText(value) {
      globalThis.__artifactTemplatesTest.appended.push(value);
    },
    insertTextAtSelection(value) {
      globalThis.__artifactTemplatesTest.inserted.push(value);
    },
    insertSkillMentionAtSelection(skill) {
      globalThis.__artifactTemplatesTest.mentions.push(skill.path);
    },
    focus() {
      globalThis.__artifactTemplatesTest.focusCount += 1;
    },
  },
};

const artifactTemplates = await loadModule({
  "app-shared": `
    export const I3 = globalThis.__artifactTemplatesTest.jsx;
    export const e6 = globalThis.__artifactTemplatesTest.react;
    export const HX = signal => typeof signal === "function" ? signal() : signal;
    export const LX = () => ({ get: key => key === "journey" ? "new-chat" : ({ danger() {}, success() {} }) });
    export const n4 = () => ({ formatMessage: (descriptor, values = {}) => descriptor.defaultMessage.replace(/\\{([^}]+)\\}/g, (_, key) => values[key] ?? "{" + key + "}") });
    export const m4 = (...values) => values.filter(Boolean).join(" ");
    export const BX = () => ({ data: new Map() });
    export const QX = (_scope, factory) => factory;
    export const ZI = Symbol("scope");
    export const pk = Symbol("toast");
    export const S_ = "Icon";
    export const Yh = "Button";
    export const wt = "plus";
    export const Yd = "arrow";
    export const dw = "close";
  `,
  "app-initial": `
    export const kht = Symbol("picker-scope");
    export const Syt = "context";
    export const Dyt = "host-1";
    export const Ukt = true;
    export const Z6t = () => false;
    export const Gfn = () => [0, () => {}];
    export const UZ = (_composer, _selector, fallback) => fallback === undefined ? false : "document";
    export const lEt = () => ({ forceReload: async () => {}, isLoading: false, skills: globalThis.__artifactTemplatesTest.skills });
    export const iun = (_name, _options) => ({ isPending: false, mutate: input => { globalThis.__artifactTemplatesTest.mutationInput = input; } });
    export const sun = () => async () => {};
    export const sEt = ["skills"];
    export const G1 = () => ({ data: globalThis.__artifactTemplatesTest.metadata, isLoading: false });
    export const C5t = skills => skills.filter(skill => skill.name !== "template-creator");
    export const T5t = () => true;
    export const E5t = skills => skills;
    export const D5t = kind => kind;
    export const M5t = skill => skill.title;
    export const b5t = (_creator, skill) => "Edit " + skill.title;
    export const HZ = () => globalThis.__artifactTemplatesTest.composer;
    export const Lz = () => ({ minimum: 0, maximum: 100 });
    export const Rz = (_element, direction) => direction < 0 ? 0 : 100;
    export const Qln = async () => ({ createdAtMs: 1 });
    export const _ = "Surface";
    export const YX = "Panel";
    export const XX = "Body";
    export const ZX = "Header";
  `,
  "app-primary": `
    export const hg = () => globalThis.__artifactTemplatesTest.active;
    export const gg = "document";
    export const po = () => false;
    export const vg = () => "document";
    export const wi = () => {};
    export const vi = () => { globalThis.__artifactTemplatesTest.closed += 1; };
    export const Ei = (_scope, skill) => globalThis.__artifactTemplatesTest.useEvents.push(skill.path);
    export const Ti = () => {};
    export const Si = (_scope, event) => globalThis.__artifactTemplatesTest.attachmentEvents.push(event);
    export const Ci = () => {};
    export const bi = "journey";
  `,
  "home-suggestion-staggered-item": `
    export const n = () => {};
    export const t = "StaggeredItem";
  `,
  "home-artifact-template-card": `
    export const n = () => {};
    export const t = "TemplateCard";
  `,
});

const reusableSkill = {
  enabled: true,
  name: "quarterly-plan",
  path: "/skills/quarterly-plan",
  title: "Quarterly plan",
};
const templateCreator = {
  enabled: true,
  name: "template-creator",
  path: "/skills/template-creator",
  title: "Template Creator",
};
globalThis.__artifactTemplatesTest.skills = [reusableSkill, templateCreator];
globalThis.__artifactTemplatesTest.metadata = new Map([
  [reusableSkill.path, { galleryKind: "document", sourceUrl: null }],
]);

const reusableView = artifactTemplates.ArtifactTemplatePicker({
  canUseTemplateAttachments: true,
  onAddFileAssetAttachment: async () => ({ path: "/attachment" }),
});
check(reusableView.type === "Surface", "renders the floating template surface");
const templateCard = walk(
  reusableView,
  (node) => node.type === "TemplateCard",
)[0];
check(
  templateCard != null,
  "renders reusable skills through the template card chunk",
);
templateCard.props.onUse();
check(
  globalThis.__artifactTemplatesTest.inserted.join("") ===
    "Use the  template." &&
    globalThis.__artifactTemplatesTest.mentions[0] === reusableSkill.path &&
    globalThis.__artifactTemplatesTest.useEvents[0] === reusableSkill.path,
  "inserts a skill mention in the localized use-template prompt",
);
templateCard.props.onEdit();
check(
  globalThis.__artifactTemplatesTest.appended.at(-1) === "Edit Quarterly plan",
  "prefills the Template Creator edit prompt",
);
templateCard.props.onDelete();
check(
  globalThis.__artifactTemplatesTest.mutationInput.skillPath ===
    reusableSkill.path,
  "deletes an eligible personal template through remove-skill",
);
const creatorNode = walk(
  reusableView,
  (node) => node.type?.name === "TemplateCreatorCard",
)[0];
const creatorCard = creatorNode.type(creatorNode.props);
creatorCard.props.onClick();
check(
  globalThis.__artifactTemplatesTest.appended
    .at(-1)
    .includes(
      "[@Template Creator](plugin://template-creator@openai-primary-runtime)",
    ),
  "prefills the kind-specific create-template prompt",
);
walk(
  reusableView,
  (node) => node.props?.["aria-label"] === "Close templates",
)[0].props.onClick();
check(
  globalThis.__artifactTemplatesTest.closed === 1,
  "dismisses the picker from the close button",
);

globalThis.__artifactTemplatesTest.skills = [templateCreator];
globalThis.__artifactTemplatesTest.metadata = new Map();
const builtInView = artifactTemplates.ArtifactTemplatePicker({
  canUseTemplateAttachments: true,
  onAddFileAssetAttachment: async ({ label }) => ({
    path: `/attachments/${label}`,
  }),
});
const galleryNode = walk(
  builtInView,
  (node) => node.type?.name === "BuiltInTemplateGallery",
)[0];
const gallery = galleryNode.type(galleryNode.props);
const attachButtons = walk(gallery, (node) =>
  node.props?.["aria-label"]?.startsWith("Attach "),
);
check(
  attachButtons.length === 3,
  "offers all three built-in document templates",
);
attachButtons[0].props.onClick();
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  globalThis.__artifactTemplatesTest.attachmentEvents[0].templateId ===
    "project-brief" && globalThis.__artifactTemplatesTest.focusCount === 1,
  "attaches a built-in template and restores composer focus",
);

globalThis.__artifactTemplatesTest.active = false;
check(
  artifactTemplates.ArtifactTemplatePicker({
    canUseTemplateAttachments: true,
  }) === null,
  "does not render while the picker state is inactive",
);

assert.equal(assertions, 10);
console.log(`${assertions} Home artifact templates assertions passed`);
