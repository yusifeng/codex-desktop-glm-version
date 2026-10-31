import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/browser-sidebar/browser-comment-policy.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserCommentPolicy } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

class FakeImage {
  constructor(width, height, label = "image") {
    this.width = width;
    this.height = height;
    this.label = label;
    this.operations = [];
  }
  getSize() {
    return { width: this.width, height: this.height };
  }
  resize(size) {
    const image = new FakeImage(
      size.width,
      size.height,
      `${this.label}:resized`,
    );
    image.operations = [...this.operations, ["resize", size]];
    return image;
  }
  crop(rect) {
    const image = new FakeImage(
      rect.width,
      rect.height,
      `${this.label}:cropped`,
    );
    image.operations = [...this.operations, ["crop", rect]];
    return image;
  }
  toDataURL() {
    return `data:${this.label}:${this.width}x${this.height}`;
  }
}

const images = new Map();
const sent = [];
const policy = createBrowserCommentPolicy({
  anchorsEqual: (left, right) => left.id === right.id,
  browserRuntimeMessageChannel: "browser-runtime",
  isDesignChange: (value) => value.valid === true,
  markerSize: 20,
  nativeImage: {
    createFromDataURL(value) {
      return images.get(value);
    },
  },
  now: () => new Date("2026-11-01T01:02:03.000Z"),
  projectCaptureRect: (_imageSize, rect, _viewportSize, padding) => ({
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }),
});

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const small = new FakeImage(320, 160, "small");
equal(policy.resizeImageToFit(small, 500), small);
equal(policy.resizeImageToFit(new FakeImage(2000, 1000), 1000).getSize(), {
  width: 1000,
  height: 500,
});
equal(policy.unionScreenshotRegion(null, { x: 30, y: 40 }), {
  x: 20,
  y: 30,
  width: 20,
  height: 20,
});
equal(
  policy.unionScreenshotRegion(
    { x: 10, y: 10, width: 20, height: 20 },
    { x: 40, y: 40 },
  ),
  { x: 10, y: 10, width: 40, height: 40 },
);

const cropped = policy.cropAnnotationScreenshot(new FakeImage(2000, 1000), {
  annotation: { viewportSize: { width: 1000, height: 500 } },
  screenshotCropRect: { x: 100, y: 100, width: 200, height: 100 },
  shouldUseCompactScreenshot: false,
});
equal(cropped.getSize(), { width: 264, height: 164 });
equal(cropped.operations[0], [
  "crop",
  { x: 68, y: 68, width: 264, height: 164 },
]);

equal(
  policy.createScreenshotRecord(
    new FakeImage(50, 40, "record"),
    true,
    { x: 1, y: 2, width: 3, height: 4 },
    { x: 5, y: 6, width: 7, height: 8 },
    { x: 9, y: 10 },
  ),
  {
    annotationViewportRect: { x: 5, y: 6, width: 7, height: 8 },
    cropPaddingPx: 16,
    cropViewportRect: { x: 1, y: 2, width: 3, height: 4 },
    dataUrl: "data:record:50x40",
    isCompact: true,
    markerViewportPoint: { x: 9, y: 10 },
    width: 50,
    height: 40,
  },
);

const untouched = [{ id: "no-shot", anchor: { kind: "element" } }];
equal(policy.compactCommentScreenshots(untouched), untouched);
const virtualImage = new FakeImage(1600, 800, "virtual");
images.set("virtual-shot", virtualImage);
const compactedVirtual = policy.compactCommentScreenshots([
  {
    id: "virtual",
    anchor: { kind: "virtual" },
    screenshot: { dataUrl: "virtual-shot", width: 1600, height: 800 },
  },
]);
equal(compactedVirtual[0].screenshot, {
  dataUrl: "data:virtual:resized:768x384",
  width: 768,
  height: 384,
  isCompact: true,
});

const anchorState = {
  anchor: {
    kind: "element",
    id: "primary",
    rect: { x: 1, y: 2, width: 3, height: 4 },
  },
  additionalAnchors: [{ kind: "element", id: "secondary" }],
  viewportPoint: { x: 8, y: 9 },
  viewportSize: { width: 100, height: 80 },
  themeVariant: "dark",
};
const saved = policy.createSavedComment({
  anchorState,
  body: "hello",
  pageInitialComment: false,
  commentId: "comment-1",
  attachedImages: [],
});
equal(saved.createdAt, "2026-11-01T01:02:03.000Z");
equal(saved.body, "hello");
equal(saved.additionalAnchors, anchorState.additionalAnchors);
equal(saved.markerViewportPoint, { x: 8, y: 9 });
equal(policy.anchorStateFromComment(saved, { viewportPoint: { x: 0, y: 0 } }), {
  anchor: saved.anchor,
  viewportRect: saved.anchor.rect,
  viewportPoint: { x: 8, y: 9 },
  viewportSize: { width: 100, height: 80 },
  themeVariant: "dark",
});
equal(policy.removeAnchorSelection(anchorState, 0).anchor.id, "secondary");
equal(
  policy.removeAnchorSelection(anchorState, 1).additionalAnchors,
  undefined,
);
equal(policy.removeAnchorSelection({ anchor: { kind: "text" } }, 0), null);
equal(policy.keepPrimaryAnchorOnly(anchorState).additionalAnchors, undefined);

equal(policy.textInputFromKeyEvent({ type: "keyDown", key: "a" }), "a");
equal(
  policy.textInputFromKeyEvent({ type: "keyDown", key: "a", control: true }),
  null,
);
equal(policy.textInputFromKeyEvent({ type: "keyUp", key: "a" }), null);
equal(
  policy.keyboardEventFromInput({
    type: "keyDown",
    key: "ArrowDown",
    shift: true,
    isAutoRepeat: true,
  }),
  { type: "keyDown", keyCode: "Down", modifiers: ["shift", "isautorepeat"] },
);
equal(policy.keyboardEventFromInput({ type: "keyUp", key: "a" }), null);
equal(policy.keyboardEventFromInput({ type: "keyUp", key: "Shift" }), {
  type: "keyUp",
  keyCode: "Shift",
  modifiers: [],
});

equal(policy.queueDesignChange({ id: "design" }, "note"), {
  id: "design",
  comment: "note",
  status: "queued",
  updatedAt: "2026-11-01T01:02:03.000Z",
});
equal(
  policy.upsertComment([{ id: "one", value: 1 }], { id: "one", value: 2 }),
  [{ id: "one", value: 2 }],
);
equal(policy.upsertComment([{ id: "one" }], { id: "two" }), [
  { id: "one" },
  { id: "two" },
]);
equal(policy.removeDesignChange({ id: "one", designChange: {} }), {
  id: "one",
});
equal(policy.removeCommentBody({ id: "one", body: "text" }), { id: "one" });

const declarations = [
  { property: "color", previousValue: "red", value: "blue" },
  { property: "padding-top", previousValue: "0", value: "4px" },
];
const weak = { property: "color" };
const rich = {
  property: "color",
  selectorText: ".button",
  sourceUrl: "app.css",
};
equal(policy.mergeProvenance(declarations, [weak], [rich]), [rich]);
equal(policy.provenanceComplete(declarations, [rich]), false);
equal(policy.provenanceEquals([rich], [{ ...rich }]), true);
equal(policy.provenanceEquals([rich], [weak]), false);

const design = {
  id: "design",
  createdAt: "now",
  status: "draft",
  anchor: { id: "anchor" },
  declarations,
};
equal(policy.sameDesignChangeIdentity(design, { ...design }), true);
equal(
  policy.sameDesignChangeIdentity(design, { ...design, status: "queued" }),
  false,
);
equal(
  policy.enrichDesignChangeProvenance(design, {
    inlineStyle: {
      cssProperties: [
        { name: "padding", range: { startLine: 2, startColumn: 4 } },
      ],
    },
    matchedCSSRules: [
      {
        rule: {
          selectorList: { text: ".button" },
          media: [{ sourceURL: "app.css" }],
          style: { cssProperties: [{ name: "color" }] },
        },
      },
    ],
  }).provenance,
  [
    { property: "color", selectorText: ".button", sourceUrl: "app.css" },
    {
      property: "padding-top",
      selectorText: "element.style",
      sourceLine: 3,
      sourceColumn: 5,
    },
  ],
);
equal(policy.escapeAttributeSelector('a\\b"c'), 'a\\\\b\\"c');
equal(
  policy.isVirtualDesignChangeForAnchor(
    { valid: true, anchor: { kind: "virtual", id: "v" } },
    { kind: "virtual", id: "v" },
  ),
  true,
);

const page = {
  view: {
    webContents: {
      isDestroyed: () => false,
      send: (...args) => sent.push(args),
    },
  },
};
policy.sendPendingCommentModeRequestToRuntime(page, {
  kind: "comment",
  viewportPoint: { x: 1, y: 2 },
});
policy.sendPendingCommentModeRequestToRuntime(page, {
  kind: "design",
  viewportPoint: { x: 3, y: 4 },
});
policy.sendPendingCommentModeRequestToRuntime(page, {
  kind: "text",
  fallbackViewportPoint: { x: 5, y: 6 },
});
equal(sent, [
  [
    "browser-runtime",
    {
      type: "browser-sidebar-runtime-create-comment-at-point",
      viewportPoint: { x: 1, y: 2 },
    },
  ],
  [
    "browser-runtime",
    {
      type: "browser-sidebar-runtime-open-design-editor-at-point",
      viewportPoint: { x: 3, y: 4 },
    },
  ],
  [
    "browser-runtime",
    {
      type: "browser-sidebar-runtime-create-comment-from-selection",
      fallbackViewportPoint: { x: 5, y: 6 },
    },
  ],
]);
equal(policy.screenshotMaxDimension, 1280);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-comment-policy.js")',
  ),
  true,
);
equal(main.includes("createBrowserCommentPolicy({"), true);
for (const oldFunction of [
  "function gGe(",
  "function HK(",
  "function UK(",
  "function WK(",
  "function GK(",
  "function KK(",
  "function JK(",
  "function kGe(",
  "function tq(",
  "function PGe(",
]) {
  equal(main.includes(oldFunction), false, `${oldFunction} must be removed`);
}

console.log(
  `main browser comment policy tests passed (${assertions} assertions)`,
);
