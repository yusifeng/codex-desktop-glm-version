import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/source-toolbar/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceCheck = (value, message) => { assert.ok(value, message); sourceAssertions += 1; };
const staticDependencies = [...new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]))].sort();
const dynamicDependencies = [...new Set([...source.matchAll(/import\(\s*"@rchunk\/([^"/]+)"\s*\)/g)].map((match) => match[1]))].sort();
sourceCheck(JSON.stringify(staticDependencies) === JSON.stringify(["app-initial","app-primary","app-shared","assert-never","browser-profile-import-availability","browser-use-origin-state-queries","comment-mode-coachmark-state","local-conversation-artifacts-signals","rolldown-runtime","source-annotation-host-registry"]), "preserves the ten published static dependencies");
sourceCheck(JSON.stringify(dynamicDependencies) === JSON.stringify(["appgen-access-entry","appgen-browser-site-entry","appgen-query","appgen-settings-dialog","appgen-share-dialog","browser-profile-import-state","browser-site-actions-state","dialog-launcher-entry","local-conversation-sources-signals-entry","local-conversation-webmcp-tools-model-entry","modal-controller-state","open-local-conversation-sources-side-panel-tab-entry"]), "preserves all direct lazy dependency surfaces");
sourceCheck(!/\bany\b/.test(source), "does not introduce an explicit unsafe type");
sourceCheck(!/\b[A-Za-z]+Chunk\s*\./.test(source), "does not consume namespace members");
sourceCheck(source.includes("filterBrowserIntlConfig") && source.includes("external_link"), "retains browser-specific state filtering and navigation normalization");

const state = (globalThis.__sourceToolbarTest = { opened: [], modal: [], acknowledgements: 0, siteCalls: [] });
const mocks = new Proxy({
  "browser-site-actions-state": "export const getBrowserSiteActionsState=(get,content,url,hostId)=>{globalThis.__sourceToolbarTest.siteCalls.push({url,hostId});return {url,hostId};};",
  "open-local-conversation-sources-side-panel-tab-entry": "export const openLocalConversationSourcesSidePanelTab=(id)=>globalThis.__sourceToolbarTest.opened.push(id);",
  "dialog-launcher-entry": "export const openBrowserProfileImportDialog=(action)=>globalThis.__sourceToolbarTest.opened.push(action.type);",
  "browser-profile-import-state": "export const acknowledgeBrowserProfileImportNux=async()=>{globalThis.__sourceToolbarTest.acknowledgements+=1};",
  "appgen-settings-dialog": "export const AppgenSettingsDialog='settings-dialog';",
  "appgen-share-dialog": "export const AppgenShareDialog='share-dialog';",
  "modal-controller-state": "export const openModal=(component,action)=>globalThis.__sourceToolbarTest.modal.push({component,type:action.type});",
}, { get(target, key) { return target[key] ?? "export {};"; } });
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "source-toolbar-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let runtimeAssertions = 0;
const runtimeCheck = (value, message) => { assert.ok(value, message); runtimeAssertions += 1; };
runtimeCheck(Object.keys(module).join(",") === "createBrowserWindowToolbarContribution", "preserves the sole public export");
const events = { changed: 0, disposed: 0, addresses: [], suggestions: [], navigation: [], preferences: [], fallback: [] };
let lifecycle = { hostId: "host-1", ownsTab: true, state: "detached" };
const content = {
  browserTabId: "tab-1", conversationId: "conversation-1", snapshot: { url: "https://start.example" },
  dispose: () => { events.disposed += 1; },
  getCapabilities: (_get, hostId) => ({ canCaptureScreenshot: true, hostId }),
  getSiteActions: (_get, hostId, url) => ({ canOpenSources: true, recentToolCallCount: 3, hostId, url }),
  handleToolbarAction: async (action) => { events.fallback.push(action.type); return true; },
  recordBrowserAddressCommit: (event) => events.addresses.push(event),
  recordBrowserAutocompleteSuggestionsShown: (event) => events.suggestions.push(event),
  recordBrowserNavigation: (event) => events.navigation.push(event),
};
const owner = { tabId: "tab-1", getLifecycle: () => lifecycle, onStateChanged: () => { events.changed += 1; } };
const scope = { setPreference: async (key, value) => events.preferences.push({ key, value }) };
const contribution = module.createBrowserWindowToolbarContribution(scope, content, owner);
runtimeCheck(contribution.toolbar.kind === "browser", "creates a browser toolbar contribution");
await Promise.resolve(); await Promise.resolve();
runtimeCheck(events.changed === 1, "announces lazy site-action availability");
const service = contribution.toolbar.service;
service.recordBrowserAddressCommit({ value: "address" }); service.recordBrowserAutocompleteSuggestionsShown({ count: 2 }); service.recordBrowserNavigation({ initiator: "os_open" });
runtimeCheck(events.addresses.length === 1 && events.suggestions.length === 1 && events.navigation[0].initiator === "external_link", "forwards owned-tab telemetry and normalizes external navigation");
service.forwardBrowserAnnotationMessage({ type: "browser-sidebar-state", browserTabId: "other", conversationId: "conversation-1", snapshot: { url: "https://ignored.example" } });
service.forwardBrowserAnnotationMessage({ type: "browser-sidebar-state", browserTabId: "tab-1", conversationId: "conversation-1", snapshot: { url: "https://next.example" } });
runtimeCheck(events.changed === 2, "ignores unrelated annotation messages and refreshes on URL changes");
const get = (signal, parameter) => signal === "browserIntlConfig" ? { locale: "en", defaultLocale: "en", messages: { "thread.browser.title": "Browser", "unrelated.message": "drop", "clipboard.copyError.title": "Copy failed", invalid: 42 } } : signal === "openAIGoLinksEnabled" ? parameter === "3646210497" : signal === "showFullUrl";
const snapshot = contribution.getState(get, "host-2");
runtimeCheck(Object.keys(snapshot.browserIntlConfig.messages).join(",") === "thread.browser.title,clipboard.copyError.title", "filters the browser localization payload");
runtimeCheck(snapshot.browserHostId === "host-2" && snapshot.browserToolbarCapabilities.hostId === "host-2" && snapshot.openAIGoLinksEnabled === true, "assembles host-scoped toolbar state");
runtimeCheck(snapshot.siteActions.url === "https://next.example", "uses the latest browser URL for lazy site actions");
runtimeCheck((await service.requestBrowserToolbarAction({ type: "set-annotation-markers-visible", visible: false })) === true && events.preferences[0].value === false, "updates annotation marker visibility");
runtimeCheck((await service.requestBrowserToolbarAction({ type: "open-sources" })) === true && state.opened[0] === "conversation-1", "opens conversation sources lazily");
await service.requestBrowserToolbarAction({ type: "open-browser-profile-import" }); await service.requestBrowserToolbarAction({ type: "acknowledge-browser-profile-import-nux" });
runtimeCheck(state.opened.includes("open-browser-profile-import") && state.acknowledgements === 1, "opens and acknowledges profile import UI");
await service.requestBrowserToolbarAction({ type: "open-appgen-site-settings" }); await service.requestBrowserToolbarAction({ type: "open-appgen-share" });
runtimeCheck(state.modal.map((entry) => entry.component).join(",") === "settings-dialog,share-dialog", "opens appgen settings and sharing dialogs lazily");
runtimeCheck((await service.requestBrowserToolbarAction({ type: "custom-action" })) === true && events.fallback[0] === "custom-action", "delegates unknown actions to the browser content");
lifecycle = { ...lifecycle, ownsTab: false }; service.recordBrowserAddressCommit({ value: "ignored" }); runtimeCheck(events.addresses.length === 1 && (await service.requestBrowserToolbarAction({ type: "custom-action" })) === false, "blocks telemetry and actions after ownership is lost");
contribution[Symbol.dispose](); contribution[Symbol.dispose](); runtimeCheck(events.disposed === 1, "disposes the controller exactly once");
console.log(`${sourceAssertions} source assertions, ${runtimeAssertions} runtime assertions passed for source toolbar`);
