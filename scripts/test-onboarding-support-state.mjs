import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadModule(name, mocks) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({
              contents: mocks[importPath] ?? "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  const url = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
  return import(url);
}

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const mailProvider = await loadModule("onboarding-mail-provider", {
  "app-initial": `
    export const Wln = plan => plan === "enterprise-microsoft";
    export const eun = (scope, key, create) => ({ scope, key, create });
  `,
  "app-shared": `
    export const ZI = Symbol("scope");
    export const $O = { FIVE_MINUTES: 300000 };
  `,
});
mailProvider.o();
check(
  mailProvider.n("Person@Example.COM") === "example.com",
  "normalizes domains",
);
check(
  mailProvider.n("alias@team@example.com") === "example.com",
  "uses the final at sign",
);
check(mailProvider.n("missing-domain@") === null, "rejects empty domains");
check(
  mailProvider.r({ debugOverride: "google" }) === "google",
  "debug provider wins",
);
check(
  mailProvider.r({
    detectedProvider: "microsoft",
    emailDomain: "example.com",
  }) === "microsoft",
  "detected provider wins",
);
check(
  mailProvider.r({ emailDomain: "example.com", isError: false }) === null,
  "waits for domain detection",
);
check(
  mailProvider.r({ emailDomain: "example.com", isError: true }) === "other",
  "detection failures fall back",
);
check(
  mailProvider.a("other", "enterprise-microsoft") === "microsoft",
  "maps Microsoft plans",
);
check(
  mailProvider.a("other", "plus") === "google",
  "maps other plans to Google",
);
check(
  mailProvider.a("google", "plus") === "google",
  "preserves known providers",
);
check(
  mailProvider.i("gmail", "microsoft") === "outlook-email",
  "maps mail plugin IDs",
);
check(mailProvider.i("slack", "microsoft") === "teams", "maps chat plugin IDs");
check(
  mailProvider.i("linear", "microsoft") === "linear",
  "preserves unknown plugin IDs",
);
check(
  mailProvider.t.create("example.com").staleTime === 300000 &&
    mailProvider.t.create(null).enabled === false,
  "builds provider query options",
);

const entrypoint = await loadModule("onboarding-entrypoint", {
  "app-initial": `
    export const dun = (key, initial) => ({ key, initial });
    export const uun = () => {};
  `,
});
entrypoint.t();
check(
  entrypoint.n.key === "electron:onboarding-login-entrypoint" &&
    entrypoint.n.initial === undefined,
  "creates the persisted login entrypoint signal",
);

const pending = await loadModule("pending-onboarding", {
  "app-initial": `
    export const mun = Symbol("account");
    export const _un = Symbol("user");
    export const Ltn = Symbol("thread");
  `,
  "app-shared": `
    export const ZI = Symbol("scope");
    export const pZ = (_scope, initial) => ({ initial });
    export const rZ = (_scope, resolver) => ({ resolver });
  `,
});
pending.t();
check(pending.r.initial instanceof Map, "creates the pending onboarding map");
const record = { accountId: "account-1", userId: "user-1", step: "profile" };
pending.r.initial.set("thread-1", record);
const values = new Map([[pending.r, pending.r.initial]]);
const get = (signal, key) => {
  if (signal.description === "account") return "account-1";
  if (signal.description === "user") return "user-1";
  if (signal.description === "thread") return key === "thread-1" ? {} : null;
  return values.get(signal);
};
check(
  pending.n.resolver("thread-1", { get }) === record,
  "returns matching pending onboarding",
);
check(pending.n.resolver(null, { get }) === null, "rejects missing thread IDs");
check(
  pending.n.resolver("missing", { get }) === null,
  "rejects missing pending records",
);
const wrongAccountGet = (signal, key) =>
  signal.description === "account" ? "account-2" : get(signal, key);
check(
  pending.n.resolver("thread-1", { get: wrongAccountGet }) === null,
  "isolates pending state by account",
);

assert.equal(assertions, 20);
console.log(`${assertions} onboarding support-state assertions passed`);
