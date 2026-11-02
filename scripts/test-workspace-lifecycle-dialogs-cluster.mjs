import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
globalThis.__jsx = jsx;

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => modulePath === "app-shared"
        ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx;" }
        : { loader: "js", contents: "export default {};" });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const checkout = await load("business-checkout-switch-workspace-dialog");
let switched = null;
let closed = 0;
let switchError = null;
const switchView = checkout.BusinessCheckoutSwitchWorkspaceDialog({ workspaceId: "w1", onClose: () => { closed++; }, onSwitch: id => { switched = id; }, onError: error => { switchError = error; } });
assert.equal(switchView.props.children.props.children[0].props.children, "Switch to your new workspace?");
assert.match(switchView.props.children.props.children[1].props.children, /ready/);
await switchView.props.children.props.onSubmit({ preventDefault() {} });
assert.equal(switched, "w1");
assert.equal(closed, 1);
const pending = checkout.BusinessCheckoutSwitchWorkspaceDialog({ workspaceId: "w1", pending: true, onClose() {} });
assert.equal(pending.props.children.props.children[2].props.role, "status");
assert.equal(pending.props.children.props.children[4].props.children[1].props.disabled, true);
const failure = new Error("bad");
const failed = checkout.BusinessCheckoutSwitchWorkspaceDialog({ workspaceId: "w1", error: "Earlier", onClose() {}, onSwitch() { throw failure; }, onError: error => { switchError = error; } });
assert.equal(failed.props.children.props.children[3].props.role, "alert");
await failed.props.children.props.onSubmit({ preventDefault() {} });
assert.equal(switchError, failure);

const releaseAssertions = assertReleaseOwner("personal-workspace-access-blocked-dialog") + assertReleaseOwner("stable-worktree-status-dialog");

const migration = await load("habitat-automation-migration-prompt");
assert.equal(migration.HabitatAutomationMigrationPrompt(), null);
assert.equal(migration.HabitatAutomationMigrationPrompt({ accountId: "a", userId: "u", state: { status: "complete" } }), null);
assert.equal(migration.HabitatAutomationMigrationPrompt({ accountId: "a", userId: "u", visibility: "dismissed", state: { status: "available" } }), null);
let declined = 0;
let migrated = 0;
const prompt = migration.HabitatAutomationMigrationPrompt({ accountId: "a", userId: "u", state: { status: "available" }, onDecline: () => { declined++; }, onMigrate: () => { migrated++; } });
assert.equal(prompt.props.children.props.children[0].props.children, "Sync your local automations");
assert.match(prompt.props.children.props.children[2].props.children, /encrypted/);
assert.match(prompt.props.children.props.children[3].props.children, /this device/);
prompt.props.children.props.children[5].props.children[0].props.onClick();
assert.equal(declined, 1);
prompt.props.children.props.onSubmit({ preventDefault() {} });
assert.equal(migrated, 1);
const migrationError = migration.HabitatAutomationMigrationPrompt({ accountId: "a", userId: "u", state: { status: "error" }, onMigrate() {} });
assert.equal(migrationError.props.children.props.children[4].props.role, "alert");
assert.equal(migrationError.props.children.props.children[5].props.children[1].props.children, "Try again");
const migrating = migration.HabitatAutomationMigrationPrompt({ accountId: "a", userId: "u", state: { status: "migrating" } });
assert.equal(migrating.props.children.props.children[5].props.children[0].props.disabled, true);

delete globalThis.__jsx;
console.log(`workspace lifecycle dialogs cluster complete (${releaseAssertions} release assertions)`);
