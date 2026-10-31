import assert from "node:assert/strict";
import fs from "node:fs";
import { createGithubRequestClientFactory } from "../src/main/main-app/github/github-request-client.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class RequestClient {
  constructor(handler) { this.handler = handler; }
  invoke(...args) { return this.handler(...args); }
}
const createGithubRequestClient = createGithubRequestClientFactory({ RequestClient });

function createHarness() {
  const getterCalls = [];
  const sends = [];
  const configs = {
    local: { id: "local", kind: "local" },
    remote: { id: "remote", kind: "ssh" },
    cloud: { id: "cloud", kind: "cloud" },
  };
  const client = createGithubRequestClient(
    async (request) => { sends.push(request); return { ok: true, request }; },
    (hostId) => {
      getterCalls.push(hostId);
      return configs[hostId ?? "local"];
    },
  );
  return { client, configs, getterCalls, sends };
}

{
  const harness = createHarness();
  const signal = new AbortController().signal;
  const params = {
    repos: [
      { hostId: "remote", owner: "one", repo: "repo" },
      { hostId: "cloud", owner: "two", repo: "repo" },
      { hostId: "remote", owner: "three", repo: "repo" },
      { hostId: "local", owner: "four", repo: "repo" },
    ],
  };
  const result = await harness.client.invoke("listPullRequests", params, "sidebar", signal);
  equal(result.ok, true);
  equal(harness.getterCalls, [undefined, "remote", "cloud", "remote", "local"]);
  equal(harness.sends.length, 1);
  equal(harness.sends[0].method, "github-request");
  equal(harness.sends[0].params.request, { method: "listPullRequests", params });
  equal(harness.sends[0].params.hostConfig, harness.configs.local);
  equal(harness.sends[0].params.hostConfigs, [
    harness.configs.local,
    harness.configs.remote,
    harness.configs.cloud,
  ]);
  equal(harness.sends[0].params.operationSource, "sidebar");
  equal(harness.sends[0].signal, signal);
}

{
  const harness = createHarness();
  const params = { account: { hostId: "cloud", login: "user" } };
  await harness.client.invoke("readAccount", params, "settings", null);
  equal(harness.getterCalls, [undefined, "cloud"]);
  equal(harness.sends[0].params.hostConfigs, [harness.configs.local, harness.configs.cloud]);
}

{
  const harness = createHarness();
  const params = { hostId: "remote", issueNumber: 7 };
  await harness.client.invoke("readIssue", params, "thread", undefined);
  equal(harness.getterCalls, [undefined, "remote"]);
  equal(harness.sends[0].params.request.params, params);
}

{
  const expectedError = Error("unknown host");
  const client = createGithubRequestClient(
    async () => { throw Error("must not send"); },
    (hostId) => {
      if (hostId == null) return { id: "local" };
      throw expectedError;
    },
  );
  await assert.rejects(
    client.invoke("readIssue", { hostId: "missing" }, "thread", undefined),
    expectedError,
  );
  assertions += 1;
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Znt = createGithubRequestClientFactory({ RequestClient: n.E })"), true);
equal(main.includes("github: Znt(this.options.requestGitWorker"), true);
equal(main.includes("function Znt("), false);
equal(main.includes("method: `github-request`"), false);

console.log(`${assertions} main GitHub request client assertions passed`);
