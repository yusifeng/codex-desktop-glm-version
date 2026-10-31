import assert from "node:assert/strict";
import fs from "node:fs";
import { createAppServerTransportPolicy } from "../src/main/main-app/app-server/transport-policy.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createPolicy(environment = {}) {
  return createAppServerTransportPolicy({
    environment,
    isCloudHostId: (id) => id === "cloud",
    resolveHostWebsocketUrl: (hostConfig) => `ws://${hostConfig.hostname}:9000`,
  });
}

{
  const policy = createPolicy({ CODEX_APP_SERVER_FORCE_CLI: "1" });
  equal(policy.resolveAppServerWebsocketUrl({ id: "cloud", websocket_url: "wss://cloud.example" }), null);
  equal(policy.resolveAppServerWebsocketUrl({ id: "remote", hostname: "remote.example" }), null);
}

{
  const policy = createPolicy();
  equal(
    policy.resolveAppServerWebsocketUrl({ id: "cloud", websocket_url: "wss://cloud.example" }),
    "wss://cloud.example",
  );
  equal(policy.resolveAppServerWebsocketUrl({ id: "cloud" }), null);
  equal(
    policy.resolveAppServerWebsocketUrl({ id: "remote", hostname: "remote.example" }),
    "ws://remote.example:9000",
  );
}

{
  const policy = createPolicy();
  for (const url of [
    "ws://localhost:9000",
    "ws://127.0.0.1:9000",
    "ws://[::1]:9000",
  ]) {
    equal(policy.resolveAppServerSocksProxyUrl({ id: "remote" }, url), undefined);
    equal(policy.resolveAppServerSocksProxyUrl({ id: "cloud" }, url), undefined);
  }
  equal(
    policy.resolveAppServerSocksProxyUrl({ id: "remote" }, "wss://remote.example/ws"),
    "socks5h://127.0.0.1:1080",
  );
  equal(
    policy.resolveAppServerSocksProxyUrl(
      { id: "cloud" },
      "wss://durable.internal.api.openai.org/ws",
    ),
    "socks5h://127.0.0.1:1080",
  );
  equal(
    policy.resolveAppServerSocksProxyUrl({ id: "cloud" }, "wss://api.openai.com/ws"),
    undefined,
  );
  assert.throws(
    () => policy.resolveAppServerSocksProxyUrl({ id: "remote" }, "not a url"),
    /Invalid URL/,
  );
  assertions += 1;
}

{
  const policy = createAppServerTransportPolicy({
    environment: {},
    isCloudHostId: () => false,
    resolveHostWebsocketUrl: () => "ws://host",
    socksProxyUrl: "socks5h://custom:9999",
  });
  equal(
    policy.resolveAppServerSocksProxyUrl({ id: "remote" }, "wss://remote.example"),
    "socks5h://custom:9999",
  );
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("resolveAppServerWebsocketUrl: W5"), true);
equal(main.includes("resolveAppServerSocksProxyUrl: Ynt"), true);
equal(main.includes("resolveWebsocketUrl: W5"), true);
equal(main.includes("resolveSocksProxyUrl: Ynt"), true);
equal(main.includes("function W5("), false);
equal(main.includes("function Ynt("), false);
equal(main.includes("U5 = `socks5h://127.0.0.1:1080`"), false);

console.log(`${assertions} main app-server transport policy assertions passed`);
