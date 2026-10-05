import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/partition-comment-attachments.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const items = [{ kind: "annotation" }, { kind: "design" }, { kind: "diff" }, { kind: "other" }];
assert.deepEqual(mod.partitionCommentAttachments(items, (x) => x.kind === "design", (x) => x.kind === "annotation", (x) => x.kind === "diff"), { annotationCommentAttachments: [items[0], items[2]], designTweakCommentAttachments: [items[1]], diffCommentAttachments: [items[3]] });
console.log("app-primary partition comment attachments: 1 assertion passed");
