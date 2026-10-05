import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/derive-layout-motion-variant.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.deriveLayoutMotionVariant({ isCompact: true, shouldReduceMotion: false }), { animateRadius: true, lockedLayout: "single-line", radiusVariant: "compact" });
assert.deepEqual(mod.deriveLayoutMotionVariant({ shouldReduceMotion: true }), { animateRadius: false, lockedLayout: undefined, radiusVariant: undefined });
console.log("app-primary derive layout motion variant: 2 assertions passed");
