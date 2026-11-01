import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";
import { z } from "zod";

const source = fs.readFileSync(
  new URL("../src/main/main-app/environment-config/schemas.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "esm", target: "node22" });
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}
function parses(schema, value, expected = true) {
  equal(schema.safeParse(value).success, expected);
}

// The shipped chunk uses Zod 4's safeExtend; the repository's test dependency is
// Zod 3, so reproduce that operation without weakening the existing refinement.
z.ZodObject.prototype.safeExtend = function safeExtend(shape) {
  return this.extend(shape);
};
z.ZodEffects.prototype.safeExtend = function safeExtend(shape) {
  return new z.ZodEffects({ ...this._def, schema: this._def.schema.extend(shape) });
};
z.ZodEffects.prototype.max = function max(value) {
  return new z.ZodEffects({ ...this._def, schema: this._def.schema.max(value) });
};

const schemaDsl = {
  Of: z.string,
  Cf: z.number,
  gf: z.boolean,
  Pf: () => z.string().uuid(),
  Nf: () => z.string().url(),
  Sf: z.null,
  wf: z.object,
  Df: z.strictObject,
  hf: z.array,
  Ef: z.record,
  df: z.enum,
  bf: z.literal,
  vf: (_key, schemas) => z.union(schemas),
  jf: z.union,
  mf: z.void,
};
const schemas = runtime.createEnvironmentConfigSchemas(schemaDsl);

equal(runtime.ENVIRONMENT_SETUP_SERVER_CONFIGS_KEY, "environment-setup-server-configs-v1");
equal(runtime.parseOutboundTemplateFields("prefix-{actor_email}-{{literal}}"), ["actor_email"]);
equal(runtime.parseOutboundTemplateFields("{unknown}"), undefined);
equal(runtime.parseOutboundTemplateFields("{"), undefined);
equal(runtime.utf8ByteLength("abc"), 3);
equal(runtime.utf8ByteLength("é"), 2);
equal(runtime.utf8ByteLength("😀"), 4);

const identity = { accountId: "account", userId: "user" };
const azureBody = {
  display_name: " Azure ",
  subject_template: "oai:v1:oic:{connection_id}",
  additional_claims: {},
  include_actor_email: false,
  azure_tenant_id: "00000000-0000-4000-8000-000000000001",
  azure_client_id: "00000000-0000-4000-8000-000000000002",
};
parses(schemas.outboundRequest, { ...identity, method: "POST", body: azureBody });
parses(schemas.outboundRequest, {
  ...identity,
  method: "POST",
  body: { ...azureBody, additional_claims: { actor: "{actor_email}" } },
}, false);
parses(schemas.outboundRequest, {
  ...identity,
  method: "POST",
  body: { ...azureBody, include_actor_email: true, additional_claims: { actor: "{actor_email}" } },
});
parses(schemas.outboundRequest, {
  ...identity,
  method: "POST",
  body: { ...azureBody, additional_claims: { iss: "literal" } },
}, false);
parses(schemas.outboundRequest, { ...identity, method: "GET", connectionId: "bad" }, false);
parses(schemas.outboundRequest, { ...identity, method: "GET", connectionId: "oic_valid" });
parses(schemas.outboundRequest, {
  ...identity,
  method: "PATCH",
  connectionId: "oic_valid",
  body: {
    display_name: "Azure",
    subject_template: "oai:v1:oic:{connection_id}",
    additional_claims: {},
    include_actor_email: false,
    configuration_version: 1,
  },
});

parses(schemas.configRequest, {
  accountId: "account",
  method: "POST",
  body: {
    name: "Environment",
    repositories: [{ repository_id: "repo", ref: "main", depth: 1 }],
    network_policy: { type: "restricted", presets: ["package_managers"], egress_rules: [{ host: "example.com" }] },
    share_settings: "private",
  },
});
parses(schemas.configRequest, {
  ...identity,
  method: "PATCH",
  configId: "config",
  body: { base_version_id: "base" },
}, false);
parses(schemas.configRequest, {
  ...identity,
  method: "PATCH",
  configId: "config",
  body: { base_version_id: "base", vpn_connection_id: "vpn" },
});
parses(schemas.configRequest, {
  ...identity,
  method: "PATCH",
  configId: "config",
  body: { name: "Renamed" },
});
parses(schemas.configRequest, {
  ...identity,
  method: "PATCH",
  configId: "config",
  body: {},
}, false);
parses(schemas.deleteRequest, { ...identity, configId: "bad/slash", method: "DELETE" }, false);

const list = schemas.listResponse.parse({
  data: [{
    id: "config",
    name: "Environment",
    share_settings: "workspace",
    repositories: [{ repository_id: "repo", ref: "main" }],
    version_id: "version",
    thread_id: null,
    version_revision: 2,
  }],
  next_cursor: "next",
});
equal(list, {
  data: [{
    id: "config",
    name: "Environment",
    isOwner: undefined,
    shareSettings: "workspace",
    repositories: [{ repositoryId: "repo", ref: "main" }],
    versionId: "version",
    threadId: null,
    versionRevision: 2,
    status: "ready",
    latestReadyVersionId: "version",
  }],
  nextCursor: "next",
});

parses(schemas.personalSecretsRequest, {
  ...identity,
  method: "POST",
  body: { secrets: [{ id: "secret", target: { type: "all_environment_configs" } }] },
}, false);
parses(schemas.personalSecretsRequest, {
  ...identity,
  method: "POST",
  body: { secrets: [{ id: "secret", name: "Updated", env_var: "TOKEN", target: { type: "all_environment_configs" } }] },
});
parses(schemas.personalSecretsRequest, {
  ...identity,
  method: "DELETE",
  body: { ids: [] },
}, false);
parses(schemas.personalSecretsPreflightResponse, {
  issues: [{ env_var: "VALID_NAME", namespace: "sensitive", optional: false, code: "missing" }],
});
parses(schemas.personalSecretsPreflightResponse, {
  issues: [{ env_var: "bad-name", namespace: "sensitive", optional: false, code: "missing" }],
}, false);
const operation = schemas.operationResponse.parse({
  id: "operation",
  kind: "approve",
  environment_id: "environment",
  state: "FAILED",
  failure: { code: "vpn", message: "failed", vpn_failure_class: "future-value" },
});
equal(operation.failure.vpn_failure_class, undefined);
parses(schemas.vpnRequest, {
  ...identity,
  configId: "config",
  method: "POST",
  body: {
    provider: "tailscale",
    auth_method: "auth_key",
    auth_key: "key",
    base_version_id: "base",
  },
});

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/environment-config/schemas.js")'), true);
equal(main.includes("createEnvironmentConfigSchemas(n)"), true);
equal(main.includes("schemas: environmentConfigSchemas"), true);
for (const generatedName of ["uk", "dk"]) {
  equal(new RegExp(`^function ${generatedName}\\(`, "m").test(main), false);
}
for (const generatedSchema of ["HO", "UO", "WO", "GO", "YO", "XO", "QO", "Sk", "Ck", "Ek", "Bk"]) {
  equal(new RegExp(`^[ ]{0,2}${generatedSchema} = `, "m").test(main), false);
}

console.log(`${assertions} main environment config schema assertions passed`);
