import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/lazy-component.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

const lazyLoaders = [];
globalThis.__RENDERER_LAZY_RETRY_DELAY__ = 0;
globalThis.__RENDERER_REACT__ = {
  Suspense: "Suspense",
  lazy(loader) {
    lazyLoaders.push(loader);
    return function LazyComponent(props) {
      return { kind: "lazy", props };
    };
  },
};
globalThis.__RENDERER_JSX_RUNTIME__ = {
  jsx: (type, props, key) => ({ type, props, key }),
};

const lazyRuntime = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const component = () => "loaded";
let wrapper = lazyRuntime.createLazyComponent(async () => component, {
  fallback: "loading",
});
let node = wrapper({ id: "dialog" });
equal(node.type, "Suspense", "wraps lazy components in Suspense");
equal(node.props.fallback, "loading", "forwards the loading fallback");
equal(node.props.children.props, { id: "dialog" }, "forwards component props");
equal((await lazyLoaders.shift()()).default, component, "returns successful components");

wrapper = lazyRuntime.createLazyComponent(async () => component, {
  suspendToParent: true,
});
equal(wrapper.name, "LazyComponent", "can delegate suspense to a parent");
equal((await lazyLoaders.shift()()).default, component, "loads delegated components");

let attempts = 0;
lazyRuntime.createLazyComponent(async () => {
  attempts += 1;
  if (attempts === 1) throw new Error("transient");
  return component;
});
equal((await lazyLoaders.shift()()).default, component, "returns a successful retry");
equal(attempts, 2, "retries exactly once after an initial failure");

const captured = [];
globalThis.__RENDERER_CAPTURE_ERROR__ = (error, metadata) => {
  captured.push({ error, metadata });
};
lazyRuntime.createLazyComponent(
  async () => {
    throw "offline";
  },
  { errorFallback: (props) => ({ kind: "error", props }) },
);
const fallbackModule = await lazyLoaders.shift()();
equal(captured.length, 1, "captures final load failures");
equal(captured[0].error.message, "Failed to load lazy component", "normalizes non-Error failures");
equal(captured[0].error.cause, "offline", "preserves the failure cause");
equal(
  captured[0].metadata,
  { tags: { operation: "lazy-component-load" } },
  "labels lazy load errors",
);
equal(
  fallbackModule.default({ id: "failed" }),
  { kind: "error", props: { id: "failed" } },
  "renders functional error fallbacks with component props",
);

captured.length = 0;
const terminalError = new Error("terminal");
lazyRuntime.createLazyComponent(
  async () => {
    throw terminalError;
  },
  { propagateLoadError: true },
);
await assert.rejects(lazyLoaders.shift()(), terminalError);
assertions += 1;
equal(captured, [], "does not capture propagated failures");
equal(lazyRuntime.initializeLazyComponent(), undefined, "initializes lazy component dependencies");

console.log(
  `app-shared lazy component behavior: ${assertions}/${assertions} assertions passed`,
);
