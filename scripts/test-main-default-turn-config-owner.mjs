import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/start-config.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const tierCalls = [];
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared")
      return { Wa: (model, tier) => (tierCalls.push([model, tier]), tier ?? model?.defaultServiceTier ?? null) };
    if (specifier === "../workspace/config")
      return {
        mergeThreadProfiles: (config) => config.profile == null
          ? config
          : { ...config, ...(config.profiles?.[config.profile] ?? {}) },
      };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const { buildDefaultTurnConfig, wye } = module.exports;
equal(wye, buildDefaultTurnConfig);

const readCalls = [];
const writeCalls = [];
const errors = [];
let assertCount = 0;
let changed = 0;
const manager = {
  requestClient: {
    hostId: "local",
    async sendRequest(method, params, options) {
      readCalls.push([method, params, options]);
      if (method === "configRequirements/read") return { requirements: { featureRequirements: { fast_mode: true } } };
      if (method === "config/read") return {
        config: { profile: "work", profiles: { work: { service_tier: "fast" } } },
      };
      if (method === "model/list") return { data: [] };
      throw new Error(`unexpected read ${method}`);
    },
  },
  logger: { error: (...args) => errors.push(args) },
  getHostId: () => "local",
  getAccount: async () => ({ account: { type: "chatgpt" } }),
  getAuthMethod: async () => "chatgpt",
  sendRequest(method, params) {
    writeCalls.push([method, params]);
    return Promise.resolve({ status: "ok" });
  },
};
const options = {
  runtime: { isCopilotApiAvailable: async () => false },
  storage: { readGlobalState: async () => false },
};
const owner = buildDefaultTurnConfig(manager, options, () => { assertCount += 1; }, () => { changed += 1; });
equal(await owner.readServiceTier("model-1"), "fast");
equal(readCalls.map(([method]) => method), ["configRequirements/read", "config/read"]);
equal(tierCalls, [[null, "fast"]]);
equal(assertCount, 1);
equal(errors, []);

const writes = [deferred(), deferred()];
writeCalls.length = 0;
manager.sendRequest = (method, params) => {
  writeCalls.push([method, params]);
  return writes[writeCalls.length - 1].promise;
};
const first = owner.writeServiceTier("fast", null);
const second = owner.writeServiceTier(null, "work");
await Promise.resolve();
equal(writeCalls.length, 1);
equal(writeCalls[0], ["config/batchWrite", {
  edits: [{ keyPath: "service_tier", value: "fast", mergeStrategy: "upsert" }],
  filePath: null,
  expectedVersion: null,
  reloadUserConfig: true,
}]);
writes[0].resolve({ status: "first" });
await first;
await Promise.resolve();
equal(writeCalls.length, 2);
equal(writeCalls[1][1].edits, [
  { keyPath: "profiles.work.service_tier", value: "default", mergeStrategy: "upsert" },
]);
equal(changed, 0);
writes[1].resolve({ status: "second" });
equal(await second, { status: "second" });
equal(changed, 1);

manager.sendRequest = (method, params) => (writeCalls.push([method, params]), Promise.resolve({ status: "model" }));
await owner.writeModel("gpt", "high", "work");
equal(writeCalls.at(-1)[1].edits, [
  { keyPath: "profiles.work.model", value: "gpt", mergeStrategy: "upsert" },
  { keyPath: "profiles.work.model_reasoning_effort", value: "high", mergeStrategy: "upsert" },
]);

const copilotOwner = buildDefaultTurnConfig(
  manager,
  {
    runtime: { isCopilotApiAvailable: async () => true },
    storage: { readGlobalState: async () => true },
  },
  () => {},
  () => {},
);
const readCount = readCalls.length;
equal(await copilotOwner.readServiceTier(null), null);
equal(readCalls.length, readCount);

const managerSource = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(managerSource.includes("wye as buildDefaultTurnConfig"), true);
equal(managerSource.includes("this.defaultTurnConfig = buildDefaultTurnConfig("), true);
const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("function wye("), false);
equal(source.includes('Wa as resolveModelServiceTier'), true);
equal(source.includes('"configRequirements/read"'), true);
equal(source.includes('mergeStrategy: "upsert"'), true);

console.log(`${assertions} main default turn config owner assertions passed`);
