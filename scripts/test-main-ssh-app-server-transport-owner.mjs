import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/app-server/transports.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const classNode = ast.body.find(
  (node) =>
    node.type === "ClassDeclaration" && node.id?.name === "AppServerTransportSshWebsocket",
);
assert.ok(classNode, "SSH app-server transport class should survive TypeScript transformation");
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const AppServerTransportSshWebsocket = Function(
  "createTaggedLogger",
  `${classSource}; return AppServerTransportSshWebsocket;`,
)(() => ({ debug() {}, info() {}, warning() {}, error() {} }));

let assertions = 1;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const transport = new AppServerTransportSshWebsocket({
  sshConnection: { host: "example.test" },
});
equal(transport.kind, "websocket");
equal(transport.supportsReconnect(), true);
transport.hasConnected = true;
transport.onAppServerInitializationFailed();
equal(transport.hasConnected, false);
let destroyed = 0;
transport.proxyStreams.add({ destroy: () => { destroyed += 1; } });
transport.proxyStreams.add({ destroy: () => { destroyed += 1; } });
transport.dispose();
equal(destroyed, 2);
equal(transport.proxyStreams.size, 0);

const members = classNode.body.body
  .map((member) => member.key?.name ?? member.key?.value)
  .filter(Boolean);
equal(members.length, 29);
equal(members.includes("ensureRemoteAppServer"), true);
equal(members.includes("runWithSshStartupGate"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/app-server/transports.js")'), true);
equal(main.includes("AppServerTransportWslStdio,"), true);
equal(main.includes("var VE = AppServerTransportSshWebsocket"), false);
equal(main.includes("RemoteCodexInstaller: AppServerTransportSshWebsocket"), true);
equal(main.includes("SshWebsocketTransport: AppServerTransportSshWebsocket"), true);
equal(main.includes("RemoteStdioTransport: AppServerTransportWslStdio"), true);
equal(main.includes("resolveSshWebsocketConfig: createTransport"), true);
equal(main.includes("buildWslCodexCommand: wslAppServerArgs"), true);
equal(main.includes("z = loadShellEnvForStartup()"), true);
equal(main.includes("var QDe = class"), false);

console.log(`${assertions} main SSH app-server transport owner assertions passed`);
