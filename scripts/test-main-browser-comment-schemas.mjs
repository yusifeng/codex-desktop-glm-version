import assert from "node:assert/strict";
import fs from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { transform } from "esbuild";
import { z } from "zod";

const source = fs.readFileSync(
  new URL(
    "../src/main/main-app/browser-sidebar/browser-comment-schemas.ts",
    import.meta.url,
  ),
  "utf8",
);
const output = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "node22",
});
const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const parses = (schema, value, expected = true) => {
  const result = schema.safeParse(value);
  equal(result.success, expected);
  return result;
};

z.ZodObject.prototype.loose = z.ZodObject.prototype.passthrough;
const schemaDsl = {
  Of: z.string,
  Cf: z.number,
  gf: z.boolean,
  pf: z.null,
  Mf: z.unknown,
  hf: z.array,
  wf: z.object,
  vf: (_key, schemas) => z.union(schemas),
  jf: z.union,
  df: z.enum,
  bf: z.literal,
  Af: (items) => z.tuple(items),
  Pf: () => z.string().uuid(),
  Pu: (value) => value,
  Fu: (value) => value,
  Cu: isDeepStrictEqual,
  vu: 500,
  yu: 12,
  wu: z.any(),
};
const controlSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("color"),
    callback: z.string(),
    label: z.string(),
  }),
  z.object({
    type: z.literal("select"),
    callback: z.string(),
    label: z.string(),
    options: z.array(z.object({ value: z.string() })),
  }),
  z.object({
    type: z.literal("range"),
    callback: z.string(),
    label: z.string(),
    min: z.number(),
    max: z.number(),
  }),
  z.object({
    type: z.literal("toggle"),
    callback: z.string(),
    label: z.string(),
  }),
]);
const annotationControlsSchema = z.object({
  controls: z.array(controlSchema).max(12),
});
const annotationControlChangeSchema = z.object({
  callback: z.string(),
  previousValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
const schemas = runtime.createBrowserCommentSchemas({
  annotationControlChangeSchema,
  annotationControlsSchema,
  schema: schemaDsl,
  virtualRoleSchema: z.enum(["button", "image"]),
  virtualTargetIdSchema: z.string().min(1),
});

equal(runtime.BROWSER_COMMENT_SCREENSHOT_READY_TIMEOUT_MS, 1_000);
equal(
  runtime.BROWSER_DESIGN_GROUP_ATTRIBUTE,
  "data-codex-browser-design-group",
);

const rect = { x: 10, y: 20, width: 30, height: 40 };
const elementAnchor = {
  kind: "element",
  pageUrl: "https://example.com",
  frameUrl: null,
  title: "Example",
  elementPath: "body > button",
  point: { xPercent: 50, y: 40 },
  rect,
  isFixed: false,
  framePath: [],
  role: "button",
  name: "Submit",
  selector: "button",
  nearbyText: "Submit",
};
const virtualAnchor = {
  kind: "virtual",
  pageUrl: "https://example.com",
  frameUrl: null,
  title: "Canvas",
  elementPath: "canvas",
  point: { xPercent: 50, y: 10 },
  rect: { x: 1, y: 2, width: 10, height: 20 },
  isFixed: true,
  framePath: [],
  surfaceId: "surface",
  targetId: "target",
  role: "button",
  name: null,
  selector: null,
  nearbyText: null,
};
const anchorState = {
  anchor: elementAnchor,
  viewportRect: null,
  viewportPoint: { x: 1, y: 2 },
};
const designChange = {
  id: "change",
  anchor: elementAnchor,
  declarations: [],
  draftAttribute: "draft",
  provenance: [],
  selector: null,
  targetLabel: "Submit",
};
equal(parses(schemas.designChangeSchema, designChange).data, designChange);
parses(schemas.designChangeSchema, { ...designChange, anchor: { ...elementAnchor, kind: "unknown" } }, false);

const validVirtualChange = {
  ...designChange,
  anchor: virtualAnchor,
  annotationControls: {
    controls: [{ type: "toggle", callback: "visible", label: "Visible" }],
  },
  annotationControlChanges: [
    { callback: "visible", previousValue: false, value: true },
  ],
};
parses(schemas.designChangeSchema, validVirtualChange);
parses(
  schemas.designChangeSchema,
  { ...validVirtualChange, declarations: [{ property: "color", value: "red", previousValue: "blue" }] },
  false,
);
parses(
  schemas.designChangeSchema,
  {
    ...validVirtualChange,
    annotationControlChanges: [
      { callback: "visible", previousValue: false, value: "yes" },
    ],
  },
  false,
);
parses(
  schemas.designChangeSchema,
  {
    ...validVirtualChange,
    annotationControlChanges: [
      { callback: "visible", value: true },
      { callback: "visible", value: false },
    ],
  },
  false,
);

parses(schemas.runtimeMessageSchema, {
  type: "browser-sidebar-runtime-exit-comment-mode",
});
parses(schemas.runtimeMessageSchema, { type: "unknown" }, false);
parses(schemas.runtimeMessageSchema, {
  type: "browser-sidebar-runtime-request-annotation-permission",
  requestId: "00000000-0000-4000-8000-000000000001",
});
parses(
  schemas.runtimeMessageSchema,
  {
    type: "browser-sidebar-runtime-open-editor",
    target: { mode: "create" },
    anchorState: { ...anchorState, anchor: virtualAnchor },
  },
  true,
);
parses(
  schemas.runtimeMessageSchema,
  {
    type: "browser-sidebar-runtime-open-editor",
    target: { mode: "design", groupId: "group" },
    anchorState: { ...anchorState, anchor: virtualAnchor },
  },
  false,
);
parses(
  schemas.runtimeMessageSchema,
  {
    type: "browser-sidebar-runtime-open-design-editor",
    anchorState,
    designEditorState: validVirtualChange,
  },
  false,
);
parses(schemas.runtimeMessageSchema, {
  type: "browser-sidebar-runtime-open-comment-preview",
  commentId: "comment",
  anchorState,
});

equal(
  schemas.documentRootSchema.parse({ root: { nodeId: 7 }, extra: true }),
  { root: { nodeId: 7 } },
);
equal(schemas.nodeIdSchema.parse({ nodeId: 9 }), { nodeId: 9 });
equal(
  schemas.matchedStylesSchema.parse({
    inlineStyle: {
      cssProperties: [
        { name: "color", value: "red", source: "ignored" },
      ],
    },
    matchedCSSRules: [
      {
        rule: {
          selectorList: { text: ".button" },
          style: { cssProperties: [{ name: "color", value: "blue" }] },
          unknown: true,
        },
      },
    ],
  }).matchedCSSRules[0].rule.unknown,
  true,
);

equal(
  runtime.projectBrowserCaptureRect(
    { width: 200, height: 100 },
    { x: 10, y: 10, width: 20, height: 20 },
    { width: 100, height: 50 },
    2,
  ),
  { x: 16, y: 16, width: 48, height: 48 },
);
equal(
  runtime.projectBrowserCaptureRect(
    { width: 0, height: 100 },
    rect,
    { width: 100, height: 50 },
    2,
  ),
  null,
);
equal(
  runtime.projectBrowserCaptureRect(
    { width: 100, height: 100 },
    { x: 200, y: 200, width: 10, height: 10 },
    { width: 100, height: 100 },
    0,
  ),
  null,
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const turnContext = fs.readFileSync(
  new URL("../src/main/main-app/conversation/turn-context.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-comment-schemas.js")',
  ),
  true,
);
equal(main.includes("createBrowserCommentSchemas({"), true);
equal(
  main.includes(
    "browserCommentSchemas.runtimeMessageSchema.safeParse(payload)",
  ),
  true,
);
equal(main.includes("projectCaptureRect: projectBrowserCaptureRect"), true);
equal(turnContext.includes("export const annotationControlChangeSchema"), true);
equal(turnContext.includes("export const annotationControlsSchema"), true);
for (const oldOwner of [
  "var CK =",
  "function NK(",
  "sGe = 1e3",
  "uGe = n.wf(",
  "mGe = n",
  "$Se.optional()",
  "n.hf(QSe)",
])
  equal(main.includes(oldOwner), false, `${oldOwner} must be removed`);

console.log(`${assertions} main browser comment schema assertions passed`);
