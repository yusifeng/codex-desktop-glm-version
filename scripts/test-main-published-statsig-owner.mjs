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
  new URL("../src/main/main-app/account/statsig-adapter.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "PublishedStatsig",
);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 19);

class EventEmitterBase {}
class DisposableBag {
  callbacks = [];
  add(callback) { this.callbacks.push(callback); }
  dispose() { for (const callback of this.callbacks.splice(0)) callback(); }
}
const publicationMatchesIdentity = (publication, identity) =>
  identity.principal == null
    ? identity.authMethod == null
      ? identity.unauthenticatedStableId != null &&
        publication.userId == null &&
        publication.accountId == null &&
        publication.authMethod == null &&
        publication.stableId === identity.unauthenticatedStableId
      : identity.authMethod !== "chatgpt" &&
        identity.authMethod !== "chatgptAuthTokens" &&
        publication.accountId == null &&
        publication.authMethod === identity.authMethod
    : publication.userId === identity.principal.userId &&
      publication.accountId === identity.principal.accountId;
const publicationMatchesUser = (publication, user, identity) =>
  (user.userID ?? null) === publication.userId &&
  (user.customIDs?.account_id ?? null) === publication.accountId &&
  (user.custom?.auth_method ?? null) === publication.authMethod &&
  (user.customIDs?.stableID ?? null) === publication.stableId &&
  publicationMatchesIdentity(publication, identity);
const defaultToolCatalog = () => ({ restrictedGates: {}, gates: {}, configs: {} });

const classSource = transpiled.code.slice(classNode.start, classNode.end);
const PublishedStatsig = Function(
  "EventEmitterBase",
  "disposableBag",
  "publicationMatchesIdentity",
  "publicationMatchesUser",
  "defaultToolCatalog",
  "composeDefaultEnableFeatures",
  "statsigClientOptionsSchema",
  "createOverrideAdapter",
  "StatsigClient",
  `${classSource}; return PublishedStatsig;`,
)(
  EventEmitterBase,
  DisposableBag,
  publicationMatchesIdentity,
  publicationMatchesUser,
  defaultToolCatalog,
  (defaults) => defaults,
  { parse: JSON.parse },
  () => ({}),
  class {},
);

const publication = {
  userId: "user-1",
  accountId: "account-1",
  authMethod: "chatgpt",
  stableId: null,
  sdkKey: "client-key",
  payload: null,
  executionValues: {},
  defaultEnableFeatures: {},
};
let latest = publication;
let repositorySubscriber;
let identitySubscriber;
let repositoryDisposed = 0;
let identityDisposed = 0;
const owner = new PublishedStatsig(
  {
    get: (key) => key === "statsig_evaluations" ? latest : null,
    addSubscriber(callback) {
      repositorySubscriber = callback;
      return () => { repositoryDisposed += 1; };
    },
  },
  async () => ({
    principal: { userId: "user-1", accountId: "account-1" },
    authMethod: "chatgpt",
    unauthenticatedStableId: null,
  }),
  (callback) => {
    identitySubscriber = callback;
    return () => { identityDisposed += 1; };
  },
);

equal(owner.publications, [publication]);
const assignments = await owner.readExecutionAssignments();
equal(assignments.identity, {
  userId: "user-1",
  accountId: "account-1",
  authMethod: "chatgpt",
  stableId: null,
});
equal(assignments.values.experimentalFeatureGates, {
  mcp20260728: false,
  codexAppsMcp20260728: false,
  curatedRemoteMarketplace: false,
  backgroundPaginatedRolloutMigration: false,
  localThreadStoreCompression: false,
  apiKeyModelDiscovery: false,
});
equal(await owner.hasReadyExecutionAssignments(), true);

let changes = 0;
const unsubscribe = owner.onDidChange(() => { changes += 1; });
latest = { ...publication, payload: undefined };
repositorySubscriber("unrelated");
equal(changes, 0);
repositorySubscriber("statsig_evaluations");
equal(changes, 1);
equal(owner.publications[0], latest);
equal(await owner.readExecutionAssignments(), null);

identitySubscriber();
equal(owner.identityEpoch, 1);
equal(changes, 2);
unsubscribe();
identitySubscriber();
equal(changes, 2);

let shutdown = 0;
owner.client = { shutdown: () => { shutdown += 1; } };
owner.publication = publication;
owner.dispose();
equal(owner.disposed, true);
equal(owner.publications, []);
equal(owner.client, null);
equal(shutdown, 1);
equal(repositoryDisposed, 1);
equal(identityDisposed, 1);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes('const { PublishedStatsig } = require("./main-app/account/statsig-adapter.js");'),
  true,
);
equal(main.includes("var STe = PublishedStatsig;"), true);
equal(main.includes("STe = class"), false);
equal(main.includes("this.publishedStatsig = new STe("), false);

const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(windowContext.includes("this.publishedStatsig = new STe("), true);
equal(windowContext.includes("this.disposables.add(this.publishedStatsig)"), true);

console.log(`${assertions} main Published Statsig owner assertions passed`);
