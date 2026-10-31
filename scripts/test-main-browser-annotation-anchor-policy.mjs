import assert from "node:assert/strict";
import fs from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { build } from "esbuild";
import { z } from "zod";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/browser-sidebar/browser-annotation-anchor-policy.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserAnnotationAnchorPolicy } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const shared = {
  Of: () => z.string(),
  Cf: () => z.number(),
  bf: (value) => z.literal(value),
  pf: () => z.null(),
  Af: () => z.array(z.never()).length(0),
  wf: (shape) => z.object(shape),
  hf: (schema) => z.array(schema),
  Sf: () => z.any(),
  Cu: (left, right) => {
    const stripEnrichment = (value) => {
      if (value == null || typeof value !== "object") return value;
      const { elementMetadata, elementName, ...identity } = value;
      return identity;
    };
    return isDeepStrictEqual(stripEnrichment(left), stripEnrichment(right));
  },
  Pu: (value) =>
    value != null && typeof value === "object" && !Array.isArray(value)
      ? value
      : undefined,
  Fu: (value) =>
    typeof value === "string" && value.length > 0 ? value : undefined,
};
const policy = createBrowserAnnotationAnchorPolicy({ shared });

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

for (const [value, success] of [
  ["surface-1", true],
  ["", false],
  ["x".repeat(128), true],
  ["x".repeat(129), false],
  ["bad\u0000id", false],
  ["bad\u2028id", false],
]) {
  equal(policy.virtualTargetIdSchema.safeParse(value).success, success, value);
}
for (const [value, success] of [
  ["button", true],
  ["graphics-item-2", true],
  ["Button", false],
  ["2button", false],
  ["x".repeat(64), true],
  ["x".repeat(65), false],
]) {
  equal(policy.virtualRoleSchema.safeParse(value).success, success, value);
}

const virtualAnchor = {
  kind: "virtual",
  surfaceId: "surface",
  targetId: "target",
  pageUrl: "https://example.com/page",
  frameUrl: null,
  framePath: [],
  selector: null,
  role: "button",
  name: null,
  nearbyText: null,
  isFixed: true,
  point: { xPercent: 50, y: 20 },
  rect: { x: 10, y: 20, width: 30, height: 40 },
};
const virtualState = {
  anchor: virtualAnchor,
  viewportRect: { ...virtualAnchor.rect },
  viewportPoint: { x: 25, y: 30 },
  viewportSize: { width: 100, height: 100 },
};
equal(
  policy.isValidVirtualAnchorState(virtualState, "https://example.com/page"),
  true,
);
equal(
  policy.isValidVirtualAnchorState(virtualState, "https://other.example/page"),
  false,
);
equal(
  policy.isValidVirtualAnchorState(
    {
      ...virtualState,
      viewportRect: { ...virtualState.viewportRect, width: 31 },
    },
    "https://example.com/page",
  ),
  false,
);
equal(
  policy.isValidVirtualAnchorState(
    { ...virtualState, viewportPoint: { x: 101, y: 30 } },
    "https://example.com/page",
  ),
  false,
);
equal(
  policy.isValidVirtualAnchorState(
    {
      ...virtualState,
      anchor: {
        ...virtualAnchor,
        rect: { x: 80, y: 20, width: 30, height: 40 },
      },
    },
    "https://example.com/page",
  ),
  false,
);

const elementAnchor = {
  kind: "element",
  pageUrl: "https://example.com/page",
  frameUrl: null,
  framePath: [],
  runtimeElementId: "runtime-1",
  elementPath: "body>button",
  selector: "#submit",
  role: "button",
};
const runtimeElement = {
  ...elementAnchor,
  elementMetadata: { component: "SubmitButton" },
  elementName: "button",
};
const state = { anchor: elementAnchor, additionalAnchors: [] };
const normalized = policy.normalizeAnchorState(
  state,
  "https://example.com/page",
  { anchor: runtimeElement },
);
equal(normalized.anchor.elementMetadata, { component: "SubmitButton" });
equal(normalized.anchor.elementName, "button");
equal(normalized.anchor.role, "button");
equal(normalized.additionalAnchors, []);

const wrongPage = policy.normalizeAnchorState(
  state,
  "https://other.example/page",
  { anchor: runtimeElement },
);
equal("elementMetadata" in wrongPage.anchor, false);
equal("elementName" in wrongPage.anchor, false);

const ambiguous = policy.normalizeAnchorState(
  state,
  "https://example.com/page",
  {
    anchor: { ...runtimeElement, elementMetadata: { index: 1 } },
    additionalAnchors: [{ ...runtimeElement, elementMetadata: { index: 2 } }],
  },
);
equal("elementMetadata" in ambiguous.anchor, false);

const virtualWithoutMetadata = { ...virtualAnchor };
const virtualReplacement = {
  ...virtualAnchor,
  role: "graphics-item",
  elementMetadata: { color: "red" },
  elementName: "shape",
};
const normalizedVirtual = policy.normalizeAnchorState(
  { anchor: virtualWithoutMetadata },
  null,
  { anchor: virtualReplacement },
);
equal(normalizedVirtual.anchor.role, "graphics-item");
equal(normalizedVirtual.anchor.elementMetadata, { color: "red" });
equal(normalizedVirtual.anchor.elementName, "shape");

const invalidVirtualRole = policy.normalizeAnchorState(
  { anchor: virtualWithoutMetadata },
  null,
  { anchor: { ...virtualReplacement, role: "INVALID ROLE" } },
);
equal(invalidVirtualRole.anchor.role, null);

const designChange = { id: "design", anchor: elementAnchor };
const updatedDesignChange = policy.updateDesignChangeAnchor(
  designChange,
  "https://example.com/page",
  runtimeElement,
);
equal(updatedDesignChange.anchor.elementName, "button");
equal(policy.updateDesignChangeAnchor(null, "https://example.com/page"), null);

const comment = {
  id: "comment",
  anchor: runtimeElement,
  additionalAnchors: [{ ...runtimeElement, runtimeElementId: "runtime-2" }],
  designChange: { id: "design", anchor: runtimeElement },
};
const sanitized = policy.sanitizeCommentForPage(
  comment,
  "https://example.com/page",
);
equal(sanitized.anchor.elementMetadata, { component: "SubmitButton" });
equal(sanitized.additionalAnchors[0].elementName, "button");
equal(sanitized.designChange.anchor.elementName, "button");

for (const [left, right, same] of [
  [
    "https://example.com/path?x=1#one",
    "https://example.com/path?x=1#two",
    true,
  ],
  ["https://example.com/path?x=1", "https://example.com/path?x=2", false],
  ["https://example.com:443/path", "https://example.com/path", true],
  ["file:///tmp/file.txt#one", "file:///tmp/file.txt#two", true],
  ["mailto:test@example.com", "mailto:test@example.com", true],
  ["mailto:test@example.com", "mailto:other@example.com", false],
  ["not a url", "not a url", true],
  ["not a url", "other invalid", false],
]) {
  equal(policy.sameAnnotationUrl(left, right), same, `${left} <> ${right}`);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-annotation-anchor-policy.js")',
  ),
  true,
);
equal(
  main.includes("createBrowserAnnotationAnchorPolicy({ shared: n })"),
  true,
);
equal(main.includes("virtualTargetIdSchema: VC"), true);
for (const oldOwner of [
  "function ZG(",
  "function KWe(",
  "function $G(",
  "function eK(",
  "function tK(",
  "function nK(",
  "function rK(",
  "function iK(",
  "function aK(",
]) {
  equal(main.includes(oldOwner), false, oldOwner);
}

console.log(`browser annotation anchor policy assertions: ${assertions}`);
