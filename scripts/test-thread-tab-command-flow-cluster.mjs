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
            { filter: /^@rchunk\/popup$/ },
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
                  : importPath === "conversation-thumbnail-ui"
                    ? `export const n=()=>{};export const t=props=>{const active=props.draft||props.requestExcerpt||props.responseExcerpt||props.waitingFor||props.statusState?.type!=="idle"||props.statusState?.unread;if(!active)return null;return{type:"article",props:{"aria-label":props.title,"data-status":props.statusState?.type,children:props.responseExcerpt?{type:"p",props:{children:props.responseExcerpt}}:null}}};`
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

assertReleaseOwner("popup");

assertReleaseOwner("tab-address-input");

assertReleaseOwner("conversation-thumbnail-ui");

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
