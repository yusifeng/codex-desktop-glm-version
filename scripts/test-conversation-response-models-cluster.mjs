import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__responseModelsTest = { jsx };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "response-model-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__responseModelsTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
const children = node => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];

// workbook-from-csv: 18
const workbook = await bundle("workbook-from-csv");
assert.deepEqual(Object.keys(workbook), ["n", "r", "t"]);
assert.equal(workbook.t(), undefined);
assert.equal(workbook.r("  Budget/2026:*  "), "Budget2026");
assert.equal(workbook.r(""), "CSV import");
assert.equal(workbook.r("abcdefghijklmnopqrstuvwxyz123456789"), "abcdefghijklmnopqrstuvwxyz12345");
assert.deepEqual(workbook.n(""), { sheetName: "CSV import", values: [] });
const csv = workbook.n('name,value\n"hello, world",42\nlast', { anchor: "B2", sheetName: "Data" });
assert.equal(csv.sheetName, "Data");
assert.equal(csv.rangeRef, "B2:C4");
assert.deepEqual(csv.rect, { r1: 1, c1: 1, r2: 3, c2: 2 });
assert.deepEqual(csv.values[0], ["name", "value"]);
assert.deepEqual(csv.values[1], ["hello, world", "42"]);
assert.deepEqual(csv.values[2], ["last", ""]);
assert.equal(workbook.n('"say ""hi"""').values[0][0], 'say "hi"');
assert.deepEqual(workbook.n("a;b\r\nc;d", { separator: ";", anchor: "'Sheet One'!AA10" }).rect, { r1: 9, c1: 26, r2: 10, c2: 27 });
assert.equal(workbook.n("a", { anchor: "'Sheet One'!A1" }).sheetName, "Sheet One");
assert.throws(() => workbook.n("a", { separator: "::" }), /single character/);
assert.throws(() => workbook.n("a", { anchor: "A1:B2" }), /A1 cell reference/);
assert.throws(() => workbook.n("a", { anchor: "One!A1", sheetName: "Two" }), /conflicting sheet names/);

// respond: 7
const respond = await bundle("respond");
assert.deepEqual(Object.keys(respond), ["n", "t"]);
assert.equal(respond.t(), undefined);
let submitted;
await respond.n({ submit(input) { submitted = input; } }, { action: { type: "allow", target_message_id: "m1", scope: "once" }, conversationId: "c1", elicitationResponse: { answer: "yes" }, isApiToolElicitation: true, isTemporaryChat: false, model: "gpt", recipient: "tool" });
assert.equal(submitted.conversationId, "c1");
assert.equal(submitted.prompt, "");
assert.equal(submitted.toolApproval.action, "allow");
assert.equal(submitted.toolApproval.targetMessageId, "m1");
assert.deepEqual(submitted.toolApproval.elicitationResponse, { answer: "yes" });

// turn-bibliography: 8
const bibliography = await bundle("turn-bibliography");
assert.deepEqual(Object.keys(bibliography), ["n", "t"]);
assert.equal(bibliography.n(), undefined);
const sources = bibliography.t({ references: [{ id: "s1", title: "Docs", url: "https://example.com" }, { title: "Book" }] });
assert.equal(sources.type, "ol");
assert.equal(sources.props["data-external-egress"], "allow");
assert.equal(children(sources)[0].props.children.type, "a");
assert.equal(children(sources)[0].props.children.props.href, "https://example.com");
const restricted = bibliography.t({ references: [{ title: "Docs", url: "https://example.com" }], shouldBlockExternalEgress: true });
assert.equal(restricted.props["data-external-egress"], "restricted");
assert.equal(children(restricted)[0].props.children, "Docs");

// summary: 8
const summary = await bundle("summary");
assert.deepEqual(Object.keys(summary), ["n", "t"]);
assert.equal(summary.n(), undefined);
assert.equal(children(summary.t({ title: "Plan" }))[0].props.children, "Created Plan");
assert.equal(children(summary.t({}))[0].props.children, "Created Document");
assert.equal(children(summary.t({ result: { summary: "Reworded intro" } }))[0].props.children, "Reworded intro");
assert.equal(children(summary.t({ result: {} }))[0].props.children, "Edited");
let viewed = 0; const withView = summary.t({ onView() { viewed++; }, result: {} });
children(withView)[1].props.children[1].props.onClick();
assert.equal(viewed, 1);
assert.equal(children(withView)[1].props.children[0].props["aria-hidden"], true);

// payload: 10
const payload = await bundle("payload");
assert.deepEqual(Object.keys(payload), ["n", "t"]);
assert.equal(payload.t(), undefined);
assert.equal(payload.n(null), null);
assert.equal(payload.n([]), null);
assert.equal(payload.n({}), null);
assert.equal(payload.n({ code: 1 }), null);
const validPayload = { code: "return 1", constants: { one: 1 }, appData: { ready: true }, clientDefinedWidgets: {}, programFailure: { status: "failed", code: "payload_too_large", retryable: false } };
assert.deepEqual(payload.n(validPayload), validPayload);
assert.equal(payload.n({ code: "x", constants: [] }), null);
assert.equal(payload.n({ code: "x", programFailure: { status: "failed", code: "other", retryable: false } }), null);
assert.equal(payload.n({ code: "x", programFailure: { status: "failed", code: "payload_too_large", retryable: "no" } }), null);

// image-validation-session: 14
const validation = await bundle("image-validation-session");
assert.deepEqual(Object.keys(validation), ["a", "i", "n", "r", "t"]);
assert.equal(validation.a(), undefined);
assert.equal(validation.n(), undefined);
assert.equal(validation.t.key, "image-validation-session");
assert.equal(validation.t.initialValue, null);
const session = { attachments: [{ kind: "media_generation", generation_type: "image_gen", id: "img1", generation_id: "g1", message_id: "m1", asset_pointer: "sediment://image", url: "/validated.png", width: 640, height: 480 }, { kind: "media_generation", generation_type: "image_gen", id: "blocked", output_blocked: true, url: "/blocked.png" }, { kind: "file", generation_type: "image_gen", id: "file", url: "/file.png" }] };
const generated = validation.i(session);
assert.equal(generated.length, 1);
assert.equal(generated[0].id, "img1");
assert.equal(generated[0].chatGptGenerationId, "g1");
assert.equal(generated[0].chatGptMessageId, "m1");
assert.equal(generated[0].src, "sediment://image");
assert.equal(generated[0].status, "completed");
const resolved = validation.r(session, generated);
assert.equal(resolved[0].src, "https://desktop.invalid/validated.png");
assert.equal(resolved[0].previewSrc, "https://desktop.invalid/validated.png");
assert.deepEqual(validation.r(session, [{ ...generated[0], id: "missing", src: "other" }]), []);

console.log("65 conversation response model cluster assertions passed");
