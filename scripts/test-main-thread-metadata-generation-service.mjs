import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadMetadataGenerationServiceClass } from "../src/main/main-app/threads/thread-metadata-generation-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, reject, resolve };
};
const flush = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

function createHarness({ titleImpl, descriptionImpl, summaryImpl } = {}) {
  const calls = [];
  const warnings = [];
  const appServerClient = { name: "app-server" };
  const ThreadMetadataGenerationService = createThreadMetadataGenerationServiceClass({
    RpcHandlerBase: class {},
    createLogger: (name) => ({
      warning(message, details) { warnings.push([name, message, details]); },
    }),
    async getFeatureConfig(statsig) {
      calls.push(["featureConfig", statsig]);
      return { ephemeralGenerationModel: "ephemeral-model" };
    },
    async generateTitle(options) {
      calls.push(["title", options]);
      return titleImpl ? titleImpl(options) : "Generated title";
    },
    async generateDescription(options) {
      calls.push(["description", options]);
      return descriptionImpl ? descriptionImpl(options) : "Generated description";
    },
    async generateSummary(options) {
      calls.push(["summary", options]);
      return summaryImpl ? summaryImpl(options) : { text: "Generated summary" };
    },
  });
  const registry = {
    getConnection(hostId) {
      calls.push(["connection", hostId]);
      return appServerClient;
    },
  };
  const statsig = { name: "statsig" };
  const service = new ThreadMetadataGenerationService(registry, statsig);
  return { appServerClient, calls, service, statsig, ThreadMetadataGenerationService, warnings };
}

{
  const harness = createHarness();
  equal(
    await harness.service.generateTitle({
      hostId: "local",
      prompt: "prompt",
      cwd: "/repo",
      readOnlyAppToolAllowlist: ["calendar"],
      serviceName: "title-service",
    }),
    "Generated title",
  );
  const options = harness.calls.find(([name]) => name === "title")[1];
  equal(options.model, "ephemeral-model");
  equal(options.prompt, "prompt");
  equal(options.cwd, "/repo");
  equal(options.serviceTier, null);
  equal(options.readOnlyAppToolAllowlist, ["calendar"]);
  equal(options.serviceName, "title-service");
  equal(options.appServerClient, harness.appServerClient);
}

{
  const expectedError = Error("title failed");
  const harness = createHarness({ titleImpl: async () => { throw expectedError; } });
  equal(await harness.service.generateTitle({ hostId: "local" }), null);
  equal(harness.warnings[0][1], "Failed to generate thread title");
  equal(harness.warnings[0][2].sensitive.error, expectedError);
}

{
  const harness = createHarness();
  equal(
    await harness.service.generateDescription({
      hostId: "remote",
      threadId: "thread-1",
      title: "Title",
      cwd: "/repo",
      serviceName: "description-service",
    }),
    "Generated description",
  );
  const options = harness.calls.find(([name]) => name === "description")[1];
  equal(options.model, "ephemeral-model");
  equal(options.sourceThreadId, "thread-1");
  equal(options.title, "Title");
  equal(options.serviceTier, null);
  equal(options.serviceName, "description-service");
  const expectedError = Error("description failed");
  const failed = createHarness({ descriptionImpl: async () => { throw expectedError; } });
  await assert.rejects(failed.service.generateDescription({ hostId: "local" }), expectedError);
  assertions += 1;
  equal(failed.warnings, []);
}

const summaryInput = {
  hostId: "local",
  threadId: "thread-1",
  title: "Title",
  previousUserMessage: "previous user",
  previousAssistantMessage: "previous assistant",
  latestMessage: "latest",
  phase: "active",
  cwd: "/repo",
  includeCompactSummary: true,
  serviceName: "summary-service",
};

{
  const harness = createHarness();
  equal(await harness.service.generateSummary(summaryInput), { text: "Generated summary" });
  const options = harness.calls.find(([name]) => name === "summary")[1];
  equal(options.model, "ephemeral-model");
  equal(options.title, "Title");
  equal(options.previousUserMessage, "previous user");
  equal(options.previousAssistantMessage, "previous assistant");
  equal(options.latestMessage, "latest");
  equal(options.phase, "active");
  equal(options.cwd, "/repo");
  equal(options.includeCompactSummary, true);
  equal(options.serviceName, "summary-service");
  equal(options.signal.aborted, false);
  equal(harness.service.summaryRequests.size, 0);
}

{
  const requests = [];
  const harness = createHarness({
    summaryImpl(options) {
      const result = deferred();
      requests.push({ ...result, signal: options.signal });
      return result.promise;
    },
  });
  const first = harness.service.generateSummary(summaryInput);
  await flush();
  const second = harness.service.generateSummary(summaryInput);
  await flush();
  equal(requests.length, 2);
  equal(requests[0].signal.aborted, true);
  equal(requests[1].signal.aborted, false);
  requests[0].resolve({ text: "stale" });
  requests[1].resolve({ text: "fresh" });
  equal(await first, null);
  equal(await second, { text: "fresh" });
  equal(harness.service.summaryRequests.size, 0);
  equal(harness.warnings, []);
}

{
  const expectedError = Error("summary failed");
  const harness = createHarness({ summaryImpl: async () => { throw expectedError; } });
  equal(await harness.service.generateSummary(summaryInput), null);
  equal(harness.warnings[0][1], "Failed to generate thread turn summary");
  equal(harness.warnings[0][2].sensitive.error, expectedError);
}

{
  const request = deferred();
  let signal;
  const harness = createHarness({
    summaryImpl(options) {
      signal = options.signal;
      return request.promise;
    },
  });
  const pending = harness.service.generateSummary(summaryInput);
  await flush();
  equal(harness.service.summaryRequests.size, 1);
  harness.ThreadMetadataGenerationService.dispose(harness.service);
  equal(signal.aborted, true);
  equal(harness.service.summaryRequests.size, 0);
  request.reject(Error("aborted"));
  equal(await pending, null);
  equal(harness.warnings, []);
  equal(await harness.service.generateSummary(summaryInput), null);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("I5 = createThreadMetadataGenerationServiceClass({"), true);
equal(main.includes("new I5("), true);
equal(main.includes("I5.dispose(this.threadMetadataGeneration)"), true);
equal(main.includes("I5 = class"), false);

console.log(`${assertions} main thread metadata generation service assertions passed`);
