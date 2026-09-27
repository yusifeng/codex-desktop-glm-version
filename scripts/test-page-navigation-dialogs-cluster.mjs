import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const React = {
  useEffect: (effect) => effect(),
  useLayoutEffect: (effect) => effect(),
  useRef: (value) => ({ current: value }),
  useState: (value) => [typeof value === "function" ? value() : value, () => {}],
};
globalThis.__jsx = jsx;
globalThis.__React = React;

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
          path: modulePath.slice(8), namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) =>
          modulePath === "app-shared"
            ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx;export const e6=()=>globalThis.__React;" }
            : { loader: "js", contents: "export default {};" },
        );
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const pageNavigation = await load("artifact-preview-page-navigation");
pageNavigation.t();
const scrolled = [];
const elements = [1, 2, 3].map((page) => ({
  scrollIntoView: (options) => scrolled.push({ page, options }),
}));
const changes = [];
const navigation = pageNavigation.n({
  containerRef: { current: { querySelectorAll: () => elements } },
  initialPage: 2,
  isPageLayoutReady: true,
  onPageChange: (page) => changes.push(page),
  pageSelector: "[data-page]",
  totalPages: 3,
});
assert.equal(navigation.currentPage, 2);
navigation.goToNextPage();
assert.equal(scrolled.at(-1).page, 3);
assert.equal(changes.at(-1), 3);
navigation.goToPage(99, "auto");
assert.equal(scrolled.at(-1).page, 3);
assert.equal(scrolled.at(-1).options.behavior, "auto");
navigation.goToPage(-10);
assert.equal(scrolled.at(-1).page, 1);

const keyboard = await load("keyboard-shortcuts-dialog");
let keyboardOpen = true;
const keyboardDialog = keyboard.KeyboardShortcutsDialog({
  commands: [{ id: "run", section: "Tasks", title: "Run task", shortcutLabels: ["⌘", "R"] }],
  onOpenChange: (open) => { keyboardOpen = open; },
});
assert.equal(keyboardDialog.type, "dialog");
assert.equal(keyboardDialog.props.children[2][0].props.children[0].props.children, "Tasks");
assert.equal(keyboardDialog.props.children[2][0].props.children[1].props.children[0].props.children[1].props.children, "⌘ R");
keyboardDialog.props.children[0].props.children[1].props.onClick();
assert.equal(keyboardOpen, false);
const emptyKeyboard = keyboard.KeyboardShortcutsDialog({ commands: [], onOpenChange() {} });
assert.equal(emptyKeyboard.props.children[2].props.role, "status");

const changelog = await load("changelog-modal");
let closed = false;
const modal = changelog.ChangelogModal({
  onClose: () => { closed = true; },
  post: {
    bodyMarkdown: "# Faster Codex\nA quicker start.\n\nMore details here.",
    date: "2026-09-27",
    summary: "A quicker start.",
    title: "Faster Codex",
    url: "https://developers.openai.com/codex/changelog",
    version: "1.2.3",
  },
});
assert.equal(modal.type, "dialog");
assert.equal(modal.props.children[2].props.children[1].props.children, "Faster Codex");
assert.equal(modal.props.children[2].props.children[0].props.children[1].props.children, "v1.2.3");
assert.equal(modal.props.children[2].props.children[3].props.children, "More details here.");
modal.props.children[0].props.onClick();
assert.equal(closed, true);

console.log("page navigation and dialogs cluster complete");
