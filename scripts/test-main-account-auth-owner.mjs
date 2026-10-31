import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

const entry = new URL("../src/main/main-app/auth/account-auth.ts", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [{
    name: "account-auth-shared-double",
    setup(build) {
      build.onResolve({ filter: /^@chunk\/shared$/ }, () => ({
        path: "shared-double",
        namespace: "test-double",
      }));
      build.onLoad({ filter: /.*/, namespace: "test-double" }, () => ({
        loader: "js",
        contents: `
          export const Ac = () => {
            let resolve, reject;
            const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
            return { promise, resolve, reject };
          };
          export const jc = () => false;
        `,
      }));
    },
  }],
});
const { AccountAuthService } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const requests = [];
let lifecycleListener;
let lifecycleRemoved = 0;
const requestClient = {
  hostId: "local",
  addRequestLifecycleListener(listener) {
    lifecycleListener = listener;
    return () => { lifecycleRemoved += 1; };
  },
  async sendRequest(method, params) {
    requests.push([method, params]);
    if (params.type === "chatgpt")
      return { type: "chatgpt", loginId: "login-1", authUrl: "https://example.test/auth" };
    return { type: "apiKey" };
  },
};
const auth = new AccountAuthService(
  requestClient,
  {
    async startRemoteChatGptLoginPortForward() {},
    async stopRemoteChatGptLoginPortForward() {},
  },
  { info() {}, debug() {}, warning() {} },
  false,
  () => () => undefined,
);
equal(typeof lifecycleListener, "function");

await auth.loginWithApiKey("secret");
equal(requests[0], ["account/login/start", { type: "apiKey", apiKey: "secret" }]);

const controller = new AbortController();
const login = await auth.loginWithChatGPT(controller, { useStreamlinedLogin: true });
equal(login.loginId, "login-1");
equal(login.authUrl, "https://example.test/auth");
equal(requests[1], [
  "account/login/start",
  { type: "chatgpt", codexStreamlinedLogin: true },
]);
auth.handleNotification({
  method: "account/login/completed",
  params: { loginId: "login-1", success: true, onboardingEntrypoint: "desktop" },
});
equal(await login.completion, {
  success: true,
  error: undefined,
  onboardingEntrypoint: "desktop",
});

const statuses = [];
auth.addAuthStatusCallback((status) => statuses.push(status));
auth.handleNotification({ method: "account/updated", params: { authMode: "chatgpt" } });
auth.logoutWithoutServer();
equal(statuses, [{ authMethod: "chatgpt" }, { authMethod: null }]);

auth.dispose();
equal(lifecycleRemoved, 1);

const accountSource = fs.readFileSync(
  new URL("../src/main/main-app/auth/account-auth.ts", import.meta.url),
  "utf8",
);
equal(accountSource.includes("export class AccountAuthService"), true);
equal(accountSource.includes("export { AccountAuthService as Khe }"), true);
equal(accountSource.includes("async loginWithChatGPTDeviceCode("), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("Khe = class"), false);
const managerSource = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(managerSource.includes('import { Khe as AccountAuthService } from "../auth/account-auth"'), true);

console.log(`${assertions} main account auth owner assertions passed`);
