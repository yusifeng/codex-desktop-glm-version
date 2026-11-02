import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__threadTabTest = {
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) {
      return typeof type === "function"
        ? type(props ?? {})
        : { type, props: props ?? {}, key };
    },
    jsxs(type, props, key) {
      return typeof type === "function"
        ? type(props ?? {})
        : { type, props: props ?? {}, key };
    },
  },
};
globalThis.__threadTabTest.React = {
  useRef: (value) => ({ current: value }),
  useState: (value) => [
    typeof value === "function" ? value() : value,
    () => {},
  ],
  useCallback: (value) => value,
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  useEffect: () => {},
  useLayoutEffect: () => {},
  useImperativeHandle: () => {},
};
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "thread-tab-mocks",
        setup(build) {
          build.onResolve(
            { filter: /^@rchunk\/(popup|conversation-thumbnail-ui)$/ },
            ({ path: importPath }) => ({
              path: path.join(
                ROOT,
                "src/renderer",
                importPath.slice(8),
                "index.ts",
              ),
            }),
          );
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => ({
              contents:
                importPath === "app-shared"
                  ? "export const I3=()=>globalThis.__threadTabTest.jsx;export const e6=()=>globalThis.__threadTabTest.React;"
                  : "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}
function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children))
    children.flat(Infinity).forEach((child) => walk(child, visit));
  else walk(children, visit);
}
function find(node, predicate) {
  let result;
  walk(node, (value) => {
    if (result == null && predicate(value)) result = value;
  });
  return result;
}
function all(node, predicate) {
  const result = [];
  walk(node, (value) => {
    if (predicate(value)) result.push(value);
  });
  return result;
}
function text(node) {
  const result = [];
  walk(node, (value) => {
    if (typeof value.props?.children === "string")
      result.push(value.props.children);
  });
  return result.join(" ");
}

const commandMessageAssertions = assertReleaseOwner("command-messages");

// popup: 16
const popup = await bundle("popup");
assert.deepEqual(Object.keys(popup), ["i", "n", "r", "t"]);
let deleted = 0,
  stopped = 0,
  published = 0;
const exact = {
  id: "exact",
  textMatch: "exact",
  canBeDefault: true,
  content: "Exact",
  preview: {
    inline: { value: "exact", selectionStart: 1, selectionEnd: 5 },
    selected: { value: "exact", selectionStart: 0, selectionEnd: 5 },
  },
  deleteAction: {
    label: "Remove",
    run() {
      deleted++;
      return true;
    },
  },
};
const prefix = { id: "prefix", textMatch: "prefix", content: "Prefix" };
const source = {
  id: "history",
  getSuggestions() {
    return { suggestions: [prefix, exact] };
  },
  stop() {
    stopped++;
  },
};
const controller = new popup.r();
const unsubscribe = controller.subscribe(() => {
  published++;
});
controller.start({ value: "e", selectionStart: 1, selectionEnd: 1 }, [source]);
assert.deepEqual(
  controller.getSnapshot().suggestions.map((item) => item.id),
  ["exact", "prefix"],
);
assert.equal(controller.getSnapshot().selectedSuggestion.id, "exact");
assert.equal(controller.getSnapshot().preview.value, "exact");
assert.equal(controller.hasKeyboardSelection(), false);
controller.moveSelection(1);
assert.equal(controller.getSnapshot().selectedSuggestion.id, "prefix");
assert.equal(controller.hasKeyboardSelection(), true);
controller.setPreventInlineAutocompleteOnNextChange(true);
assert.equal(controller.shouldPreventInlineAutocompleteOnNextChange(), true);
assert.equal(controller.consumePreventInlineAutocompleteOnNextChange(), true);
assert.equal(controller.shouldPreventInlineAutocompleteOnNextChange(), false);
assert.equal(controller.isAutocompleteSelection("exact", 0, 5), true);
assert.equal(controller.deleteSuggestion(exact), true);
assert.equal(deleted, 1);
controller.stop("interaction", true);
assert.equal(stopped, 1);
assert.equal(controller.getSnapshot().query, null);
assert.ok(published >= 3);
unsubscribe();
const popupUi = popup.t({
  label: "Suggestions",
  listboxId: "list",
  suggestions: [exact],
  selectedIndex: 0,
  onSelect() {},
});
assert.equal(
  find(popupUi, (node) => node.props?.role === "option").props["aria-selected"],
  true,
);

assertReleaseOwner("tab-address-input");

// conversation-thumbnail-ui: 10
const thumbnail = await bundle("conversation-thumbnail-ui");
assert.deepEqual(Object.keys(thumbnail), ["n", "t"]);
assert.equal(
  thumbnail.t({ title: "Idle", statusState: { type: "idle" } }),
  null,
);
assert.match(
  text(thumbnail.t({ title: "Build", statusState: { type: "loading" } })),
  /Working/,
);
assert.match(
  text(thumbnail.t({ title: "Build", statusState: { type: "error" } })),
  /Task failed/,
);
assert.match(
  text(
    thumbnail.t({
      title: "Build",
      waitingFor: "waitingOnApproval",
      statusState: { type: "idle" },
    }),
  ),
  /Awaiting approval/,
);
assert.match(
  text(
    thumbnail.t({
      title: "Build",
      waitingFor: "waitingOnUserInput",
      statusState: { type: "idle" },
    }),
  ),
  /Needs input/,
);
assert.match(
  text(
    thumbnail.t({
      title: "Build",
      draft: "Unsent",
      statusState: { type: "idle" },
    }),
  ),
  /Draft/,
);
assert.match(
  text(
    thumbnail.t({
      title: "Build",
      statusState: { type: "idle", unread: true },
    }),
  ),
  /Unread response/,
);
const excerptUi = thumbnail.t({
  title: "Build",
  requestExcerpt: "Question",
  responseExcerpt: "Answer",
  statusState: { type: "idle" },
});
assert.equal(
  find(excerptUi, (node) => node.type === "blockquote").props.children,
  "Question",
);
assert.equal(
  find(excerptUi, (node) => node.type === "p").props.children,
  "Answer",
);

// thread-tab-entity: 5
const entity = await bundle("thread-tab-entity");
assert.deepEqual(Object.keys(entity), ["RegisteredChatGptEntityThumbnail"]);
assert.equal(
  entity.RegisteredChatGptEntityThumbnail({
    conversationId: "c1",
    title: "Empty",
  }),
  null,
);
const entityUi = entity.RegisteredChatGptEntityThumbnail({
  conversationId: "c1",
  title: "Chat",
  responseExcerpt: "Done",
  statusState: { type: "idle" },
});
assert.equal(entityUi.props["aria-label"], "Chat");
assert.equal(entityUi.props["data-status"], "idle");
assert.equal(all(entityUi, (node) => node.type === "p").length, 1);

console.log("56 thread tab and command flow cluster assertions passed");
