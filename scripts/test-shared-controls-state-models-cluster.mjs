import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return { type, props: props ?? {}, key }; },
};
globalThis.__sharedControlsTest = {
  jsx,
  joinClasses(...values) { return values.filter(Boolean).join(" "); },
  persisted(key, value) { return { key, value }; },
  addressInput(props) { return { type: "address-input", props }; },
  desktopBridge: { customAvatars: {} },
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "shared-controls-state-models-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => {
          const name = path.basename(importPath);
          const contents = name === "app-shared"
            ? "export const I3=()=>globalThis.__sharedControlsTest.jsx;export const m4=(...v)=>globalThis.__sharedControlsTest.joinClasses(...v);"
            : name === "app-initial"
              ? "export const dun=(k,v)=>globalThis.__sharedControlsTest.persisted(k,v);export const pnt=globalThis.__sharedControlsTest.desktopBridge;"
              : name === "tab-address-input"
                ? "export const t=globalThis.__sharedControlsTest.addressInput;"
                : "export {};";
          return { contents, loader: "js" };
        });
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

function children(node) {
  const value = node?.props?.children;
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

// avatar-overlay-debug-state: 4
const avatar = await bundle("avatar-overlay-debug-state");
assert.deepEqual(Object.keys(avatar), ["n", "t"]);
avatar.n();
assert.equal(avatar.t.key, "avatar-overlay-debug-window-border-visible");
assert.equal(avatar.t.value, false);
assert.doesNotThrow(() => avatar.n());

// showcase-items: 8
const showcase = await bundle("showcase-items");
assert.deepEqual(Object.keys(showcase), ["n", "t"]);
const site = showcase.t({ kind: "site", site: { title: "Demo", description: "Site", thumbnail_url: "https://example.com/a.png" } });
assert.equal(site.title, "Demo");
assert.equal(site.description, "Site");
assert.equal(site.icon.props["data-showcase-site-thumbnail"], "https://example.com/a.png");
const svgPin = showcase.t({ kind: "pin", pin: { title: "Pin", icon: "PHN2ZyAAAA" } });
assert.match(children(svgPin.icon)[0].props.src, /^data:image\/svg\+xml;base64,/);
const dataPin = showcase.t({ kind: "pin", pin: { title: "Data", icon: "data:image/png;base64,x" } });
assert.equal(children(dataPin.icon)[0].props.src, "data:image/png;base64,x");
const emptyPin = showcase.t({ kind: "pin", pin: { title: "Empty" } });
assert.equal(emptyPin.description, null);
assert.equal(children(emptyPin.icon)[0].type, "span");

// view-control-labels: 8
const labels = await bundle("view-control-labels");
assert.deepEqual(Object.keys(labels), ["n", "r", "t"]);
labels.t();
const intl = { formatMessage(descriptor) { return descriptor.defaultMessage; } };
assert.equal(labels.r.evaluate({ intl, tabIds: [], view: "chat" }), "New tab");
assert.equal(labels.r.evaluate({ intl, tabIds: ["a"], view: "chat" }), "Show tabs");
assert.equal(labels.r.evaluate({ intl, tabIds: ["a"], view: "split" }), "Hide tabs");
assert.equal(labels.n.evaluate({ intl, tabIds: [], view: "full" }), "Exit full view");
assert.equal(labels.n.evaluate({ intl, tabIds: [], view: "split" }), "New tab in full view");
assert.equal(labels.n.evaluate({ intl, tabIds: ["a"], view: "split" }), "Enter full view");
assert.doesNotThrow(() => labels.t());

// tab-input: 7
const tabInput = await bundle("tab-input");
assert.deepEqual(Object.keys(tabInput), ["n", "t"]);
const navigations = [];
const tab = tabInput.t({ id: "address", addressValue: "https://example.com", scope: "scope", sources: [{ id: "base" }], providers: [(scope, context) => ({ id: "generated", scope, context })], onNavigate(...args) { navigations.push(args); } });
assert.equal(tab.type, globalThis.__sharedControlsTest.addressInput);
assert.equal(tab.props.sources.length, 2);
assert.equal(tab.props.sources[1].scope, "scope");
assert.equal(tab.props.sources[1].context.value, "https://example.com");
tab.props.onCommitAddress("https://openai.com");
assert.deepEqual(navigations, [["https://openai.com", false]]);
assert.equal(tab.props.sources[0].id, "base");

// pet-install-state: 13
const pets = await bundle("pet-install-state");
assert.deepEqual(Object.keys(pets), ["a", "i", "n", "r", "t"]);
let petValue = null;
const petScope = { get() { return petValue; }, set(_key, value) { petValue = value; } };
await pets.a(petScope, { imageUrl: "https://example.com/pet.png", name: "Pixel" }, async () => ({ spriteVersionNumber: 2 }));
assert.equal(petValue.status, "ready");
assert.equal(petValue.preview.spriteVersionNumber, 2);
let refreshed = 0;
await pets.r(petScope, async () => { refreshed++; }, async request => ({ id: `${request.name}-id` }));
assert.equal(petValue.status, "installed");
assert.equal(petValue.installedAvatarId, "Pixel-id");
assert.equal(refreshed, 1);
pets.t(petScope);
assert.equal(petValue, null);
await pets.a(petScope, { imageUrl: "bad", name: "Broken" }, async () => { throw new Error("preview"); });
assert.equal(petValue.status, "previewError");
petValue = { imageUrl: "bad", name: "Broken", preview: { spriteVersionNumber: 1 }, status: "ready" };
await pets.r(petScope, async () => {}, async () => { throw new Error("install"); });
assert.equal(petValue.status, "installError");
petValue = { imageUrl: "x", name: "Busy", status: "installing" };
await pets.a(petScope, { imageUrl: "y", name: "Ignored" }, async () => ({ spriteVersionNumber: 1 }));
assert.equal(petValue.name, "Busy");
assert.equal(pets.i.value, null);
assert.equal(typeof pets.n, "function");
assert.doesNotThrow(() => pets.n());

// thread-panel-secondary-state: 17
const secondary = await bundle("thread-panel-secondary-state");
assert.deepEqual(Object.keys(secondary), ["a", "c", "d", "f", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
assert.equal(secondary.h({ domains: ["example.com"] }, "https://sub.example.com/page"), true);
assert.equal(secondary.h({ domains: ["example.com"] }, "https://notexample.com/page"), false);
assert.equal(secondary.h({ urls: ["https://openai.com/research/"] }, "https://openai.com/research/index"), true);
assert.equal(secondary.h({ urls: ["https://openai.com/research/"] }, "not a url"), false);
const baseDiscovery = { bannerDismissedAtMs: null, experimentEnabled: false, hasImported: false, hasSeenBanner: false, hasSeenModal: false, isPanelSettled: true, isVisible: true, modalDismissedAtMs: null, nowMs: 200_000_000, profiles: [{}], profilesQuerySucceeded: true, serviceAvailable: true };
assert.equal(secondary.d(baseDiscovery).presentation, "banner");
assert.equal(secondary.d({ ...baseDiscovery, experimentEnabled: true }).presentation, "modal");
assert.equal(secondary.d({ ...baseDiscovery, isVisible: false }).presentation, null);
assert.equal(secondary.d({ ...baseDiscovery, bannerDismissedAtMs: 1 }).cooldownEndsAtMs, 86_400_001);
assert.equal(secondary.d(baseDiscovery).shouldDiscoverProfiles, true);
secondary.m();
assert.equal(secondary.f.value, false);
assert.equal(secondary.p.value, false);
const stateWrites = [];
const stateScope = { set(state, value) { stateWrites.push([state, value]); } };
secondary.o(stateScope);
assert.equal(stateWrites.length, 2);
secondary.l(stateScope);
assert.equal(stateWrites.at(-2)[1], true);
assert.equal(typeof stateWrites.at(-1)[1], "number");
assert.equal(secondary.t, 86_400_000);
assert.equal(secondary.n, "1161538056");

// radio-group: 8
const radio = await bundle("radio-group");
assert.deepEqual(Object.keys(radio), ["n", "r", "t"]);
let selected;
const group = radio.n({ __isWidget: true, direction: "column", onChange(value) { selected = value; }, children: "items" });
assert.equal(group.props.role, "radiogroup");
assert.equal(group.props["data-direction"], "column");
assert.equal(group.props["data-w-component"], "radio-group");
group.props.onChange({ target: { value: "two" } });
assert.equal(selected, "two");
const radioItem = radio.n.Item({ block: true, children: "Two", value: "two" });
assert.equal(children(radioItem)[0].props["data-block"], "");
assert.equal(children(children(radioItem)[0])[0].props.type, "radio");
assert.doesNotThrow(() => children(radioItem)[0].props.onMouseDown({ defaultPrevented: false, detail: 1, preventDefault() {} }));

// animated-segmented-toggle: 8
const segmented = await bundle("animated-segmented-toggle");
assert.deepEqual(Object.keys(segmented), ["n", "t"]);
let selectedSegment;
const toggle = segmented.t({ ariaLabel: "View", options: [{ id: "grid", label: "Grid" }, { id: "list", label: "List", ariaLabel: "List view" }], selectedId: "grid", size: "compact", onSelect(id) { selectedSegment = id; } });
assert.equal(toggle.props.role, "group");
assert.equal(toggle.props.style.gridTemplateColumns, "repeat(2, minmax(0, 1fr))");
const buttons = children(toggle);
assert.equal(buttons[0].props["aria-pressed"], true);
assert.equal(buttons[1].props["aria-label"], "List view");
buttons[1].props.onClick();
assert.equal(selectedSegment, "list");
assert.equal(children(buttons[0])[0].props["data-animate-selection"], "");
assert.equal(children(buttons[1])[0], null);

// project-share-model: 19
const share = await bundle("project-share-model");
assert.deepEqual(Object.keys(share), ["a", "c", "i", "l", "n", "o", "r", "s", "t"]);
assert.equal(share.i({ gizmo: { id: "project/id" } }), "https://chatgpt.com/g/project%2Fid/project");
const user = { type: 1, user_id: "u1__account", user_name: "Ada", capabilities: { can_read: true } };
const groupSubject = { type: 2, group_id: "g1", capabilities: { can_read: true } };
const email = { type: 10, user_email: " USER@EXAMPLE.COM ", capabilities: { can_read: true } };
assert.equal(share.c(user), "user:u1");
assert.equal(share.c(groupSubject), "group:g1");
assert.equal(share.c(email), "email:user@example.com");
assert.equal(share.s(user), "Ada");
assert.equal(share.s(groupSubject), "g1");
assert.equal(share.n([]), "private");
assert.equal(share.n([{ type: 3, capabilities: {} }]), "workspace_link");
assert.equal(share.n([{ type: 4, capabilities: {} }]), "link");
assert.equal(share.l({ ...user, user_id: "u1" }, "account").user_id, "u1__account");
assert.equal(share.l(email).type, "email");
assert.equal(share.o([], [user]), true);
assert.equal(share.o([user], [{ ...user, capabilities: { can_read: true, can_write: true } }]), true);
assert.equal(share.o([user], [user]), false);
assert.equal(share.t.chat.can_write, false);
assert.equal(share.t.edit.can_write, true);
const project = { gizmo: { author: { user_id: "u1__a" }, current_user_permission: { can_read: true, can_share: true, can_write: true }, id: "p", share_recipient: "link", sharing: { subjects: [] } } };
const permissions = share.r(project, { account_user_id: "u1__b", account_user_role: "account-admin", structure: "workspace" }, { permissions: ["chatgpt.workspace.project.share", "chatgpt.workspace.project.crud", "chatgpt.workspace.project.share_workspace"] });
assert.equal(permissions.canManage, true);
assert.equal(permissions.canShareWorkspaceLink, true);

console.log("92 shared controls and state models cluster assertions passed");
