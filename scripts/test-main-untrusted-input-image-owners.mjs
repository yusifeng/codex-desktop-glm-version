import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const bundle = await build({
  stdin: {
    contents: `
      export * as untrusted from "./src/main/main-app/conversations/untrusted-input.ts";
      export * as images from "./src/main/main-app/conversations/image-placeholders.ts";
      export * as sections from "./src/main/main-app/prompts/section-markers.ts";
    `,
    resolveDir: root,
    sourcefile: "untrusted-input-image-test-entry.ts",
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { untrusted, images, sections } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const throws = (operation, pattern) => {
  assert.throws(operation, pattern);
  assertions += 1;
};

const png = "data:image/png;base64,YQ==";
const sender = {
  accountUserId: "account-user",
  email: "user@example.com",
  name: "User",
  profilePictureUrl: null,
};
const encoded = untrusted.encodeUntrustedAppInput({
  callId: "call-1",
  prompt: "trusted prompt",
  sender,
  message: {
    source: "mcp_app",
    sourceId: "app-1",
    text: "visible app text",
    imageUrls: [png],
    structuredContent: { value: 1 },
  },
});
equal(encoded.input.text, untrusted.UNTRUSTED_APP_RESPONSE_PROMPT);
equal(encoded.input.text_elements[0].byteRange, {
  start: 0,
  end: Buffer.byteLength(untrusted.UNTRUSTED_APP_RESPONSE_PROMPT),
});
equal(encoded.responseItems.map(({ type }) => type), ["function_call", "function_call_output"]);
equal(encoded.responseItems[1].output.map(({ type }) => type), ["input_text", "input_image"]);
equal(untrusted.decodeUntrustedAppInput(encoded.input)?.message?.text, "visible app text");
equal(untrusted.decodeUntrustedAppInput({ ...encoded.input, text: "tampered" }), null);
equal(untrusted.decodeUntrustedAppInput({
  ...encoded.input,
  text_elements: [{ ...encoded.input.text_elements[0], byteRange: { start: 0, end: 1 } }],
}), null);

const attachmentOnly = untrusted.encodeUntrustedAppInput({
  callId: "call-2",
  prompt: "attachment prompt",
  modelContextAttachments: [{
    id: "attachment-1",
    imageAttachments: [{ src: png }],
    text: null,
    title: "Attachment",
  }],
});
equal(attachmentOnly.input.text, "attachment prompt");
equal(untrusted.decodeUntrustedAppInput(attachmentOnly.input)?.modelContextAttachments?.[0].untrusted, true);
throws(() => untrusted.parseUntrustedAppInput({ version: 1, message: {
  source: "mcp_app",
  sourceId: "app",
  text: "x",
  imageUrls: ["https://unsafe.example/image.png"],
} }), /Invalid untrusted app input field/);
throws(() => untrusted.parseUntrustedAppInput({ version: 1 }), /must contain/);

const elementComment = {
  position: { line: 7, path: "browser:https://example.com" },
  localBrowserCommentMetadata: { kind: "element" },
  localBrowserContext: {
    selectedText: "Primary",
    nearbyText: "Nearby",
    additionalSelections: [{ kind: "region" }],
  },
  localBrowserScreenshot: { dataUrl: png },
};
equal(untrusted.browserCommentTargetCandidates(elementComment), [
  "Primary",
  "https://example.com",
]);
equal(untrusted.browserCommentNearbyText(elementComment), "Nearby");
equal(
  untrusted.browserScreenshotText(elementComment, 7),
  `${untrusted.browserScreenshotLead(7)} This comment includes 2 selected items, with "Primary" as the primary target. Each selected element or area visible in the image is outlined in a color matching its selection chip and marked by comment marker 7.`,
);
equal(untrusted.pdfScreenshotText({ commentNumber: 4, kind: "point", pageNumber: 3 }),
  "The next image shows PDF page 3 at the time of Comment 4. The selected point is marked in blue by comment marker 4.");
equal(untrusted.attachedBrowserImageText(9),
  "The next image was attached by the user as additional visual context for Comment 9.");

const normalizedAppInput = images.normalizeUserInput({ input: [encoded.input] });
equal(normalizedAppInput.rawText, untrusted.UNTRUSTED_APP_RESPONSE_PROMPT);
equal(normalizedAppInput.displayRawText, "visible app text");
equal(normalizedAppInput.imageCount, 1);
equal(normalizedAppInput.appInput.message.sourceId, "app-1");
equal(normalizedAppInput.appInputPlaceholder.startsWith(untrusted.UNTRUSTED_APP_INPUT_PREFIX), true);

const evidenceText = untrusted.browserScreenshotText(elementComment, 7);
const normalizedEvidence = images.normalizeUserInput({
  input: [
    { type: "text", text: "actual user request" },
    { type: "text", text: evidenceText },
    { type: "text", text: "<image>" },
    { type: "image", url: png },
    { type: "text", text: "</image>" },
  ],
  commentAttachments: [elementComment],
});
equal(normalizedEvidence.rawText, "actual user request");
equal(normalizedEvidence.displayRawText, "actual user request");
equal(normalizedEvidence.imageCount, 1);

equal(images.stripImageDisplayPlaceholderLines("hello\n<<ImageDisplayed>>\n"), "hello");
equal(images.stripImageDisplayPlaceholderLines("hello\n<<ImageDisplayed>> <<ImageDisplayed>>", {
  allowAdjacentPlaceholders: true,
}), "hello");
equal(images.stripGeneratedEvidenceText(`before ${untrusted.attachedBrowserImageText(2)} after`),
  "before  after");

const prompt = `\n${sections.RESPONSE_ANNOTATIONS_SECTION}\nignored\n${sections.RESPONSE_ANNOTATIONS_OPEN}\n{"a":1}\n${sections.RESPONSE_ANNOTATIONS_CLOSE}\ncontext\n${sections.MY_REQUEST_SECTION}\nrequest`;
equal(sections.parseResponseAnnotations(prompt), {
  endIndex: prompt.indexOf(`\n${sections.RESPONSE_ANNOTATIONS_CLOSE}\n`) +
    `\n${sections.RESPONSE_ANNOTATIONS_CLOSE}\n`.length,
  json: '{"a":1}',
});
equal(sections.extractPromptPreamble(prompt), "context\n");
equal(sections.takeLastRequestSection(`old\n${sections.MY_REQUEST_SECTION}\nnew`), "new");
equal(sections.replaceLastRequestSection(`old\n${sections.MY_REQUEST_SECTION}\nrequest`, "edited"),
  `old\n${sections.MY_REQUEST_SECTION}\nedited\n`);
equal(sections.parseAttachedImagesCount(sections.attachedImagesMessage("3", 4), "3"), 4);

equal(untrusted.extractNotificationThreadId({ threadId: "thread-a" }), "thread-a");
equal(untrusted.extractNotificationThreadId({ thread: { id: "thread-b" } }), "thread-b");
equal(untrusted.extractNotificationThreadId({ thread: { id: "" } }), null);

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
for (const modulePath of [
  "prompts/section-markers.js",
  "conversations/untrusted-input.js",
  "conversations/image-placeholders.js",
  "turns/steering-merge.js",
]) equal(main.includes(`require("./main-app/${modulePath}")`), true);
for (const oldDefinition of [
  "var Up = `# Files mentioned by the user:`",
  "var Nh = `codex-untrusted-app-input:`",
  "function Xhe(",
  "function Zhe(",
  "function ige(",
  "function ug(",
  "function dg(",
  "function fg(",
]) equal(main.includes(oldDefinition), false);

console.log(`${assertions} main untrusted input/image owner assertions passed`);
