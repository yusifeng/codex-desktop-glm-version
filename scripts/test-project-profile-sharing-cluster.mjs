import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
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
const profileUi = profileShare.ProfileShareDialogContent({ accountId: "a", userId: "u", username: "Ada Lovelace", imageUrl: "/avatar.png", visibility: "public", onClose() { profileClosed++; }, onCopy(url) { copiedProfile = url; }, onShare(target, url) { sharedTarget = `${target}:${url}`; } });
assert.match(text(profileUi), /Share your profile/);
assert.equal(find(profileUi, node => node.type === "img").props.alt, "Profile thumbnail");
assert.equal(find(profileUi, node => node.props?.["aria-label"] === "Profile link").props.value, "https://chatgpt.com/u/Ada%20Lovelace");
find(profileUi, node => node.props?.children === "Copy link").props.onClick();
assert.match(copiedProfile, /Ada%20Lovelace/);
find(profileUi, node => node.props?.children === "Share on X").props.onClick();
assert.match(sharedTarget, /^twitter:/);
find(profileUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(profileClosed, 1);
assert.match(text(profileShare.ProfileShareDialogContent({ accountId: "a", userId: "u", isWorkspace: true, onClose() {} })), /only visible to members/);
assert.equal(find(profileShare.ProfileShareDialogContent({ accountId: "a", userId: "u", isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading sharing settings");
assert.match(text(profileShare.ProfileShareDialogContent({ accountId: "a", userId: "u", error: "bad", onClose() {} })), /Couldn’t load/);

const scheduled = await bundle("scheduled-task-share-dialog");
assert.deepEqual(Object.keys(scheduled), ["ScheduledTaskShareDialog"]);
const automation = { id: "auto", title: "Daily digest", prompt: "Summarize activity", status: "active" };
assert.equal(scheduled.ScheduledTaskShareDialog({ automation: { ...automation, status: "completed" }, onClose() {} }), null);
let createdShare;
const newShare = scheduled.ScheduledTaskShareDialog({ automation, onClose() {}, onCreateShare(task) { createdShare = task.id; return { post_id: "post", permalink: "https://share/new" }; } });
assert.match(text(newShare), /Daily digest/);
assert.match(text(newShare), /Changes made after sharing won't be shared/);
find(newShare, node => node.props?.children === "Create link").props.onClick();
await Promise.resolve();
assert.equal(createdShare, "auto");
let copiedTask, refreshedTask;
const existingShare = scheduled.ScheduledTaskShareDialog({ automation, currentShare: { post_id: "post", permalink: "https://share/task" }, onClose() {}, onCopy(url) { copiedTask = url; }, onRefreshShare(share) { refreshedTask = share.post_id; return share; } });
assert.equal(find(existingShare, node => node.props?.["aria-label"] === "Share link").props.value, "https://share/task");
find(existingShare, node => node.props?.children === "Copy link").props.onClick();
find(existingShare, node => node.props?.children === "Refresh link").props.onClick();
await Promise.resolve();
assert.equal(copiedTask, "https://share/task");
assert.equal(refreshedTask, "post");
assert.equal(find(existingShare, node => node.props?.children === "Stop sharing").type, "button");

const imageShare = await bundle("image-prompt-share-dialog");
assert.deepEqual(Object.keys(imageShare), ["ImagePromptShareDialog"]);
let publishedContent, copiedImage, imageClosed = 0;
const imageUi = imageShare.ImagePromptShareDialog({ accountId: "a", userId: "u", shareSessionId: "s", sourceContent: { title: "City", prompt: "A city at dusk" }, image: { src: "/city.png", chatGptDisplayTitle: "City image" }, onClose() { imageClosed++; }, onPublish(content, src) { publishedContent = `${content.title}:${src}`; return { postId: "p", url: "https://share/image", content }; }, onCopy(url) { copiedImage = url; return true; } });
assert.match(text(imageUi), /Share prompt template/);
assert.match(text(imageUi), /A city at dusk/);
assert.equal(find(imageUi, node => node.type === "img").props.alt, "City image");
find(imageUi, node => node.props?.children === "Copy link").props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(publishedContent, "City:/city.png");
assert.equal(copiedImage, "https://share/image");
find(imageUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(imageClosed, 1);
const publishedUi = imageShare.ImagePromptShareDialog({ accountId: "a", userId: "u", shareSessionId: "s", sourceContent: { title: "Old", prompt: "Old" }, published: { postId: "p", url: "https://share/image", content: { title: "New", prompt: "New prompt" } }, image: { src: "/city.png" }, onClose() {} });
assert.match(text(publishedUi), /New prompt/);
assert.equal(find(publishedUi, node => node.props?.children === "Edit").type, "button");

const settings = await bundle("chatgpt-project-settings-modal");
assert.deepEqual(Object.keys(settings), ["ChatGptProjectSettingsModal"]);
const project = { gizmo: { id: "p1", display: { name: "Alpha" }, instructions: "Be concise", current_user_permission: { can_write: true, can_delete: true } } };
resetHooks();
assert.equal(render(settings.ChatGptProjectSettingsModal, { accountId: "a", activeAccountId: "b", project, onClose() {} }), null);
resetHooks();
let savedSettings, deletedProject, settingsClosed = 0;
const settingsProps = { accountId: "a", project, onClose() { settingsClosed++; }, onDelete(value) { deletedProject = value.gizmo.id; }, onSave(value, update) { savedSettings = `${value.gizmo.id}:${update.name}:${update.memoryScope}`; } };
let settingsUi = render(settings.ChatGptProjectSettingsModal, settingsProps);
assert.match(text(settingsUi), /Project settings/);
assert.equal(find(settingsUi, node => node.props?.children === "Save").props.disabled, true);
find(settingsUi, node => node.props?.name === "project-name").props.onChange({ currentTarget: { value: "Beta" } });
find(settingsUi, node => node.type === "select").props.onChange({ currentTarget: { value: "project_v2" } });
settingsUi = render(settings.ChatGptProjectSettingsModal, settingsProps);
assert.equal(find(settingsUi, node => node.props?.children === "Save").props.disabled, false);
await find(settingsUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(savedSettings, "p1:Beta:project_v2");
assert.equal(settingsClosed, 1);
settingsUi = render(settings.ChatGptProjectSettingsModal, settingsProps);
find(settingsUi, node => node.props?.children === "Delete project").props.onClick();
settingsUi = render(settings.ChatGptProjectSettingsModal, settingsProps);
assert.match(text(find(settingsUi, node => node.props?.role === "alertdialog")), /permanently deleted/);
await find(settingsUi, node => node.props?.children === "Delete").props.onClick();
await Promise.resolve();
assert.equal(deletedProject, "p1");
resetHooks();
let failedSaveAttempts = 0, failedClose = 0;
const failedSettingsProps = { accountId: "a", project, onClose() { failedClose++; }, async onSave() { failedSaveAttempts++; throw new Error("Save unavailable"); } };
settingsUi = render(settings.ChatGptProjectSettingsModal, failedSettingsProps);
find(settingsUi, node => node.props?.name === "project-name").props.onChange({ currentTarget: { value: "Unsaved name" } });
settingsUi = render(settings.ChatGptProjectSettingsModal, failedSettingsProps);
find(settingsUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await new Promise(resolve => setTimeout(resolve, 0));
settingsUi = render(settings.ChatGptProjectSettingsModal, failedSettingsProps);
assert.equal(find(settingsUi, node => node.props?.name === "project-name").props.value, "Unsaved name");
assert.match(text(find(settingsUi, node => node.props?.role === "alert")), /Save unavailable/);
find(settingsUi, node => node.props?.children === "Cancel").props.onClick();
settingsUi = render(settings.ChatGptProjectSettingsModal, failedSettingsProps);
assert.match(text(find(settingsUi, node => node.props?.role === "alertdialog")), /lost/);
assert.equal(failedSaveAttempts, 1);
assert.equal(failedClose, 0);
resetHooks();
const blockedMemory = render(settings.ChatGptProjectSettingsModal, { accountId: "a", project, workChatStatus: "has-work-chats", onClose() {} });
assert.match(text(find(blockedMemory, node => node.props?.role === "alert")), /Not supported/);
assert.equal(find(blockedMemory, node => node.type === "option" && node.props?.value === "project_v2").props.disabled, true);

const showcase = await bundle("profile-showcase-editor");
assert.deepEqual(Object.keys(showcase), ["ProfileShowcaseEditor"]);
const site = { id: "site:1", kind: "site", title: "Portfolio", accessLevel: "public" };
const skill = { id: "skill:1", kind: "skill", title: "Research", requiresSharing: true };
let savedShowcase, sharedItem, showcaseClosed = 0;
const showcaseUi = showcase.ProfileShowcaseEditor({ accountId: "a", userId: "u", savedItems: [site], availableItems: [site, skill], maxPins: 2, onClose() { showcaseClosed++; }, onShareItem(item) { sharedItem = item.id; }, onSave(items) { savedShowcase = items.map(item => item.id); } });
assert.match(text(showcaseUi), /Edit profile showcase/);
assert.equal(all(showcaseUi, node => node.type === "input" && node.props?.type === "checkbox").length, 2);
assert.equal(all(showcaseUi, node => node.type === "input" && node.props?.type === "checkbox")[0].props.defaultChecked, true);
all(showcaseUi, node => node.type === "input" && node.props?.type === "checkbox")[1].props.onChange();
find(showcaseUi, node => node.type === "button" && node.props?.children === "Save").props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(sharedItem, "skill:1");
assert.deepEqual(savedShowcase, ["site:1", "skill:1"]);
assert.equal(showcaseClosed, 1);
assert.match(text(showcase.ProfileShowcaseEditor({ accountId: "a", userId: "u", savedItems: [], availableItems: [], onClose() {} })), /No sites or skills/);
assert.equal(find(showcase.ProfileShowcaseEditor({ accountId: "a", userId: "u", savedItems: [], isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading showcase items");

console.log("project profile sharing cluster tests passed");
