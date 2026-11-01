export const ENVIRONMENT_SETUP_SERVER_CONFIGS_KEY = "environment-setup-server-configs-v1";

const OUTBOUND_TEMPLATE_FIELDS = new Set([
  "connection_id",
  "creation_scope_id",
  "home_workspace_id",
  "provider_kind",
  "azure_tenant_id",
  "azure_client_id",
  "actor_id",
  "actor_user_id",
  "actor_account_user_id",
  "environment_id",
  "configuration_key",
  "actor_email",
  "workspace_id",
  "tenant_id",
]);

const RESERVED_CLAIM_NAMES = new Set(["iss", "sub", "aud", "exp", "nbf", "iat", "jti"]);
const OUTBOUND_SUBJECT_PREFIX = "oai:v1:oic:{connection_id}";

export function parseOutboundTemplateFields(template: string) {
  const fields: string[] = [];
  for (const [match, field] of template.matchAll(/{{|}}|{([a-z_]+):?}|[{}]/g)) {
    if (match === "{{" || match === "}}") continue;
    if (field == null || !OUTBOUND_TEMPLATE_FIELDS.has(field)) return;
    fields.push(field);
  }
  return fields;
}

export function utf8ByteLength(value: string) {
  let length = 0;
  for (const character of value) {
    if (character.length === 2) length += 4;
    else if (character.charCodeAt(0) < 128) length += 1;
    else if (character.charCodeAt(0) < 2048) length += 2;
    else length += 3;
  }
  return length;
}

export function createEnvironmentConfigSchemas(schema: any) {
  const outboundRequirement = schema.wf({ connection_id: schema.Of(), alias: schema.Of() });
  const outboundConnectionId = schema
    .Of()
    .min(5)
    .max(255)
    .regex(/^oic_[A-Za-z0-9_-]+$/);
  const outboundRequirements = schema
    .hf(
      schema.Df({
        connection_id: outboundConnectionId,
        alias: schema.Of().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
      }),
    )
    .max(16)
    .refine(
      (requirements: any[]) =>
        new Set(requirements.map(({ connection_id }) => connection_id)).size === requirements.length &&
        new Set(requirements.map(({ alias }) => alias)).size === requirements.length,
    );
  const accountIdentity = schema.wf({ accountId: schema.Of().min(1), userId: schema.Of().min(1) });
  const outboundTemplate = schema
    .Of()
    .min(1)
    .max(512)
    .refine(
      (value: string) =>
        value === value.trim() &&
        utf8ByteLength(value) <= 512 &&
        !/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(value) &&
        parseOutboundTemplateFields(value) != null,
    );
  const outboundRequestBody = schema
    .Df({
      display_name: schema.Of().trim().min(1).max(200),
      subject_template: outboundTemplate.refine(
        (value: string) => value === OUTBOUND_SUBJECT_PREFIX || value.startsWith(`${OUTBOUND_SUBJECT_PREFIX}:`),
      ),
      additional_claims: schema
        .Ef(
          schema
            .Of()
            .max(64)
            .regex(/^[A-Za-z][A-Za-z0-9_.-]*$/)
            .refine(
              (value: string) => !/^oai_/i.test(value) && !RESERVED_CLAIM_NAMES.has(value.toLowerCase()),
            ),
          outboundTemplate,
        )
        .refine((claims: Record<string, string>) => Object.keys(claims).length <= 16),
      include_actor_email: schema.gf(),
    })
    .refine(
      ({ include_actor_email, subject_template, additional_claims }: any) =>
        include_actor_email ||
        [subject_template, ...Object.values(additional_claims)].every(
          (value) => !parseOutboundTemplateFields(value as string)?.includes("actor_email"),
        ),
    );
  const outboundCreateBody = schema.jf([
    outboundRequestBody.safeExtend({ azure_tenant_id: schema.Pf(), azure_client_id: schema.Pf() }),
    outboundRequestBody.safeExtend({
      target: schema.vf("provider_kind", [
        schema.Df({
          provider_kind: schema.bf("aws"),
          role_arn: schema.Of().trim().min(1).max(2048),
          region: schema.Of().trim().min(1).max(64),
        }),
        schema.Df({
          provider_kind: schema.bf("gcp"),
          workload_identity_provider: schema.Of().trim().min(1).max(256),
          service_account_email: schema.Of().trim().min(1).max(254),
        }),
      ]),
    }),
  ]);
  const outboundRequest = schema.vf("method", [
    accountIdentity.extend({ method: schema.bf("POST"), body: outboundCreateBody }),
    accountIdentity.extend({ method: schema.bf("GET"), connectionId: outboundConnectionId }),
    accountIdentity.extend({
      method: schema.bf("PATCH"),
      connectionId: outboundConnectionId,
      body: outboundRequestBody.safeExtend({ configuration_version: schema.Cf().int().positive() }),
    }),
  ]);

  const nonBlankString = schema.Of().refine((value: string) => value.trim().length > 0);
  const azureTarget = schema.Df({
    provider_kind: schema.bf("azure"),
    tenant_id: nonBlankString.max(64),
    client_id: nonBlankString.max(64),
  });
  const outboundResponseBase = {
    connection_id: outboundConnectionId,
    display_name: schema.Of(),
    can_edit: schema.gf().nullish(),
  };
  const azureConnection = schema
    .wf({
      ...outboundResponseBase,
      provider_kind: schema.bf("azure"),
      target: azureTarget.optional(),
      azure_tenant_id: nonBlankString,
      azure_client_id: nonBlankString,
    })
    .refine(
      ({ target, azure_tenant_id, azure_client_id }: any) =>
        target == null || (target.tenant_id === azure_tenant_id && target.client_id === azure_client_id),
    );
  const awsConnection = schema.wf({
    ...outboundResponseBase,
    provider_kind: schema.bf("aws"),
    target: schema.Df({
      provider_kind: schema.bf("aws"),
      role_arn: nonBlankString.max(2048),
      region: nonBlankString.max(64),
    }),
    azure_tenant_id: schema.Sf().optional(),
    azure_client_id: schema.Sf().optional(),
  });
  const gcpConnection = schema.wf({
    ...outboundResponseBase,
    provider_kind: schema.bf("gcp"),
    target: schema.Df({
      provider_kind: schema.bf("gcp"),
      workload_identity_provider: nonBlankString.max(256),
      service_account_email: nonBlankString.max(254),
    }),
    azure_tenant_id: schema.Sf().optional(),
    azure_client_id: schema.Sf().optional(),
  });
  const outboundConnection = schema.vf("provider_kind", [azureConnection, awsConnection, gcpConnection]);
  const outboundResponseFields = {
    issuer: schema.Nf().nullable(),
    audience: schema.Of().regex(/\S/u).nullable(),
    subject_template: schema.Of(),
    subject: schema.Of().min(1).nullable(),
    additional_claims: schema.Ef(schema.Of(), schema.Of()),
    include_actor_email: schema.gf(),
    enabled: schema.gf(),
    configuration_version: schema.Cf().int().positive(),
  };
  const outboundResponse = schema.vf("provider_kind", [
    azureConnection.safeExtend(outboundResponseFields),
    awsConnection.safeExtend(outboundResponseFields),
    gcpConnection.safeExtend(outboundResponseFields),
  ]);

  const configId = schema.Of().regex(/^[A-Za-z0-9_~-]+$/);
  const outboundListRequest = accountIdentity.extend({ configId });
  const outboundListResponse = schema.wf({
    items: schema
      .hf(outboundConnection)
      .refine(
        (items: any[]) => new Set(items.map(({ connection_id }) => connection_id)).size === items.length,
      ),
    cursor: schema.Of().nullable(),
  });
  const repository = schema.wf({
    repository_id: schema.Of().min(1),
    ref: schema.Of().min(1),
    depth: schema.Cf().int().min(1).max(2147483647).optional(),
  });
  const networkPolicy = schema.vf("type", [
    schema.wf({ type: schema.bf("disabled") }),
    schema.wf({ type: schema.bf("unrestricted") }),
    schema.wf({
      type: schema.bf("restricted"),
      presets: schema.hf(schema.df(["package_managers"])).optional(),
      egress_rules: schema.hf(schema.wf({ host: schema.Of().min(1) })),
    }),
  ]);
  const secretTarget = schema.jf([
    schema.Df({ environment_variable: schema.Of(), allowed_domains: schema.hf(schema.Of()).optional() }),
    schema.Df({
      http_header: schema.Df({
        header_name: schema.Of(),
        allowed_domains: schema.hf(schema.Of()).optional(),
      }),
    }),
  ]);
  const secret = schema.wf({
    id: schema.Of().optional(),
    name: schema.Of().min(1),
    source: schema.df(["environment", "user_provided"]),
    optional: schema.gf().optional(),
    error: schema.wf({ code: schema.Of() }).optional(),
    target: secretTarget,
  });
  const runtimeRequirement = schema.wf({
    source: schema.vf("type", [
      schema.wf({ type: schema.bf("vault_secret"), id: schema.Of().min(1) }),
      schema.wf({ type: schema.bf("user_provided") }),
    ]),
    optional: schema.gf(),
    delivery: schema.wf({
      type: schema.bf("direct_environment_variable"),
      variable_name: schema.Of().min(1),
    }),
    error: schema.wf({ code: schema.Of() }).optional(),
  });
  const pendingRuntimeRequirement = runtimeRequirement
    .pick({ delivery: true })
    .extend({ source: schema.wf({ type: schema.bf("environment") }) });
  const configCreateBody = schema.wf({
    name: schema.Of().min(1),
    repositories: schema.hf(repository),
    install_script: schema.Of().optional(),
    cwd: schema.Of().startsWith("/").optional(),
    start_skill: schema.Of().optional(),
    network_policy: networkPolicy,
    share_settings: schema.df(["private", "workspace"]),
  });
  const configMetadataPatch = configCreateBody
    .pick({ name: true, share_settings: true })
    .partial()
    .strict()
    .refine((value: any) => value.name != null || value.share_settings != null);
  const configDraftPatch = schema
    .wf({
      base_version_id: schema.Of().min(1),
      expected_revision: schema.Cf().int().nonnegative().optional(),
      vpn_connection_id: schema.Of().optional(),
      repositories: schema.hf(repository).optional(),
      install_script: schema.Of().optional(),
      cwd: schema.Of().startsWith("/").optional(),
      start_skill: schema.Of().optional(),
      network_policy: networkPolicy.optional(),
      runtime_requirements: schema.hf(runtimeRequirement.omit({ error: true }).strict()).optional(),
      pending_runtime_requirements: schema.hf(pendingRuntimeRequirement.strict()).optional(),
      outbound_identity_requirements: outboundRequirements.optional(),
      secrets: schema
        .hf(
          secret
            .omit({ error: true })
            .strict()
            .refine((value: any) => value.source !== "user_provided" || value.id == null),
        )
        .optional(),
    })
    .strict()
    .refine(
      (value: any) =>
        value.repositories != null ||
        value.install_script != null ||
        value.cwd != null ||
        value.start_skill != null ||
        value.network_policy != null ||
        value.runtime_requirements != null ||
        value.pending_runtime_requirements != null ||
        value.secrets != null ||
        value.outbound_identity_requirements != null ||
        value.vpn_connection_id != null,
    );
  const configResponse = configCreateBody.extend({
    id: schema.Of().min(1),
    is_owner: schema.gf().optional(),
    version_id: schema.Of().min(1),
    vpn_connection_id: schema.Of().min(1).nullish(),
    status: schema.Of(),
    environment_id: schema.Of().min(1).nullish(),
    thread_id: schema.Of().min(1).nullish(),
    onboarding_skill: schema.Of().min(1).nullish(),
    secrets: schema.hf(secret).optional(),
    runtime_requirements: schema.hf(runtimeRequirement).optional(),
    outbound_identity_requirements: schema.hf(outboundRequirement).optional(),
    draft: schema
      .wf({
        id: schema.Of().min(1),
        base_version_id: schema.Of().min(1),
        vpn_connection_id: schema.Of().min(1).nullish(),
        revision: schema.Cf().int().nonnegative(),
        repositories: schema.hf(repository),
        install_script: schema.Of().optional(),
        cwd: schema.Of().startsWith("/").optional(),
        start_skill: schema.Of().optional(),
        network_policy: networkPolicy,
        secrets: schema.hf(secret),
        runtime_requirements: schema.hf(runtimeRequirement).optional(),
        pending_runtime_requirements: schema.hf(pendingRuntimeRequirement).optional(),
        outbound_identity_requirements: schema.hf(outboundRequirement).optional(),
      })
      .nullish(),
  });
  const listResponse = schema
    .wf({
      data: schema.hf(
        schema.wf({
          id: schema.Of().min(1),
          name: schema.Of(),
          is_owner: schema.gf().optional(),
          share_settings: configCreateBody.shape.share_settings,
          repositories: schema.hf(schema.wf({ repository_id: schema.Of(), ref: schema.Of() })),
          version_id: schema.Of().min(1),
          thread_id: schema.Of().min(1).nullish(),
          version_revision: schema.Cf().int().positive().optional(),
        }),
      ),
      next_cursor: schema.Of().nullable(),
    })
    .transform((response: any) => ({
      data: response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        isOwner: item.is_owner,
        shareSettings: item.share_settings,
        repositories: item.repositories.map((repository: any) => ({
          repositoryId: repository.repository_id,
          ref: repository.ref,
        })),
        versionId: item.version_id,
        threadId: item.thread_id,
        versionRevision: item.version_revision,
        status: "ready",
        latestReadyVersionId: item.version_id,
      })),
      nextCursor: response.next_cursor,
    }));
  const deleteRequest = schema.wf({
    accountId: schema.Of().min(1),
    userId: schema.Of().min(1),
    configId,
    method: schema.bf("DELETE"),
  });
  const configRequest = schema.jf([
    schema.wf({
      accountId: schema.Of().min(1),
      method: schema.bf("POST"),
      userId: schema.Of().min(1).optional(),
      body: configCreateBody.extend({ start_onboarding: schema.gf().optional() }),
    }),
    schema.wf({
      accountId: schema.Of().min(1),
      method: schema.bf("POST"),
      configId,
      userId: schema.Of().min(1).optional(),
      body: schema.jf([
        schema.Df({ expected_revision: schema.Cf().int().nonnegative() }),
        schema.Df({ operation_id: schema.Of().min(1) }),
      ]),
    }),
    schema.wf({
      accountId: schema.Of().min(1),
      method: schema.bf("GET"),
      userId: schema.Of().min(1).optional(),
      configId,
    }),
    schema.wf({
      accountId: schema.Of().min(1),
      method: schema.bf("PATCH"),
      userId: schema.Of().min(1).optional(),
      configId,
      body: schema.jf([configDraftPatch, configMetadataPatch]),
    }),
  ]);
  const approvalRequest = schema.wf({
    accountId: schema.Of().min(1),
    userId: schema.Of().min(1),
    configId,
    method: schema.bf("POST"),
    body: schema.Df({
      expected_revision: schema.Cf().int().nonnegative(),
      idempotency_key: schema.Of().min(1).max(128),
    }),
  });
  const readOperationRequest = schema.wf({
    accountId: schema.Of().min(1),
    userId: schema.Of().min(1),
    operationId: schema.Of().min(1),
  });
  const operationResponse = schema.wf({
    id: schema.Of().min(1),
    kind: schema.Of().min(1),
    environment_id: schema.Of().min(1),
    state: schema.df(["PENDING", "RUNNING", "SUCCEEDED", "FAILED"]),
    failure: schema
      .wf({
        code: schema.Of(),
        message: schema.Of(),
        vpn_failure_stage: schema
          .df(["setup", "daemon_start", "tailscale_up"])
          .optional()
          .catch(undefined),
        vpn_failure_class: schema
          .df([
            "socket_timeout",
            "tun_permission",
            "tun_unavailable",
            "route_permission",
            "daemon_exited",
            "daemon_unavailable",
            "auth_key_file_unavailable",
            "auth_rejected",
            "dns_failure",
            "network_unreachable",
            "timeout",
            "unsupported_option",
            "permission_denied",
            "backend_error",
            "unknown",
          ])
          .optional()
          .catch(undefined),
      })
      .optional(),
  });
  const secretScope = schema.vf("type", [
    schema.wf({ type: schema.bf("all_environment_configs") }),
    schema.wf({
      type: schema.bf("environment_config_ids"),
      ids: schema.hf(schema.Of().min(1)).min(1).max(100),
    }),
  ]);
  const personalSecretsRequest = schema.vf("method", [
    schema.wf({
      accountId: schema.Of().min(1),
      userId: schema.Of().min(1),
      method: schema.bf("GET"),
      cursor: schema.Of().optional(),
      namespace: schema.df(["sensitive", "not_sensitive"]).optional(),
    }),
    schema.wf({
      accountId: schema.Of().min(1),
      userId: schema.Of().min(1),
      method: schema.bf("POST"),
      body: schema.wf({
        namespace: schema.df(["sensitive", "not_sensitive"]).optional(),
        secrets: schema
          .hf(
            schema.jf([
              schema.Df({
                env_var: schema.Of().min(1),
                target: secretScope.optional(),
                name: schema.Of().min(1),
                value: schema.Of().min(1),
              }),
              schema
                .Df({
                  id: schema.Of().min(1),
                  name: schema.Of().min(1).optional(),
                  value: schema.Of().min(1).optional(),
                  env_var: schema.Of().min(1).optional(),
                  target: secretScope.optional(),
                })
                .refine(
                  (value: any) =>
                    (value.name != null || value.value != null) &&
                    (value.target == null || value.env_var != null),
                ),
            ]),
          )
          .min(1),
      }),
    }),
    schema.wf({
      accountId: schema.Of().min(1),
      userId: schema.Of().min(1),
      method: schema.bf("DELETE"),
      body: schema.wf({
        namespace: schema.df(["sensitive", "not_sensitive"]).optional(),
        ids: schema.hf(schema.Of().min(1)).min(1),
      }),
    }),
  ]);
  const personalSecret = schema.wf({
    id: schema.Of().min(1),
    name: schema.Of(),
    env_var: schema.Of().nullish(),
    target: secretScope.nullish(),
  });
  const personalSecretsListResponse = schema.wf({
    secrets: schema.hf(personalSecret),
    next_cursor: schema.Of().nullable(),
  });
  const personalSecretsWriteResponse = schema.wf({
    secrets: schema.hf(
      schema
        .wf({
          id: schema.Of().min(1).optional(),
          name: schema.Of(),
          env_var: schema.Of().nullish(),
          target: secretScope.nullish(),
          error: schema.wf({ code: schema.Of() }).optional(),
        })
        .refine((value: any) => value.id != null || value.error != null),
    ),
  });
  const personalSecretsPreflightRequest = schema.wf({
    accountId: schema.Of().min(1),
    userId: schema.Of().min(1),
    configId,
  });
  const personalSecretsPreflightResponse = schema.wf({
    issues: schema.hf(
      schema.wf({
        env_var: schema.Of().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
        namespace: schema.df(["sensitive", "not_sensitive"]),
        optional: schema.gf(),
        code: schema.Of(),
      }),
    ),
  });
  const saveValueRequest = schema.wf({
    accountId: schema.Of().min(1),
    userId: schema.Of().min(1),
    method: schema.bf("POST"),
    body: schema.Df({
      id: schema.Of().trim().min(1).optional(),
      namespace: schema.df(["proxy", "runtime"]),
      name: schema.Of().min(1),
      value: schema.Of().min(1),
    }),
  });
  const saveValueResponse = schema.wf({ id: schema.Of().min(1), name: schema.Of() });
  const vpnRequest = schema.vf("method", [
    schema.wf({
      accountId: schema.Of().min(1),
      userId: schema.Of().min(1),
      configId,
      method: schema.bf("GET"),
    }),
    schema.wf({
      accountId: schema.Of().min(1),
      userId: schema.Of().min(1),
      configId,
      method: schema.bf("POST"),
      body: schema.Df({
        provider: schema.bf("tailscale"),
        auth_method: schema.bf("auth_key"),
        connection_id: schema.Of().min(1).optional(),
        expected_etag: schema.Of().min(1).optional(),
        auth_key: schema.Of().min(1).max(4096).optional(),
        base_version_id: schema.Of().min(1),
        expected_draft_revision: schema.Cf().int().nonnegative().optional(),
      }),
    }),
  ]);
  const vpnResponse = schema.wf({
    connection: schema
      .wf({
        id: schema.Of().min(1),
        provider: schema.df(["tailscale", "wireguard", "openvpn"]),
        auth_method: schema.df(["auth_key", "oauth"]),
        etag: schema.Of().min(1),
        configured: schema.gf(),
      })
      .nullable(),
    capabilities: schema.hf(
      schema.wf({
        provider: schema.df(["tailscale", "wireguard", "openvpn"]),
        auth_methods: schema.hf(schema.df(["auth_key", "oauth"])),
      }),
    ),
    base_version_id: schema.Of().min(1),
    draft_revision: schema.Cf().int().nonnegative().nullable(),
  });

  return {
    deleteRequest,
    emptyResponse: schema.mf(),
    saveValueRequest,
    saveValueResponse,
    listResponse,
    configRequest,
    configResponse,
    vpnRequest,
    vpnResponse,
    personalSecretsRequest,
    personalSecretsListResponse,
    personalSecretsWriteResponse,
    personalSecretsPreflightRequest,
    personalSecretsPreflightResponse,
    approvalRequest,
    readOperationRequest,
    operationResponse,
    outboundListRequest,
    outboundListResponse,
    outboundRequest,
    outboundResponse,
    failureDiagnostic: schema.wf({ error: schema.wf({ code: schema.Cf().int(), message: schema.Of() }) }),
  };
}
