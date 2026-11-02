import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = { effects: [], hooks: [], index: 0 };
const ReactRuntime = {
  useState(initialValue) { const index = hookState.index++; if (!(index in hookState.hooks)) hookState.hooks[index] = typeof initialValue === "function" ? initialValue() : initialValue; return [hookState.hooks[index], value => { hookState.hooks[index] = typeof value === "function" ? value(hookState.hooks[index]) : value; }]; },
  useEffect(callback, dependencies) { const index = hookState.index++; const previous = hookState.effects[index]; if (previous == null || dependencies.some((value, dependencyIndex) => value !== previous[dependencyIndex])) { hookState.effects[index] = dependencies; callback(); } },
};
globalThis.__projectProfileSharingTest = { ReactRuntime, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "project-profile-sharing-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__projectProfileSharingTest.jsx;export const e6=globalThis.__projectProfileSharingTest.ReactRuntime;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function resetHooks() { hookState.effects = []; hookState.hooks = []; hookState.index = 0; }
function render(component, props) { hookState.index = 0; return component(props); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const profileShare = await bundle("profile-share-dialog-content");
assert.deepEqual(Object.keys(profileShare), ["ProfileShareDialogContent"]);
let profileClosed = 0, copiedProfile, sharedTarget;
resetHooks();
const profileProps = { accountId: "a", userId: "u", username: "Ada Lovelace", imageUrl: "/avatar.png", visibility: "public", onClose() { profileClosed++; }, onCopy(url) { copiedProfile = url; }, onShare(target, url) { sharedTarget = `${target}:${url}`; }, onVisibilityChange() {} };
let profileUi = render(profileShare.ProfileShareDialogContent, profileProps);
assert.match(text(profileUi), /Share your profile/);
assert.equal(find(profileUi, node => node.type === "img").props.alt, "Profile thumbnail");
assert.equal(find(profileUi, node => node.props?.["aria-label"] === "Profile link").props.value, "https://chatgpt.com/u/Ada%20Lovelace");
find(profileUi, node => node.props?.children === "Copy link").props.onClick();
assert.match(copiedProfile, /Ada%20Lovelace/);
find(profileUi, node => node.props?.children === "Share on X").props.onClick();
assert.match(sharedTarget, /^twitter:/);
find(profileUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(profileClosed, 1);
find(profileUi, node => node.type === "select").props.onChange({ currentTarget: { value: "private" } });
await Promise.resolve();
profileUi = render(profileShare.ProfileShareDialogContent, profileProps);
assert.match(text(profileUi), /Make your profile public/);
resetHooks();
assert.match(text(render(profileShare.ProfileShareDialogContent, { accountId: "a", userId: "u", isWorkspace: true, onClose() {} })), /only visible to members/);
resetHooks();
assert.equal(find(render(profileShare.ProfileShareDialogContent, { accountId: "a", userId: "u", isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading sharing settings");
resetHooks();
assert.match(text(render(profileShare.ProfileShareDialogContent, { accountId: "a", userId: "u", error: "bad", onClose() {} })), /Couldn’t load/);

const scheduled = await bundle("scheduled-task-share-dialog");
assert.deepEqual(Object.keys(scheduled), ["ScheduledTaskShareDialog"]);
const automation = { id: "auto", title: "Daily digest", prompt: "Summarize activity", status: "active" };
resetHooks();
assert.equal(render(scheduled.ScheduledTaskShareDialog, { automation: { ...automation, status: "completed" }, onClose() {} }), null);
let createdShare;
resetHooks();
const newShareProps = { automation, onClose() {}, onCreateShare(task) { createdShare = task.id; return { post_id: "post", permalink: "https://share/new" }; } };
let newShare = render(scheduled.ScheduledTaskShareDialog, newShareProps);
assert.match(text(newShare), /Daily digest/);
assert.match(text(newShare), /Changes made after sharing won't be shared/);
find(newShare, node => node.props?.children === "Create link").props.onClick();
await Promise.resolve();
assert.equal(createdShare, "auto");
newShare = render(scheduled.ScheduledTaskShareDialog, newShareProps);
assert.equal(find(newShare, node => node.props?.["aria-label"] === "Share link").props.value, "https://share/new");
let copiedTask, refreshedTask;
resetHooks();
const existingShare = render(scheduled.ScheduledTaskShareDialog, { automation, currentShare: { post_id: "post", permalink: "https://share/task" }, onClose() {}, onCopy(url) { copiedTask = url; }, onRefreshShare(share) { refreshedTask = share.post_id; return share; } });
assert.equal(find(existingShare, node => node.props?.["aria-label"] === "Share link").props.value, "https://share/task");
find(existingShare, node => node.props?.children === "Copy link").props.onClick();
find(existingShare, node => node.props?.children === "Refresh link").props.onClick();
await Promise.resolve();
assert.equal(copiedTask, "https://share/task");
assert.equal(refreshedTask, "post");
assert.equal(find(existingShare, node => node.props?.children === "Stop sharing").type, "button");

const imageShareReleaseAssertions = assertReleaseOwner("image-prompt-share-dialog");

const projectSettingsReleaseAssertions = assertReleaseOwner("chatgpt-project-settings-modal");

const showcaseReleaseAssertions = assertReleaseOwner("profile-showcase-editor");

console.log(`project profile sharing cluster tests passed with ${imageShareReleaseAssertions + projectSettingsReleaseAssertions + showcaseReleaseAssertions} release assertions`);
