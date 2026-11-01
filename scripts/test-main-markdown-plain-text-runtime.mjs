import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const moduleUrl = new URL("../src/main/main-app/markdown/plain-text.ts", import.meta.url);
const source = fs.readFileSync(moduleUrl, "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "node22" });
const runtimeModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

assertions += 1;
assert.throws(
  () => runtimeModule.plainTextFromMarkdown("before configuration"),
  /has not been configured/,
);

const parseCalls = [];
const htmlCalls = [];
let removedHtmlElements = 0;
let gfmCreates = 0;
const autolinkConstruct = {
  name: "wwwAutolink",
  previous(code) {
    return code !== 0;
  },
};
const dependencies = {
  loadHtmlDomParserModule: () => ({
    parse(html) {
      htmlCalls.push(html);
      return {
        querySelectorAll: () => [
          { remove: () => { removedHtmlElements += 1; } },
        ],
        structuredText: "DOM text",
      };
    },
  }),
  fromMarkdown(value, options) {
    parseCalls.push([value, options]);
    if (value === "<html-node>") return { type: "html", value: "<b>DOM text</b>" };
    if (value === "<!-- comments -->") return { type: "html", value: "<!-- one --><!-- two -->" };
    if (value === "<script-fragments>") {
      return {
        type: "root",
        children: [
          { type: "text", value: "before" },
          { type: "html", value: "<script>" },
          { type: "text", value: "hidden" },
          { type: "html", value: "</script>" },
          { type: "text", value: "after" },
        ],
      };
    }
    return {
      type: "root",
      children: [
        { type: "paragraph", children: [{ type: "text", value: value.replaceAll("*", "") }] },
        { type: "paragraph", children: [{ type: "image", alt: "image alt" }] },
      ],
    };
  },
  mdastNodeToString: (node) => node.value ?? node.alt ?? "",
  createGfmMdastExtension: () => ({ kind: "gfm-mdast" }),
  createDirectiveMdastExtension: () => ({ kind: "directive-mdast" }),
  createDirectiveMicromarkExtension: () => ({ kind: "directive-micromark" }),
  createGfmMicromarkExtension: () => {
    gfmCreates += 1;
    return { text: { 65: autolinkConstruct, 66: { name: "other" } } };
  },
};

const directRuntime = runtimeModule.createMarkdownPlainTextRuntime(dependencies);
equal(gfmCreates, 1, "GFM patch is built once per runtime");
equal(directRuntime.plainTextFromMarkdown("  Plain   prose  "), "Plain prose");
equal(parseCalls.length, 0, "plain prose uses the fast path");
equal(directRuntime.plainTextFromMarkdown("**Bold**"), "Bold image alt");
equal(parseCalls.length, 1);
equal(parseCalls[0][1].extensions[1], { kind: "directive-micromark" });
equal(parseCalls[0][1].mdastExtensions, [
  { kind: "gfm-mdast" },
  { kind: "directive-mdast" },
]);

const patchedAutolink = parseCalls[0][1].extensions[0].text[65][0];
equal(patchedAutolink.previous.call({ events: [] }, 0), false, "original previous gate wins");
const unbalancedToken = { type: "labelLink", _balanced: false };
const autolinkContext = { events: [["enter", unbalancedToken]] };
equal(patchedAutolink.previous.call(autolinkContext, 1), false, "unbalanced label blocks autolink");
equal(patchedAutolink.previous.call(autolinkContext, 1), false, "remembered label remains blocked");
equal(
  patchedAutolink.previous.call(
    { events: [["enter", { type: "data", _gfmAutolinkLiteralWalkedInto: true }]] },
    1,
  ),
  true,
);
equal(parseCalls[0][1].extensions[0].text[66][0].name, "other");

equal(directRuntime.plainTextFromMarkdown("<html-node>"), "DOM text");
equal(htmlCalls, ["<b>DOM text</b>"]);
equal(removedHtmlElements, 2, "script and style selector results are removed");
equal(directRuntime.plainTextFromMarkdown("<!-- comments -->"), "");
equal(htmlCalls.length, 1, "comment-only HTML does not invoke DOM parser");
equal(directRuntime.plainTextFromMarkdown("<script-fragments>"), "before after");

directRuntime.plainTextFromMarkdown("\uE200private\uE201::notice[x]\n```\n::inside[x]\n```");
equal(
  parseCalls.at(-1)[0],
  ":notice[x]\n```\n::inside[x]\n```",
  "private placeholders are stripped and directives inside fences are preserved",
);
equal(directRuntime.plainTextFromMarkdown(""), "");

const configured = runtimeModule.configureMarkdownPlainTextRuntime(dependencies);
equal(runtimeModule.configureMarkdownPlainTextRuntime({}), configured, "configuration is idempotent");
equal(runtimeModule.plainTextFromMarkdown("Shared   owner"), "Shared owner");

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/markdown/plain-text.js")'), true);
equal(main.includes("configureMarkdownPlainTextRuntime({"), true);
equal(main.includes("sanitizeText: Vp"), true);
for (const oldName of ["Hme", "Ume", "Vp", "Yme", "Xme", "Zme", "Hp", "Qme"]) {
  const retainedAlias = oldName === "Vp" && main.includes("plainTextFromMarkdown: Vp");
  equal(
    new RegExp(`^function ${oldName}\\(`, "m").test(main),
    false,
    `old markdown function ${oldName} is removed${retainedAlias ? " while its consumer alias remains" : ""}`,
  );
}
equal(source.includes('from "../vendor/mdast"'), false);
equal(source.includes('from "@chunk/css-selector"'), false);
equal(
  fs.existsSync(new URL("../src/main/main-app/vendor/mdast.ts", import.meta.url)),
  false,
  "unshippable npm adapter is removed",
);

console.log(`${assertions} main markdown plain-text runtime assertions passed`);
