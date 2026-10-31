import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/browser-use/origin-state.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "BrowserSettingsSync",
);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 34);

const clone = (value) => structuredClone(value);
const settingsDiff = (before, after) => {
  const preferences = {};
  for (const key of new Set([...Object.keys(before.preferences), ...Object.keys(after.preferences)])) {
    if (before.preferences[key] !== after.preferences[key]) preferences[key] = after.preferences[key];
  }
  const rule_updates = [];
  for (const resource of ["origin", "download", "upload", "full_cdp"]) {
    for (const pattern of new Set([
      ...Object.keys(before.rules[resource]),
      ...Object.keys(after.rules[resource]),
    ])) {
      if (before.rules[resource][pattern] !== after.rules[resource][pattern]) {
        rule_updates.push({
          resource,
          pattern,
          decision: after.rules[resource][pattern] ?? null,
        });
      }
    }
  }
  return Object.keys(preferences).length === 0 && rule_updates.length === 0
    ? null
    : {
        preferences: Object.keys(preferences).length === 0 ? undefined : preferences,
        rule_updates: rule_updates.length === 0 ? undefined : rule_updates,
      };
};
const mergeIntoSnapshot = (snapshot, diff) => {
  const merged = clone(snapshot);
  Object.assign(merged.preferences, diff.preferences);
  for (const update of diff.rule_updates ?? []) {
    if (update.decision == null) delete merged.rules[update.resource][update.pattern];
    else merged.rules[update.resource][update.pattern] = update.decision;
  }
  return merged;
};
const emptyDocument = () => ({
  preferences: { approval_mode: "always_ask" },
  rules: { origin: {}, download: {}, upload: {}, full_cdp: {} },
});
class AuthenticatedDesktopFetchError extends Error {
  constructor(status) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const BrowserSettingsSync = Function(
  "createTaggedLogger",
  "watch",
  "dirname",
  "basename",
  "settingsDiff",
  "mergeIntoSnapshot",
  "remoteToLocalDocument",
  "isSamePrincipal",
  "AuthenticatedDesktopFetchError",
  "SYNC_INTERVAL_MS",
  "FILE_CHANGE_DEBOUNCE_MS",
  `${classSource}; return BrowserSettingsSync;`,
)(
  () => ({ warning() {} }),
  () => { throw new Error("watcher should not start without start()"); },
  () => "/tmp",
  () => "config.toml",
  settingsDiff,
  mergeIntoSnapshot,
  emptyDocument,
  (left, right) => left.accountId === right.accountId && left.userId === right.userId,
  AuthenticatedDesktopFetchError,
  60_000,
  200,
);

const principal = { accountId: "account-1", userId: "user-1" };
const initial = {
  revision: 1,
  preferences: { approval_mode: "always_ask" },
  rules: { origin: {}, download: {}, upload: {}, full_cdp: {} },
};
let local = null;
let changed = 0;
const apiCalls = [];
const sync = new BrowserSettingsSync({
  configFile: {
    path: "/tmp/config.toml",
    async read() { return local == null ? null : clone(local); },
    async write(value) { local = clone(value); },
  },
  createApi(expectedPrincipal) {
    equal(expectedPrincipal, principal);
    return {
      async read() { apiCalls.push("read"); return clone(initial); },
      async update(revision, changes) {
        apiCalls.push({ revision, changes });
        return {
          ...clone(initial),
          revision: revision + 1,
          preferences: { ...initial.preferences, ...changes.preferences },
        };
      },
    };
  },
  async getAuthenticatedPrincipal() { return principal; },
  isEnabled: () => true,
  onSettingsChanged: () => { changed += 1; },
});

equal(await sync.update({ preferences: { approval_mode: "never_ask" } }), true);
equal(apiCalls[0], "read");
equal(apiCalls[1], {
  revision: 1,
  changes: { preferences: { approval_mode: "never_ask" } },
});
equal(local.preferences.approval_mode, "never_ask");
equal(sync.projection.snapshot.revision, 2);
equal(changed, 2);

let accountChangeRan = false;
equal(
  await sync.update(async () => null, async () => { accountChangeRan = true; }),
  true,
);
equal(accountChangeRan, true);

sync.dispose();
equal(sync.disposed, true);
equal(sync.scope, null);
await assert.rejects(sync.update({ preferences: {} }), (error) => error?.name === "AbortError");
assertions += 1;

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/browser-use/origin-state.js")'), true);
equal(main.includes("var _ke = BrowserSettingsSync;"), false);
equal(/\b_ke\b/.test(main), false);

const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(windowContext.includes("this.browserSettingsSync = new BrowserSettingsSync({"), true);
equal(windowContext.includes("this.browserSettingsSync.start()"), true);

console.log(`${assertions} main Browser settings sync owner assertions passed`);
