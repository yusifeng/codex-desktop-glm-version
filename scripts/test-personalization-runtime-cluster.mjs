import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__personalizationTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "personalization-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__personalizationTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }

// avatar-mascot-button: 15
const avatar = await bundle("avatar-mascot-button");
assert.deepEqual(Object.keys(avatar), ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
assert.equal(avatar.p(5), "blur(max(0px, 5px))");
assert.equal(avatar.f.duration, 0.22);
assert.equal(avatar.l.type, "spring");
assert.equal(avatar.c.type, "spring");
assert.equal(avatar.i.Material, "_Material_c58wm_2");
assert.equal(avatar.o.nativeTint, "_nativeTint_v9pb8_6");
assert.equal(avatar.n({ notificationBadge: 3 }).props.role, "status");
const avatarUi = avatar.t({ ariaLabel: "Codex pet", notificationBadge: 2, source: "cat", state: "idle", transientState: "waving" });
assert.equal(avatarUi.props["data-state"], "waving");
assert.equal(avatarUi.props["data-source"], "cat");
assert.equal(avatarUi.props.role, "group");
assert.equal(find(avatarUi, node => node.props?.["aria-label"] === "2 notifications").props.children, 2);
assert.equal(avatar.t({}).props["aria-hidden"], true);
assert.equal(avatar.r(), undefined);
assert.equal(avatar.m(), undefined);

// voice-configuration-manager: 18
const voice = await bundle("voice-configuration-manager");
assert.deepEqual(Object.keys(voice), ["a", "i", "n", "o", "r", "t"]);
assert.equal(voice.o("wm"), true);
assert.equal(voice.o("wingman"), false);
assert.equal(voice.i.wingmanModelName({}), "GPT Live 1");
assert.equal(voice.i.wingmanModelName({ policy: { wingman_model_name: "Live 2" } }), "Live 2");
assert.equal(voice.i.wingmanDisplayName({ policy: { wingman_model_picker_default_display_name: "Realtime" } }), "Realtime");
assert.equal(voice.i.wingmanDisplayName({ policy: { wingman_model_picker_alternative_options: [{ slug: "fast", display_name: "Fast" }] } }, "fast"), "Fast");
assert.equal(voice.i.policyVersion({ policy: { rollout_version: 4 } }), 4);
assert.equal(voice.i.policyVersion({ policy: { rollout_version: -1 } }), undefined);
assert.equal(voice.i.shouldShowWingmanComingSoon({ policy: { rollout_policy: "unavailable", unavailable_upsell_policy: "coming_soon" } }, "vp"), true);
assert.equal(voice.i.policyResolvedVoice({ authenticated: false, policy: { rollout_policy: "available_default" } }), "wingman");
assert.equal(voice.i.policyResolvedVoice({ authenticated: true, selectedVoiceMode: "wingman", policy: { rollout_policy: "unavailable" } }), "advanced");
assert.deepEqual(voice.i.getBaseVoiceOptions({ policy: { rollout_policy: "available_opt_in" } }).map(option => option.voiceModel), ["wingman", "advanced", "standard"]);
assert.equal(voice.i.speakingListeningTrigger("voice"), "server");
assert.equal(voice.t("/g/g-p-project%201"), "g-p-project 1");
assert.equal(voice.t("/c/conversation-1"), "conversation-1");
assert.equal(voice.r({ authenticated: false, policy: { rollout_policy: "available_default" } }), true);
assert.equal(voice.n(), undefined);

console.log("33 personalization runtime cluster assertions passed");
