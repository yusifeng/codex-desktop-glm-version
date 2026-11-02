import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const entryPoints = [
  "action-url-policy",
  "availability-status",
  "cyclic-selection",
  "message-projections",
  "normalize-recipient-fields",
  "prompt-and-markdown-policy",
];
const modules = Object.fromEntries(await Promise.all(entryPoints.map(async (name) => {
  const result = await esbuild.build({
    entryPoints: [`src/renderer/app-primary/runtime/${name}.ts`],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
  });
  return [name, await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`)];
})));

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.deepEqual(actual, expected);
};

const action = modules["action-url-policy"];
for (const url of ["http://example.com", "https://example.com", "codex://settings", "/tasks"]) equal(action.isAllowedActionUrl(url), true);
for (const url of ["//evil.example", "tasks", "javascript:alert(1)"]) equal(action.isAllowedActionUrl(url), false);
equal(action.isTasksLocalAction({ action_v2: { action_enum: "open_local_url", web_url: "/tasks" } }), true);
equal(action.isTasksLocalAction({ action_v2: { action_enum: "open_url", web_url: "/tasks" } }), false);

const availability = modules["availability-status"];
equal(availability.getEligibilityStatus({ isEligible: false, isLoading: true }), "loading");
equal(availability.getEligibilityStatus({ isEligible: true, isLoading: false }), "eligible");
equal(availability.getEligibilityStatus({ isEligible: false, isLoading: false }), "ineligible");
equal(availability.getTakeoverAvailabilityStatus(true, { isAvailable: true, target: null }), { isPending: true, isUnavailable: false });
equal(availability.getTakeoverAvailabilityStatus(true, { isAvailable: false, target: null }), { isPending: false, isUnavailable: true });
equal(availability.getTakeoverAvailabilityStatus(false, { isAvailable: false, target: null }), { isPending: false, isUnavailable: false });

const cyclic = modules["cyclic-selection"];
equal(cyclic.selectCyclicItem(["a", "b", "c"], "b", 1), "c");
equal(cyclic.selectCyclicItem(["a", "b", "c"], "a", -1), "c");
equal(cyclic.selectCyclicItem(["a", "b"], "missing", 1), "a");
equal(cyclic.selectCyclicItem(["a", "b"], "missing", -1), "b");
equal(cyclic.selectCyclicItem([], "missing", 1), null);

const messages = modules["message-projections"];
for (const kind of ["sending_in_progress", "polling_final", "success_sent"]) equal(messages.isMessageSendPresented({ kind }), true);
equal(messages.isMessageSendPresented({ kind: "error" }), false);
equal(messages.getSenderLinkId({ senderLinkId: "sender-1" }), "sender-1");
equal(messages.getSenderLinkId({ senderLinkId: 7 }), undefined);
equal(messages.getSenderLinkId(null), undefined);

const prompt = modules["prompt-and-markdown-policy"];
equal(prompt.getFirstPrompt([" ", "  first  ", "second"]), "first");
equal(prompt.getFirstPrompt([]), null);
equal(prompt.getFirstPrompt(undefined), null);
equal(prompt.stripMarkdownExtension("README.md"), "README");
equal(prompt.stripMarkdownExtension("README.MD"), "README");
equal(prompt.stripMarkdownExtension("README.md.txt"), "README.md.txt");

const recipients = modules["normalize-recipient-fields"];
equal(recipients.parseDelimitedRecipients(" Known@Example.com; new@example.com\nthird@example.com ", [
  { email: "known@example.com", id: "known", name: "Known" },
]), [
  { email: "Known@Example.com", id: "known", name: "Known" },
  { email: "new@example.com" },
  { email: "third@example.com" },
]);
equal(recipients.normalizeRecipientContacts([
  { email: " user@example.com ", id: " id ", name: " User ", photo_url: " avatar " },
  { email: "  ", id: "ignored" },
]), [{ email: "user@example.com", id: "id", name: "User", avatar_url: "avatar" }]);
equal(recipients.findContactIdByOwnerEmail([
  { id: "contact", ownerEmail: "Owner@Example.com" },
], { ownerEmail: " owner@example.com " }), "contact");
equal(recipients.findContactIdByOwnerEmail([], null), undefined);
equal(recipients.formatRecipientField({ contacts: { recipient: [{ email: "a@example.com" }, { email: "b@example.com" }] } }, "recipient"), "a@example.com, b@example.com");
equal(recipients.formatRecipientField({ contacts: { recipient: [{ email: "valid@example.com" }, { email: 7 }] } }, "recipient"), "valid@example.com");
equal(recipients.formatRecipientField({ contacts: [], recipient: "legacy@example.com" }, "recipient"), "legacy@example.com");
equal(recipients.formatRecipientField({ cc: "legacy@example.com" }, "cc"), "legacy@example.com");
equal(recipients.formatRecipientField(null, "bcc"), "");
equal(recipients.mergeRecipientInput([{ email: "a@example.com" }], " b@example.com "), "a@example.com, b@example.com");
equal(recipients.mergeRecipientInput([], " b@example.com "), "b@example.com");
equal(recipients.mergeRecipientInput([{ email: "a@example.com" }], " "), "a@example.com");

console.log(`app-primary semantic policy cluster: ${assertions} assertions passed`);
