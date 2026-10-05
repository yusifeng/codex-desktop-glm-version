import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "annotation-selection-style-"));
const output = path.join(temp, "annotation-selection-style.mjs");
try {
  await build({
    absWorkingDir: root,
    entryPoints: ["src/renderer/app-primary/runtime/annotation-selection-style.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: output,
  });
  const { getAnnotationSelectionStyle } = await import(`${output}?test=${Date.now()}`);
  assert.deepEqual(getAnnotationSelectionStyle({ appearance: "hover", zoomScale: 2 }), {
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderWidth: 1.125,
    borderColor: "#2563eb",
    boxShadow: "none",
  });
  assert.deepEqual(getAnnotationSelectionStyle({ fillOnly: true, zoomScale: 2 }), {
    backgroundColor: "color-mix(in srgb, var(--color-token-text-link-foreground, #339cff) 10%, transparent)",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: 0,
    borderColor: "var(--color-token-text-link-foreground, #339cff)",
    boxShadow: "none",
  });
  const styled = getAnnotationSelectionStyle({ borderWidthPx: 4, zoomScale: 2 });
  assert.equal(styled.borderWidth, 2);
  assert.equal(styled.boxShadow, "inset 0 0 0 0.5px rgba(255,255,255,0.28)");
  console.log("renderer annotation-selection-style: 3 assertions passed");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
