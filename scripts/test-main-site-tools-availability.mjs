import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({ entryPoints: [new URL("../src/main/main-app/browser-sidebar/site-tools-availability.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false });
const { createSiteToolsAvailabilityRuntime } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const runtime = createSiteToolsAvailabilityRuntime({ isEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right) });
const page = {
  isMainFrameLoading: false,
  webMcpTools: [],
  webMcpToolsRevision: 0,
  siteAnnotationFeatures: undefined,
  siteToolsAvailability: { webMcp: "pending-unavailable", annotations: "pending-unavailable" },
};

equal(runtime.applyWebMcpTools(page, []), true);
equal(page.webMcpToolsRevision, 1);
equal(page.siteToolsAvailability.webMcp, "unavailable");
equal(runtime.applyWebMcpTools(page, []), false);
equal(page.webMcpToolsRevision, 1);
equal(runtime.applyWebMcpTools(page, [{ name: "search" }]), true);
equal(page.webMcpToolsRevision, 2);
equal(page.siteToolsAvailability.webMcp, "available");
equal(runtime.applyWebMcpTools(page, [{ name: "search" }]), false);

equal(runtime.applyAnnotationFeatures(page, undefined), true);
equal(page.siteToolsAvailability.annotations, "unavailable");
equal(runtime.applyAnnotationFeatures(page, undefined), false);
equal(runtime.applyAnnotationFeatures(page, ["comment"]), true);
equal(page.siteToolsAvailability.annotations, "available");
equal(page.siteAnnotationFeatures, ["comment"]);

runtime.markSiteToolsPending(page);
equal(page.siteToolsAvailability, { webMcp: "pending-available", annotations: "pending-available" });
page.isMainFrameLoading = true;
equal(runtime.applyWebMcpTools(page, []), true);
equal(page.siteToolsAvailability.webMcp, "pending-available");
equal(runtime.applyAnnotationFeatures(page, []), true);
equal(page.siteToolsAvailability.annotations, "pending-available");
page.isMainFrameLoading = false;
runtime.refreshSiteToolsAvailability(page);
equal(page.siteToolsAvailability, { webMcp: "unavailable", annotations: "unavailable" });
equal(page.webMcpToolsRevision, 4);

runtime.applyWebMcpTools(page, [{ name: "open" }]);
runtime.applyAnnotationFeatures(page, ["select"]);
runtime.clearSiteTools(page);
equal(page.webMcpTools, []);
equal(page.siteAnnotationFeatures, []);
equal(page.siteToolsAvailability, { webMcp: "unavailable", annotations: "unavailable" });
runtime.markSiteToolsPending(page);
equal(page.siteToolsAvailability, { webMcp: "pending-unavailable", annotations: "pending-unavailable" });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const binding = fs.readFileSync(new URL("../src/main/main-app/browser-sidebar/browser-page-webview-binding-controller.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/site-tools-availability.js")'), true);
for (const oldOwner of ["function qX(", "function JX(", "function YX(", "function XX(", "function $Xe(", "function ZX(", "function QX("]) equal(main.includes(oldOwner), false);
equal(main.includes("XX, $Xe, EHe"), true);
equal(binding.includes("XX, $Xe, EHe"), true);
equal(binding.includes("$Xe(r)"), true);
console.log(`${assertions} main site tools availability assertions passed`);
