import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["browser-use-origin-state-queries", "browser-mfa-session"];
const state = globalThis.__browserSecurityPolicyTest = {
  apiGets: [], commands: [], initialized: [], invalidations: [], jwtClaims: {},
  locationAssignments: [], logs: [], queryCache: new Map(), serverRequests: [],
  serviceCalls: [], token: null,
};
globalThis.window = { location: { assign: url => state.locationAssignments.push(url) } };

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const raw of match[1].split(",")) {
      const specifier = raw.trim().replace(/^type\s+/, "");
      if (specifier) names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const marker = name => `() => globalThis.__browserSecurityPolicyTest.initialized.push(${JSON.stringify(name)})`;
const schemaRuntime = `
  const makeSchema = (validator = () => true) => {
    const schema = {
      parse(value) { if (!validator(value)) throw new Error("invalid"); return value; },
      safeParse(value) { return validator(value) ? { success: true, data: value } : { success: false }; },
      optional() { return makeSchema(value => value === undefined || validator(value)); },
      nullish() { return makeSchema(value => value == null || validator(value)); },
      catch() { return schema; },
    };
    return schema;
  };
`;
const parseOrigin = `value => {
  if (typeof value !== "string" || value.includes("invalid")) return null;
  try {
    const url = new URL(value.includes("://") ? value : "https://" + value.replace(/^\\*\\./, ""));
    const host = url.hostname.toLowerCase();
    return { canonicalKey: host, canonicalPattern: value.toLowerCase(), hostname: host };
  } catch { return null; }
}`;
const appScope = `{ id: "app-scope" }`;
const configurationQuery = `{ id: "configuration-query" }`;
const overrides = {
  "app-shared": {
    $3: marker("compiler"), $O: `{ FIVE_SECONDS: 5_000 }`, FX: marker("signals"),
    CL: `() => ({
      getQueryData(key) { return globalThis.__browserSecurityPolicyTest.queryCache.get(JSON.stringify(key)); },
      invalidateQueries({ queryKey }) { globalThis.__browserSecurityPolicyTest.invalidations.push(queryKey); return Promise.resolve(); },
    })`,
    E4: `schema => makeSchema(value => Array.isArray(value))`,
    G4: `(key, value) => makeSchema(input => input != null && typeof input === "object" && !Array.isArray(input))`,
    H4: `shape => makeSchema(value => value != null && typeof value === "object" && !Array.isArray(value))`,
    LX: `() => ({
      query: { invalidate(query, parameter) { globalThis.__browserSecurityPolicyTest.invalidations.push([query.id, parameter]); return Promise.resolve(); } },
    })`,
    Q3: `{ error(message, details) { globalThis.__browserSecurityPolicyTest.logs.push({ message, details }); } }`,
    QI: marker("query-runtime"), SL: marker("query-client-hook"), Z3: marker("logger"),
    Z4: `() => makeSchema(value => value == null || value === "allow" || value === "deny")`,
    ZI: appScope, ek: marker("mutation-runtime"), g4: marker("validation"),
    iL: `options => ({ options, mutate: variables => options.mutationFn(variables) })`,
    k4: `() => makeSchema(value => typeof value === "boolean")`,
    q4: `() => makeSchema(value => typeof value === "string")`,
    rL: marker("use-mutation"),
    rZ: `(scope, factory) => ({ kind: "derived-family", scope, factory })`,
    V4: `() => makeSchema(value => typeof value === "number")`,
  },
  "app-initial": {
    $ln: `key => [key]`, $sn: marker("browser-settings"), Asn: parseOrigin,
    Bfn: marker("configuration-state"),
    Fsn: `(pattern, hostname) => hostname === pattern.hostname || hostname.endsWith("." + pattern.hostname)`,
    Jsn: `["configuration"]`,
    Kdn: `layers => layers?.writable ?? null`,
    Msn: parseOrigin, Nsn: parseOrigin,
    Qln: `async (command, payload) => { const state = globalThis.__browserSecurityPolicyTest; state.commands.push({ command, payload }); if (state.commandError) throw state.commandError; return state.commandResult; }`,
    Ugn: `() => ({ sendRequest: async (method, parameters) => { const state = globalThis.__browserSecurityPolicyTest; state.serverRequests.push({ method, parameters }); if (state.serverError) throw state.serverError; return state.serverResult ?? {}; } })`,
    Wgn: marker("app-server"), Xdn: marker("layers"), Ydn: `name => "/config/" + name`,
    aun: marker("command-queries"), bsn: marker("origin-parser"),
    ksn: `(pattern, origin) => origin.hostname === pattern.hostname || origin.hostname.endsWith("." + pattern.hostname)`,
    lcn: configurationQuery, mnt: marker("app-services"), nun: marker("renderer-commands"),
    pnt: `{
      browserUsePermissions: {
        clearPrewarmedThreads: async () => globalThis.__browserSecurityPolicyTest.serviceCalls.push(["clearPrewarmedThreads"]),
        updateIabHistoryApprovalMode: async value => globalThis.__browserSecurityPolicyTest.serviceCalls.push(["iabHistory", value]),
        updateOriginRules: async value => { const state = globalThis.__browserSecurityPolicyTest; state.serviceCalls.push(["originRules", value]); if (state.originUpdateError) throw state.originUpdateError; return "updated"; },
        updateWebMcpEnabled: async value => globalThis.__browserSecurityPolicyTest.serviceCalls.push(["webMcp", value]),
      },
    }`,
    sun: `() => async key => globalThis.__browserSecurityPolicyTest.invalidations.push(key)`,
    tun: `(scope, command, options) => ({ scope, command, options })`, ugn: `"local"`,
    Ix: marker("reauthentication"), Run: marker("auth-url"),
    Rx: `async (url, parameters, signal) => globalThis.__browserSecurityPolicyTest.reauthResult ?? { ok: true, url: url + "?reauth=1" }`,
    Sdn: `(globalThis.__browserSecurityPolicyTest.ApiError ??= class ApiError extends Error { constructor(status, errorCode) { super(errorCode); this.status = status; this.errorCode = errorCode; } })`,
    Vun: `async () => globalThis.__browserSecurityPolicyTest.token`,
    bfn: marker("auth-state"), pdn: marker("api-headers"),
    udn: `{ safeGet: async (url, options) => { globalThis.__browserSecurityPolicyTest.apiGets.push({ url, options }); return { enabled: true }; } }`,
    wdn: marker("api-client"), yfn: `() => ({ authStatus: "authenticated", auth: { reauthenticationParams: { return_to: "desktop" } } })`,
  },
  "browser-mfa-jwt": {
    n: `() => globalThis.__browserSecurityPolicyTest.jwtClaims`,
    t: marker("jwt"),
  },
};

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return `${name === "app-shared" ? schemaRuntime : ""}\n${[...names].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`).join("\n")}`;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true,
    format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "browser-security-policy-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

// browser-use-origin-state-queries
const policy = await bundle("browser-use-origin-state-queries");
policy.i(); policy.i();
assert.equal(state.initialized.filter(name => name === "app-services").length, 1);
assert.equal(state.initialized.includes("origin-parser"), true);
assert.deepEqual(Object.keys(policy).sort(), ["C", "D", "E", "S", "T", "_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "w", "x", "y"]);
assert.equal(policy.t.command, "browser-use-origin-state-read");
assert.equal(policy.t.options.staleTime, 5_000);

assert.equal(policy.S(null), false);
assert.equal(policy.S({ allowBrowserAndComputerUse: false }), true);
assert.equal(policy.S({ network: { deniedDomains: ["blocked.test"] } }), true);
assert.equal(policy.T({ featureRequirements: { browser_use: false, browser_use_external: true } }, "cdp"), false);
assert.equal(policy.T({ featureRequirements: { browser_use: false, browser_use_external: true } }, "extension"), true);
assert.equal(policy.E({ network: { enabled: false } }, "origin"), false);
assert.equal(policy.E({ browserUse: { allowHistoryAccess: false } }, "history"), false);
assert.equal(policy.E({ browserUse: { defaultOriginPolicy: { downloads: "deny" } } }, "download"), false);
assert.equal(policy.E({}, "upload"), true);
assert.equal(policy.D({ browserUse: { allowGlobalPersistentApproval: false } }), false);
assert.equal(policy.D({}), true);

const configuration = {
  browserUse: {
    defaultOriginPolicy: { access: "allow", downloads: "allow" },
    origins: {
      "example.com": { downloads: "deny" },
      "allowed.test": { access: "allow", uploads: "allow" },
    },
  },
  network: { deniedDomains: ["blocked.test"], allowedDomains: ["allowed.test"] },
};
assert.equal(policy.x(configuration).length, 2);
assert.equal(policy.b(configuration).length, 2);
assert.equal(policy.b(configuration)[0].decision, "allow");
assert.equal(policy.y({ pattern: "example.com" }, "https://sub.example.com/path"), true);
assert.equal(policy.v({ pattern: { hostname: "example.com" } }, "https://sub.example.com"), true);
assert.equal(policy.w(configuration, "https://example.com", "download"), false);
assert.equal(policy.w(configuration, "https://allowed.test", "upload"), true);
assert.equal(policy.w(configuration, "https://blocked.test", "origin"), false);
assert.equal(policy.g({ full_cdp_access: "deny" }, "fullCdp"), "deny");
assert.equal(policy.g({ uploads: "allow" }, "upload"), "allow");

assert.equal(policy.h({ default_permissions: 7, permissions: {} }), null);
const legacy = policy.h({ default_permissions: "standard", permissions: { standard: { network: { enabled: true, denied_domains: ["x.test"] } } } });
assert.equal(legacy.enabled, true);
assert.deepEqual(legacy.allowedDomains, []);
assert.deepEqual(legacy.deniedDomains, ["x.test"]);

const scope = { query: { invalidate: async (query, hostId) => state.invalidations.push([query.id, hostId]) } };
await assert.rejects(() => policy.p(scope, "local", { configReadSucceeded: false, config: {} }, { capability: "history", enabled: true }), /not supported/);
await policy.p(scope, "local", { configReadSucceeded: true, config: { browser_use: {} }, configWriteTarget: { filePath: "/tmp/config" } }, { capability: "history", enabled: true });
assert.equal(state.serverRequests.at(-1).parameters.edits[0].keyPath, "browser_use.allow_history_access");
assert.equal(state.serverRequests.at(-1).parameters.filePath, "/tmp/config");

await policy.r(["cookies"]);
assert.equal(state.commands.at(-1).command, "browser-browsing-data-clear");
state.commandError = new Error("clear failed");
await assert.rejects(() => policy.r(["history"]), /clear failed/);
assert.equal(state.logs.at(-1).message, "Failed to clear browser browsing data");
state.commandError = null;

const approvalMutation = policy.o();
await approvalMutation.options.mutationFn("always");
assert.equal(state.commands.at(-1).command, "browser-use-approval-mode-write");
await approvalMutation.options.onSuccess();
assert.deepEqual(state.invalidations.at(-1), ["vscode", "browser-use-origin-state-read"]);
const fileMutation = policy.c();
await fileMutation.options.mutationFn({ approvalMode: "ask", kind: "upload" });
assert.equal(state.commands.at(-1).payload.params.kind, "upload");
const webMcpMutation = policy.f();
await webMcpMutation.options.mutationFn(true);
assert.deepEqual(state.serviceCalls.at(-1), ["webMcp", true]);
const iabMutation = policy.u();
await iabMutation.options.mutationFn("ask");
assert.deepEqual(state.serviceCalls.at(-1), ["iabHistory", "ask"]);
const cdpMutation = policy.l({ hostId: "local" });
await cdpMutation.options.mutationFn(true);
assert.equal(state.commands.at(-1).command, "browser-use-full-cdp-access-enabled-write");
await cdpMutation.options.onSuccess();
assert.deepEqual(state.serviceCalls.at(-1), ["clearPrewarmedThreads"]);

const support = policy.n.factory("local", { get: () => ({ data: { configReadSucceeded: true, config: { browser_use: {} } }, isPending: false, isError: false }) });
assert.equal(support, "supported");
assert.equal(policy.n.factory("local", { get: () => ({ isPending: true, isError: false }) }), "loading");

// browser-mfa-session
const mfa = await bundle("browser-mfa-session");
mfa.n(); mfa.n();
assert.equal(state.initialized.filter(name => name === "jwt").length, 1);
assert.deepEqual(Object.keys(mfa).sort(), ["a", "i", "n", "r", "t"]);
state.token = null;
assert.equal(await mfa.i(), true);
state.token = { accessToken: "token" };
state.jwtClaims = { pwd_auth_time: Date.now() };
assert.equal(await mfa.i(), false);
state.jwtClaims = { pwd_auth_time: Date.now() - 300_000 };
assert.equal(await mfa.i(), true);
state.jwtClaims = { pwd_auth_time: Date.now(), "https://api.openai.com/mfa": { required: "no" } };
assert.equal(await mfa.i(true), true);
state.jwtClaims = { pwd_auth_time: Date.now(), "https://api.openai.com/mfa": { required: "yes" } };
assert.equal(await mfa.i(true), false);

state.reauthResult = { ok: true, url: "https://auth.test/continue" };
assert.equal(await mfa.a("https://auth.test"), true);
assert.equal(state.locationAssignments.at(-1), "https://auth.test/continue");
state.reauthResult = { ok: false };
assert.equal(await mfa.a("https://auth.test"), false);
const aborted = new AbortController(); aborted.abort();
state.reauthResult = { ok: true, url: "https://auth.test/continue" };
assert.equal(await mfa.a("https://auth.test", aborted.signal), false);

assert.equal(mfa.r(new Error("ordinary")), false);
assert.equal(mfa.r(new state.ApiError(401, "unknown")), true);
assert.equal(mfa.r(new state.ApiError(400, "recent_auth_required")), true);
assert.equal(mfa.r(new state.ApiError(400, "other")), false);
const query = mfa.t("acct-1");
assert.deepEqual(query.queryKey, ["browser-mfa-info", "acct-1"]);
assert.equal(query.retry, false);
assert.equal(query.gcTime, 0);
assert.equal(await query.queryFn({ signal: new AbortController().signal }).then(value => value.enabled), true);
assert.equal(state.apiGets.at(-1).url, "/accounts/mfa_info");

console.log("browser security policy cluster tests passed");
