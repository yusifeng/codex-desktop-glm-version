import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";
const result = await esbuild.build({ entryPoints: ["src/renderer/app-primary/runtime/format-annotation-summary.ts"], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent" });
const { formatAnnotationSummary } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

const formatter = { formatMessage(message, values) {
  if (message === "mixed") return `${values.annotations}, ${values.comments}`;
  return `${message}:${values.count}`;
} };
const formatCount = (_formatter, message, count, kind) => `${message}:${count}:${kind}`;
const messages = { annotationCount: "annotation", commentCount: "comment", mixedSummary: "mixed" };
assert.equal(formatAnnotationSummary(formatter, { annotationCount: 2, commentCount: 1, designTweakCount: 1 }, messages, formatCount), "annotation:3:annotation, comment:1:comment");
assert.equal(formatAnnotationSummary(formatter, { annotationCount: 0, commentCount: 0 }, messages, formatCount), "");
assert.equal(formatAnnotationSummary(formatter, { annotationCount: 0, commentCount: 2 }, messages, formatCount), "comment:2:comment");
console.log("test-app-primary-format-annotation-summary: 3 assertions passed");
