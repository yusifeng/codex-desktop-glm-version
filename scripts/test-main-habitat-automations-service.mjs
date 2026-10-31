import assert from "node:assert/strict";
import fs from "node:fs";
import { createHabitatAutomationsServiceClass } from "../src/main/main-app/automations/habitat-automations-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const schema = new Proxy(
  {
    parse: (value) => value,
    safeParse: (value) => ({ success: true, data: value }),
  },
  {
    get(target, property) {
      if (property in target) return target[property];
      return () => schema;
    },
  },
);

class DisposableBase {}
const adoptedOwners = [];
const runtime = {
  Uf: DisposableBase,
  wf: () => schema,
  vf: () => schema,
  bf: () => schema,
  Of: () => schema,
  Cf: () => schema,
  gf: () => schema,
  Pf: () => schema,
  hf: () => schema,
  df: () => schema,
  gd: schema,
  _d: schema,
  Ar: () => [],
  Br: (...args) => adoptedOwners.push(args),
  Dr: () => false,
  Mr: () => [],
  Or: () => false,
  yr: (input, cwds) => ({ ...input, cwds, source: "local-create" }),
  Vr: (input, cwds) =>
    input.fail ? null : { ...input, cwds, source: "local-update" },
  xr: (id) => ({ id }),
  br: () => "deleted",
  bd: () => false,
  Ns: (value) => value,
};
const stateKeys = { N: "installation", M: "migration-status" };
const HabitatAutomationsService = createHabitatAutomationsServiceClass({
  automationRuntime: runtime,
  desktopApiRuntime: {
    ...stateKeys,
    vt: async () => {
      throw new Error("unexpected request");
    },
  },
  createLogger: () => () => ({ warning() {} }),
  defaultFetch: async () => {
    throw new Error("unexpected fetch");
  },
  randomUUID: () => "installation-id",
});

const values = new Map();
const globalState = {
  get: (key) => values.get(key),
  set: (key, value) => values.set(key, value),
  update: (key, update) => values.set(key, update(values.get(key))),
  flushOrThrow: async () => {},
};
let principal = null;
const appServerClient = { getAuthenticatedPrincipal: async () => principal };
const service = new HabitatAutomationsService(
  appServerClient,
  {},
  globalState,
  () => true,
);

equal(service instanceof DisposableBase, true);
equal((await service.getState()).status, "unavailable");
principal = { accountId: "account", userId: "user" };
equal((await service.getState()).status, "eligible");
values.set(stateKeys.M, { "account:user": "declined" });
equal((await service.getState()).status, "declined");
equal(await service.create({ kind: "heartbeat", name: "new" }), {
  kind: "heartbeat",
  name: "new",
  cwds: [],
  source: "local-create",
});
equal(
  (await service.update({ id: "one", kind: "heartbeat" })).source,
  "local-update",
);
equal(await service.delete("one"), { item: { id: "one" }, status: "deleted" });

values.set(stateKeys.N, "installation-id");
values.set(stateKeys.M, { "account:user:installation-id": "complete" });
service.handlePrincipalChanged(principal);
equal(service.getMigrationOwner(), { accountId: "account", userId: "user" });
equal(adoptedOwners.at(-1), [
  { accountId: "account", userId: "user", installationId: "installation-id" },
  "complete",
]);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("AOe = createHabitatAutomationsServiceClass({"), true);
equal(main.includes("AOe = class"), false);
equal(main.includes("o = new AOe("), true);
equal(main.includes("getHabitatAutomationsService().sync()"), true);

console.log(`${assertions} main habitat automations service assertions passed`);
