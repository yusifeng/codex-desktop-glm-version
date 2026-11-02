import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [`src/renderer/app-primary/runtime/${name}.ts`],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const submit = await load("browser-sidebar-submit-contract");
const state = await load("submission-state-policy");
const previousWindow = globalThis.window;
globalThis.window = new EventTarget();

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};

const eventName = "codex-browser-sidebar-tweaks-submit-request";
const owner = (event) => {
  if (event.detail.conversationId !== "conversation-1") return;
  event.detail.onSubmitStarted?.("started");
  event.detail.onSubmitAvailability?.(true);
  event.detail.onSubmitAvailability?.(event.detail.submissionKind !== "blocked");
};
window.addEventListener(eventName, owner);
equal(submit.getBrowserSidebarSubmitStarted("conversation-1"), "started");
equal(submit.getBrowserSidebarSubmitStarted("other"), undefined);
equal(submit.getBrowserSidebarSubmitAvailability("conversation-1", "direct-comment"), true);
equal(submit.getBrowserSidebarSubmitAvailability("conversation-1", "blocked"), false);
equal(submit.getBrowserSidebarSubmitAvailability("other", "direct-comment"), undefined);

let changes = 0;
const unsubscribe = submit.subscribeBrowserSidebarSubmitAvailability("conversation-1", () => {
  changes += 1;
});
window.dispatchEvent(new CustomEvent(eventName, { detail: { conversationId: "other", availabilityChanged: true } }));
window.dispatchEvent(new CustomEvent(eventName, { detail: { conversationId: "conversation-1", availabilityChanged: false } }));
window.dispatchEvent(new CustomEvent(eventName, { detail: { conversationId: "conversation-1", availabilityChanged: true } }));
equal(changes, 1);
unsubscribe();
window.dispatchEvent(new CustomEvent(eventName, { detail: { conversationId: "conversation-1", availabilityChanged: true } }));
equal(changes, 1);
window.removeEventListener(eventName, owner);
globalThis.window = previousWindow;

equal(state.getNonSuccessSubmissionState({ status: "success", value: 1 }), null);
const failed = { status: "error", value: 2 };
equal(state.getNonSuccessSubmissionState(failed), failed);
equal(state.getNonSuccessSubmissionState(undefined), undefined);

let mode;
state.toggleComposerWorktreeMode({ composerMode: "worktree", setComposerMode: (value) => { mode = value; } });
equal(mode, "local");
state.toggleComposerWorktreeMode({ composerMode: "local", setComposerMode: (value) => { mode = value; } });
equal(mode, "worktree");

const operation = {
  direction: "to-host-worktree",
  request: { destinationHostId: "host-1", destinationWorkspaceRoot: "/repo" },
};
equal(state.matchesDestinationHostWorktreeOperation({ destinationHostId: "host-1", destinationWorkspaceRoot: "/repo", operation }), true);
equal(state.matchesDestinationHostWorktreeOperation({ destinationHostId: "host-2", destinationWorkspaceRoot: "/repo", operation }), false);
equal(state.matchesDestinationHostWorktreeOperation({ destinationHostId: "host-1", destinationWorkspaceRoot: "/repo", operation: null }), false);

console.log(`app-primary submission contracts: ${assertions} assertions passed`);

