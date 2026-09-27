import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__pageShellFallbackTest = {
  elementInView: true,
  featureGateCalls: [],
  signalReads: [],
  stateValues: [null, null],
  setters: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});

async function bundle(directory) {
  state.stateValues = [null, null];
  state.setters = [];
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
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({
              contents: mockChunk(importPath),
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

function mockChunk(name) {
  if (name === "app-shared")
    return `
    const reactRuntime = { useState(value) { const index = globalThis.__pageShellFallbackTest.setters.length; const setter = next => { globalThis.__pageShellFallbackTest.stateValues[index] = next; }; globalThis.__pageShellFallbackTest.setters.push(setter); return [globalThis.__pageShellFallbackTest.stateValues[index] ?? value, setter]; } };
    export const $3 = () => {}; export const FX = () => {}; export const K2 = () => {};
    export const I3 = () => globalThis.__pageShellFallbackTest.jsx;
    export const HX = signal => { globalThis.__pageShellFallbackTest.signalReads.push(signal); return signal.value; };
    export const n4 = () => ({ locale: "en" }); export const Y2 = "FormattedMessage";
    export const Yh = "Button"; export const Zh = () => {}; export const e6 = Object.assign(() => reactRuntime, reactRuntime);
  `;
  if (name === "app-initial")
    return `
    export const Dht = () => {}; export const Du = () => {}; export const Oht = { value: "panel" };
    export const Qgn = () => {}; export const Ygn = "Navigate"; export const cln = () => {};
    export const ifn = () => {}; export const ofn = gate => { globalThis.__pageShellFallbackTest.featureGateCalls.push(gate); return true; };
    export const Aet = () => {}; export const ket = "EmptyState";
    export const Jot = "ExternalLink"; export const Xot = () => {}; export const o3t = "OpenAiLogo"; export const s3t = () => {};
  `;
  if (name === "app-primary")
    return `
    export const P = () => {}; export const ds = "panel-gate"; export const dt = () => {}; export const ko = () => {};
    export const r = () => {}; export const rt = () => {}; export const us = "surface-gate";
    export const Jp = "UnrestoredTabIllustration"; export const Yp = () => {};
  `;
  if (name === "codex-home-announcements-current")
    return `export const r = () => {};`;
  if (name === "use-element-in-view")
    return `
    export const n = options => { globalThis.__pageShellFallbackTest.lastVisibilityOptions = options; return globalThis.__pageShellFallbackTest.elementInView; };
    export const t = () => {};
  `;
  return "export const sideEffect = true;";
}

const newThread = await bundle("new-thread-panel-page");
const redirect = newThread.NewThreadPanelPage();
assert.equal(redirect.type, "Navigate");
assert.deepEqual(redirect.props, { to: "/", replace: true });
assert.deepEqual(state.signalReads, [{ value: "panel" }]);
assert.deepEqual(state.featureGateCalls, ["surface-gate"]);

const unrestored = await bundle("unrestored-thread-tab-route");
let closeCalls = 0;
const fallbackWithoutResource = unrestored.UnrestoredThreadTabRoute({
  onClose: () => closeCalls++,
  routeKind: "conversation",
});
assert.equal(fallbackWithoutResource.type, "EmptyState");
assert.equal(
  fallbackWithoutResource.props.description.props.id,
  "threadTabRoute.unrestored.routeKind",
);
assert.deepEqual(fallbackWithoutResource.props.description.props.values, {
  routeKind: "conversation",
});
fallbackWithoutResource.props.actions.props.onClick();
assert.equal(closeCalls, 1);
const fallbackWithResource = unrestored.UnrestoredThreadTabRoute({
  onClose: () => {},
  routeKind: "project",
  routeResourceLabel: "Website",
});
assert.equal(
  fallbackWithResource.props.description.props.id,
  "threadTabRoute.unrestored.routeResource",
);
assert.equal(
  fallbackWithResource.props.description.props.values.routeResource,
  "Website",
);
assert.equal(
  fallbackWithResource.props.illustration.type,
  "UnrestoredTabIllustration",
);

const pageLayout = await bundle("page-layout");
const standardLayout = pageLayout.t({ title: "Sign in", children: "form" });
assert.equal(standardLayout.props.children[0].type, "header");
assert.equal(standardLayout.props.children[1].type, "main");
assert.equal(standardLayout.props.children[2].type, "footer");
assert.equal(
  standardLayout.props.children[1].props.children.props.children[0].props
    .children,
  "Sign in",
);
const embeddedLayout = pageLayout.t({
  title: "Embedded",
  children: "form",
  embedded: true,
  showFooter: false,
});
assert.equal(embeddedLayout.props.children[0], null);
assert.equal(
  embeddedLayout.props.children[1].props.children.props.children[0].props
    .className,
  "sr-only",
);
assert.equal(embeddedLayout.props.children[2], null);

const titleVisibility = await bundle("use-searchable-page-title-visibility");
state.elementInView = true;
let visibility = titleVisibility.n();
assert.equal(visibility.showTitleInToolbar, false);
visibility.scrollContainerRef("container");
visibility.titleRef("title");
state.setters = [];
visibility = titleVisibility.n();
assert.equal(visibility.showTitleInToolbar, false);
assert.deepEqual(globalThis.__pageShellFallbackTest.lastVisibilityOptions, {
  container: "container",
  target: "title",
});
state.elementInView = false;
state.setters = [];
assert.equal(titleVisibility.n().showTitleInToolbar, true);

console.log("22 page shell and fallback cluster assertions passed");
