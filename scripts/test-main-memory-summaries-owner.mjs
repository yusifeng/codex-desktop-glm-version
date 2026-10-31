import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/computer-use/memory-summaries.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
const slice = (name) => { const node = fn(name); assert.ok(node); return transpiled.code.slice(node.start, node.end); };

const parseSummaryFileName = Function(
  "MEMORY_SUMMARY_FILENAME_RE", "SIX_HOUR_MS", "TEN_MINUTE_MS", "SIX_HOUR",
  `${slice("parseSummaryFileName")}; return parseSummaryFileName;`,
)(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-[^-]+-(10min|6h)-memory-summary\.md$/, 216e5, 6e5, "six_hour");
assertions += 1;
const tenMinute = parseSummaryFileName("2026-10-31T08-09-10-id-10min-memory-summary.md");
equal(tenMinute.summaryLevel, "ten_minute");
equal(tenMinute.interval.endMs - tenMinute.interval.startMs, 600_000);
const sixHour = parseSummaryFileName("2026-10-31T08-09-10-id-6h-memory-summary.md");
equal(sixHour.summaryLevel, "six_hour");
equal(sixHour.interval.endMs - sixHour.interval.startMs, 21_600_000);
equal(parseSummaryFileName("not-a-summary.md"), null);

const activeSummaryIntervals = Function(
  "listSummaryFiles",
  `${slice("activeSummaryIntervals")}; return activeSummaryIntervals;`,
)(async () => [
  { interval: { startMs: 20, endMs: 30 } },
  { interval: { startMs: 40, endMs: 50 } },
  { interval: { startMs: 0, endMs: 10 } },
]);
equal(await activeSummaryIntervals({ resourcesDirectory: "/memory", sinceMs: 10 }), [
  { startMs: 40, endMs: 50 },
  { startMs: 20, endMs: 30 },
]);

const listApplicationsByBundleIds = Function(
  "createApplicationResolver",
  `${slice("normalizeAppEntry")}\n${slice("listApplicationsByBundleIds")}; return listApplicationsByBundleIds;`,
)(() => { throw new Error("resolver must be injected"); });
const resolved = await listApplicationsByBundleIds({
  bundleIdentifiers: ["com.example.app", "com.example.app", "com.example.background", "com.example.failure"],
  resolveApplication: async (bundleId) => {
    if (bundleId.endsWith("failure")) throw new Error("lookup");
    return {
      bundleIdentifier: bundleId,
      displayName: bundleId.endsWith("app") ? "Example" : "Background",
      iconDataURL: "icon",
      isWebBrowser: false,
      isBackgroundAgent: bundleId.endsWith("background"),
      extra: true,
    };
  },
});
equal(resolved, [
  { bundleIdentifier: "com.example.app", displayName: "Example", iconDataURL: "icon", isWebBrowser: false },
  { bundleIdentifier: "com.example.failure", displayName: "failure", iconDataURL: null, isWebBrowser: false },
]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/computer-use/memory-summaries.js")'), true);
equal(main.includes("listAmbientSummaries: Yj"), true);
equal(main.includes("newAmbientSuggestions: Xj"), true);
equal(main.includes("activeSummaryIntervals: Zj"), true);
equal(main.includes("listAllApplications: Qj"), true);
equal(main.includes("listApplicationsByBundleIds: $j"), true);
equal(main.includes("async function Yj("), false);
equal(main.includes("async function Xj("), false);
equal(main.includes("async function Zj("), false);
equal(main.includes("async function Qj("), false);
equal(main.includes("async function $j("), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("list: () => Yj({ resourcesDirectory: m })"), true);
equal(windowContext.includes("listSuggestions: () => Xj({ resourcesDirectory: m })"), true);
equal(windowContext.includes("listSummaryIntervals: (e) => Zj({ resourcesDirectory: m, sinceMs: e })"), true);
console.log(`${assertions} main memory summaries owner assertions passed`);
