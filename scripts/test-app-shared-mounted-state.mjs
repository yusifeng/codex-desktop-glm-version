import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/mounted-state.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  plugins: [{
    name: "release-react-runtime",
    setup(build) {
      build.onResolve(
        { filter: /^@rchunk\/app-shared$/ },
        () => ({ path: "app-shared-react-runtime", namespace: "test" }),
      );
      build.onLoad(
        { filter: /.*/, namespace: "test" },
        () => ({ contents: "export const e6 = () => { throw new Error('release React fallback should not run in this test') }" }),
      );
    },
  }],
  write: false,
  logLevel: "silent",
});

let effect;
const ref = { current: false };
globalThis.__RENDERER_REACT__ = {
  useRef(initialValue) {
    ref.current = initialValue;
    return ref;
  },
  useEffect(nextEffect, dependencies) {
    assert.deepEqual(dependencies, []);
    effect = nextEffect;
  },
};

const mountedState = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

const isMounted = mountedState.useIsMounted();
equal(typeof isMounted, "function", "returns a mounted-state reader");
equal(isMounted(), false, "starts false before the effect commits");
equal(typeof effect, "function", "registers a mount effect");
const cleanup = effect();
equal(isMounted(), true, "becomes true after mounting");
equal(typeof cleanup, "function", "registers an unmount cleanup");
cleanup();
equal(isMounted(), false, "becomes false after unmounting");
equal(
  mountedState.initializeMountedState(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared mounted state behavior: ${assertions}/${assertions} assertions passed`,
);
