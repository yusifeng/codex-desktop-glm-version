import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/remote/ssh-connection-discovery.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createSshConnectionDiscovery } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

const DIRECTIVE = 1;
const directive = (param, value, config) => ({
  type: DIRECTIVE,
  param,
  value,
  ...(config == null ? {} : { config }),
});

function fixture() {
  const files = new Map();
  const globResults = new Map();
  const logs = [];
  const commands = [];
  let commandResult = { stdout: "[]", stderr: "", code: 0 };
  const dependencies = {
    fs: {
      existsSync: (value) => files.has(value),
      readFileSync: (value) => files.get(value),
      globSync: (pattern) => globResults.get(pattern) ?? [],
      statSync: (value) => ({ isFile: () => files.has(value) }),
    },
    path,
    os: { homedir: () => "/home/me" },
    createLogger: () => () => ({
      info: (event, payload) => logs.push({ level: "info", event, payload }),
      warning: (event, payload) => logs.push({ level: "warning", event, payload }),
    }),
    parseSshConfig: (source) => JSON.parse(source),
    directiveType: DIRECTIVE,
    executeCommand(options) {
      commands.push(options);
      return { wait: async () => commandResult };
    },
    hostIdFromAlias: (alias) => `ssh:${alias}`,
  };
  return {
    dependencies,
    state: {
      commands,
      files,
      globResults,
      logs,
      setCommandResult(value) { commandResult = value; },
    },
  };
}

const test = fixture();
const runtime = createSshConnectionDiscovery(test.dependencies);
equal(runtime.directiveValues(directive("Host", "one two")), ["one", "two"], "string directive values split on whitespace");
equal(runtime.directiveValues(directive("Host", [
  { val: "one" },
  { val: "" },
  { val: "two" },
])), ["one", "two"], "array directive values preserve non-empty entries");
equal(runtime.scalarDirectiveValue(directive("IdentityFile", "  ~/.ssh/id  ")), "~/.ssh/id", "scalar directive trims strings");
equal(runtime.scalarDirectiveValue(directive("ProxyCommand", [
  { val: "ssh " },
  { val: "jump" },
])), "ssh jump", "scalar directive joins token arrays without extra separator");
equal(runtime.scalarDirectiveValue(directive("User", "   ")), null, "empty scalar directive returns null");
equal(runtime.literalHostAliases(directive("Host", "prod *.internal !blocked exact?")), ["prod"], "host aliases exclude wildcard and negated patterns");

const nested = directive("Host", "outer", [
  directive("HostName", "outer.example"),
  directive("Match", "all", [directive("Port", "2222")]),
]);
equal(runtime.flattenDirectives([nested]).map(({ param }) => param), ["Host", "HostName", "Match", "Port"], "directive flattening preserves depth-first order");
equal(runtime.expandHome("~"), "/home/me", "home expansion resolves bare tilde");
equal(runtime.expandHome("~/.ssh/config"), "/home/me/.ssh/config", "home expansion resolves slash path");
equal(runtime.expandHome("~/../shared"), "/home/shared", "home expansion delegates normalization to path join");
equal(runtime.expandHome("/etc/ssh/config"), "/etc/ssh/config", "absolute include path remains unchanged");

test.state.files.set("/root/literal.conf", "[]");
test.state.files.set("/root/a.conf", "[]");
test.state.files.set("/root/b.conf", "[]");
test.state.globResults.set("/root/*.conf", ["/root/a.conf", "/root/b.conf", "/root/missing.conf"]);
equal(runtime.resolveIncludePaths({
  sshConfigRootDirectory: "/root",
  includeValue: ["literal.conf", "*.conf"],
}), ["/root/literal.conf", "/root/a.conf", "/root/b.conf"], "include resolution combines literal and file-only glob matches");

const mainConfig = [
  directive("Host", "zeta *.wild", []),
  directive("Host", "colima", []),
  directive("Include", "conf.d/*.conf"),
  { type: 2, content: "ignored" },
];
const includedConfig = [
  directive("Host", "alpha beta", []),
  directive("Include", "../config"),
];
test.state.files.set("/root/config", JSON.stringify(mainConfig));
test.state.files.set("/root/conf.d/hosts.conf", JSON.stringify(includedConfig));
test.state.globResults.set("/root/conf.d/*.conf", ["/root/conf.d/hosts.conf"]);
equal(runtime.collectAliases("/root/config"), ["zeta", "colima", "alpha"], "recursive collection keeps first literal alias per Host block and breaks include cycle");
equal(runtime.discoverSshAliases("/root/config"), ["alpha", "zeta"], "discovery filters excluded aliases and sorts results");
ok(test.state.logs.some(({ event }) => event === "discovery_completed"), "successful discovery logs completion");
equal(runtime.discoverSshAliases("/root/missing"), [], "missing SSH config returns empty list");
ok(test.state.logs.some(({ event }) => event === "ssh_config_entrypoint_missing"), "missing config is logged");

const resolvedConfig = [
  directive("Host", "prod", [
    directive("HostName", " Prod.Example.COM "),
    directive("Port", "2222"),
    directive("IdentityFile", "none"),
    directive("IdentityFile", "~/.ssh/id_prod"),
  ]),
];
equal(runtime.parseResolvedSshConfig(JSON.stringify(resolvedConfig)), {
  hostname: "Prod.Example.COM",
  port: 2222,
  identity: "~/.ssh/id_prod",
}, "resolved config projects first hostname, valid port, and non-none identity");
equal(runtime.parseResolvedSshConfig(JSON.stringify([
  directive("Port", "not-a-number"),
])), { hostname: null, port: null, identity: null }, "invalid resolved port is ignored");

test.state.setCommandResult({
  stdout: JSON.stringify(resolvedConfig),
  stderr: "",
  code: 0,
});
equal(await runtime.resolveSshAlias({ entrypointPath: "/root/config", sshAlias: "prod" }), {
  hostId: "ssh:prod",
  displayName: "prod",
  source: "discovered",
  autoConnect: false,
  sshAlias: "prod",
  sshHost: "Prod.Example.COM",
  sshPort: 2222,
  identity: "~/.ssh/id_prod",
}, "resolved alias maps to discovered connection shape");
equal(test.state.commands.at(-1), {
  args: ["ssh", "-G", "-F", "/root/config", "prod"],
  spawnInsideWsl: false,
}, "alias resolution invokes ssh -G with explicit config");

test.state.setCommandResult({ stdout: "[]", stderr: "bad", code: 255 });
equal(await runtime.resolveSshAlias({ entrypointPath: "/root/config", sshAlias: "bad" }), null, "failed ssh command returns null");
ok(test.state.logs.some(({ event }) => event === "failed to resolve discovered SSH alias"), "failed ssh command is logged");
test.state.setCommandResult({ stdout: JSON.stringify([directive("User", "me")]), stderr: "", code: 0 });
equal(await runtime.resolveSshAlias({ entrypointPath: "/root/config", sshAlias: "missing-host" }), null, "resolved config without hostname returns null");
test.state.setCommandResult({
  stdout: JSON.stringify([directive("HostName", "GitHub.com")]),
  stderr: "",
  code: 0,
});
equal(await runtime.resolveSshAlias({ entrypointPath: "/root/config", sshAlias: "github" }), null, "GitHub hostname is excluded case-insensitively");
ok(test.state.logs.some(({ event }) => event === "resolved_ssh_alias_excluded"), "excluded hostname is logged");

const broken = fixture();
broken.state.files.set("/root/config", "not-json");
const brokenRuntime = createSshConnectionDiscovery(broken.dependencies);
assert.throws(() => brokenRuntime.discoverSshAliases("/root/config"), /Failed to discover/);
assertions += 1;
ok(broken.state.logs.some(({ level }) => level === "warning"), "discovery parse failure is logged as warning");

ok(assertions >= 25, "SSH discovery owner has broad directive, include, recursion, filtering, and resolution coverage");
console.log(`${assertions} main SSH connection discovery owner assertions passed`);
