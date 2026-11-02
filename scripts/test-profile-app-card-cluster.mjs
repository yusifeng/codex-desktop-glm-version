import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__profileAppTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "profile-app-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__profileAppTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function findAll(node, predicate) { const values = []; walk(node, value => { if (predicate(value)) values.push(value); }); return values; }
function find(node, predicate) { return findAll(node, predicate)[0]; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

// codex-pet-assets: 8
const pets = await bundle("codex-pet-assets");
assert.deepEqual(Object.keys(pets), ["n", "t"]);
assert.equal(Object.keys(pets.t).length, 9);
assert.match(pets.t.codex, /codex-spritesheet-v6/);
assert.match(pets.t.bsod, /bsod-spritesheet-v5/);
assert.match(pets.t["null-signal"], /null-signal-spritesheet-v7/);
assert.match(pets.t.seedy, /seedy-spritesheet-v10/);
assert.equal(Object.isFrozen(pets.t), true);
assert.equal(pets.n(), undefined);

// use-avatar-options: 10
const avatars = await bundle("use-avatar-options");
assert.deepEqual(Object.keys(avatars), ["n", "t"]);
assert.deepEqual(avatars.n(), { avatarDirectory: null, avatarOptions: [], isError: false, isFetching: false, isLoading: false });
const avatarState = avatars.n({ avatarDirectory: "/avatars", cloudAvatars: [{ id: "cloud", type: "cloud" }, { id: "same", source: "cloud" }], localAvatars: [{ id: "local", type: "builtin" }, { id: "same", source: "local" }], selectedAvatarId: "custom", isFetching: true });
assert.equal(avatarState.avatarDirectory, "/avatars");
assert.deepEqual(avatarState.avatarOptions.map(option => option.id), ["local", "same", "cloud", "custom"]);
assert.equal(avatarState.avatarOptions.find(option => option.id === "same").source, "cloud");
assert.equal(avatarState.avatarOptions.find(option => option.id === "custom").type, "custom");
assert.equal(avatarState.isFetching, true);
assert.deepEqual(avatars.n({ cloudAvatars: [{ id: "cloud" }], includeCloudPets: false }).avatarOptions, []);
assert.equal(avatars.n({ isError: true }).isError, true);
assert.equal(avatars.t(), undefined);

// profile-view: 13
const profile = await bundle("profile-view");
assert.deepEqual(Object.keys(profile), ["n", "t"]);
let renamed, selected;
const profileUi = profile.t({ activities: [{ id: "a1", label: "Shipped feature", timestamp: "2026-09-28" }], avatarId: "codex", onAvatarChanged(id) { selected = id; }, onUsernameChanged(value) { renamed = value; }, stats: [{ key: "totalTextTokens", label: "Tokens", value: 42 }], today: new Date("2026-09-28T00:00:00.000Z"), username: "David" });
assert.equal(profileUi.props["data-profile-v2-enabled"], true);
assert.equal(profileUi.props["data-today"], "2026-09-28T00:00:00.000Z");
assert.match(text(profileUi), /David's profile/);
assert.match(text(profileUi), /Tokens/);
assert.equal(find(profileUi, node => node.type === "dd").props.children, "42");
assert.equal(find(profileUi, node => node.type === "dd").props["data-raw-value"], 42);
assert.match(text(profileUi), /Shipped feature/);
assert.equal(find(profileUi, node => node.type === "time").props.dateTime, "2026-09-28");
find(profileUi, node => node.props?.["data-avatar-id"] === "codex").props.onClick();
assert.equal(selected, "codex");
find(profileUi, node => node.type === "input").props.onChange({ currentTarget: { value: "Nova" } });
assert.equal(renamed, "Nova");
const profileError = profile.t({ error: new Error("Profile failed") });
assert.match(find(profileError, node => node.props?.role === "alert").props.children, /Profile failed/);
const Layout = ({ children }) => ({ type: "layout", props: { children } });
assert.equal(profile.t({ Layout }).type, "layout");
assert.equal(profile.n(), undefined);
let openedShowcase, editedShowcase = 0;
const showcaseUi = profile.t({ isOwnProfile: true, username: "David", stats: [{ key: "longestTaskDurationMs", value: 3_900_000 }, { key: "currentStreakDays", value: 1 }], showcase: [{ id: "site", kind: "site", title: "Launch page", description: "A published site" }], onOpenShowcaseItem(item) { openedShowcase = item.id; }, onEditShowcase() { editedShowcase++; } });
assert.match(text(showcaseUi), /1h 5m/);
assert.match(text(showcaseUi), /1 day/);
find(showcaseUi, node => node.props?.children === "Launch page").props.onClick();
find(showcaseUi, node => node.props?.children === "Edit showcase").props.onClick();
assert.equal(openedShowcase, "site");
assert.equal(editedShowcase, 1);

// app-card: 16
const appCard = await bundle("app-card");
assert.deepEqual(Object.keys(appCard), ["a", "i", "n", "o", "r", "t"]);
const projectRestriction = { keyPath: "apps.drive.enabled", kind: "app", origin: { name: { type: "project" } } };
assert.equal(appCard.r({ restriction: projectRestriction, surface: "card" }), "Disabled by project settings");
assert.match(appCard.r({ restriction: projectRestriction, surface: "dialog" }), /apps\.drive\.enabled/);
assert.equal(appCard.r({ restriction: { keyPath: "apps.drive.enabled", isUserEditable: true }, surface: "card" }), "Set apps.drive.enabled to true in your user config.toml");
assert.equal(appCard.a({ tool: { disabledReason: "disabled_by_admin", name: "write" } }).props.children, "Disabled by admin");
assert.equal(appCard.a({ isAppDisabledWithoutRestriction: true, tool: { name: "read" } }).props.children, "Unavailable");
assert.equal(appCard.a({ tool: { isEnabled: true, name: "read" } }), null);
assert.equal(appCard.i({ children: "control", isControlDisabled: false, tooltipContent: "reason" }), "control");
assert.equal(appCard.i({ children: "control", isControlDisabled: true, tooltipContent: "reason" }).props.role, "tooltip");
let connected = 0, disconnected = 0, managed = 0, enabled;
const cardUi = appCard.t({ app: { description: "Files", id: "drive", name: "Drive", tools: [{ isEnabled: false, name: "read" }] }, connectedAccountEmail: "d@example.com", disabled: true, onConnect() { connected++; }, onDisconnectApp() { disconnected++; }, onOpenAppTools() { managed++; }, onSetAppEnabled(value) { enabled = value; } });
assert.equal(cardUi.props["data-app-id"], "drive");
assert.match(text(cardUi), /Connected to d@example\.com/);
assert.match(text(cardUi), /Unavailable/);
find(cardUi, node => node.props?.children === "Connect").props.onClick();
assert.equal(connected, 1);
find(cardUi, node => node.props?.children === "Disconnect").props.onClick();
assert.equal(disconnected, 1);
find(cardUi, node => node.props?.children === "Manage actions").props.onClick();
assert.equal(managed, 1);
find(cardUi, node => node.props?.role === "switch").props.onClick();
assert.equal(enabled, true);

console.log("52 profile and app card cluster assertions passed");
