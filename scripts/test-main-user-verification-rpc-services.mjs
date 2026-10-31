import assert from "node:assert/strict";
import fs from "node:fs";
import { createUserVerificationRpcServices } from "../src/main/main-app/user-verification/rpc-services.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const calls = [];
const underlyingAttempt = {
  async wait() { calls.push(["wait"]); return { status: "pending" }; },
  async accept() { calls.push(["accept"]); return { status: "accepted" }; },
  cancel() { calls.push(["cancel"]); },
};
const connection = {
  userVerification: {
    begin(conversationId, requestId) {
      calls.push(["begin", conversationId, requestId]);
      return underlyingAttempt;
    },
  },
};
const { UserVerificationAttempt, UserVerificationService } =
  createUserVerificationRpcServices({ RpcHandlerBase: class {} });
const service = new UserVerificationService((hostId) => {
  calls.push(["getConnection", hostId]);
  return connection;
});

const attempt = await service.begin({
  hostId: "remote",
  conversationId: "thread-1",
  requestId: "request-1",
});
equal(attempt instanceof UserVerificationAttempt, true);
equal(calls.slice(0, 2), [
  ["getConnection", "remote"],
  ["begin", "thread-1", "request-1"],
]);
equal(await attempt.wait(), { status: "pending" });
equal(calls.at(-1), ["wait"]);
equal(await attempt.accept(), { status: "accepted" });
equal(calls.at(-1), ["accept"]);
equal(attempt.cancel(), undefined);
equal(calls.at(-1), ["cancel"]);
attempt[Symbol.dispose]();
equal(calls.filter(([name]) => name === "cancel").length, 2);

const expectedError = Error("host missing");
const failedService = new UserVerificationService(() => { throw expectedError; });
await assert.rejects(
  failedService.begin({ hostId: "missing", conversationId: "thread", requestId: "request" }),
  expectedError,
);
assertions += 1;

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("UserVerificationService: znt"), true);
equal(main.includes("UserVerificationAttempt: Bnt"), true);
equal(main.includes("new znt((e) => this.appServerConnectionRegistry.getConnection(e))"), true);
equal(main.includes("znt = class"), false);
equal(main.includes("Bnt = class"), false);

console.log(`${assertions} main user-verification RPC service assertions passed`);
