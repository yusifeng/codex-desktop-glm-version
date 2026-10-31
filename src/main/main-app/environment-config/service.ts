const MAX_DIAGNOSTIC_BYTES = 8_192;
const MAX_DIAGNOSTIC_MESSAGE_LENGTH = 512;

type EnvironmentConfigDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  createHttpClient(getAuthToken: () => Promise<any>, options: any): any;
  accountIdFromToken(token: any): string | null | undefined;
  identityFromToken(token: any): { accountId?: string; userId?: string } | null | undefined;
  loggerFactory(name: string): () => { warning(message: string, fields: unknown): void };
  timeoutSignal(milliseconds: number): AbortSignal;
  now(): number;
  schemas: Record<string, any>;
};

function parsed(schema: any, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}

export function environmentConfigPath(input: any) {
  if (!("configId" in input)) return "/v1/environment-configs";
  const root = `/v1/environment-configs/${encodeURIComponent(input.configId)}`;
  return input.method === "POST"
    ? "operation_id" in input.body
      ? `${root}/draft/approve/complete`
      : `${root}/draft/approve`
    : input.method === "PATCH" && "base_version_id" in input.body
      ? `${root}/draft`
      : root;
}

export function redactEnvironmentDiagnostic(message: string) {
  return message
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(
      /\b(set-cookie|cookie)(?:\\?["'])?\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|\\"(?:(?!\\")[\s\S])*\\"|'(?:\\.|[^'\\])*'|[^,\r\n}]*)/gi,
      "$1=[redacted]",
    )
    .replace(
      /\b(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret(?:[_-]?value)?)(?:\\?["'])?\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|\\"(?:(?!\\")[\s\S])*\\"|'(?:\\.|[^'\\])*'|[^\s,;{}]+)/gi,
      "$1=[redacted]",
    )
    .replace(
      /\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|tskey-[A-Za-z0-9_-]{8,})\b/gi,
      "[redacted]",
    )
    .replace(/\bhttps?:\/\/[^\s"'<>]+/gi, "[url-redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, MAX_DIAGNOSTIC_MESSAGE_LENGTH);
}

async function readFailureDiagnostic(response: any, schema: any) {
  const contentType = response.headers.get("content-type");
  if (!/^application\/(?:problem\+)?json(?:\s*;|$)/i.test(contentType ?? "")) return;
  const contentLength = response.headers.get("content-length");
  if (contentLength != null && Number(contentLength) > MAX_DIAGNOSTIC_BYTES) return;
  const reader = response.body?.getReader();
  if (reader == null) return;
  try {
    const decoder = new TextDecoder();
    let body = "";
    let byteLength = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_DIAGNOSTIC_BYTES) {
        await reader.cancel();
        return;
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    const diagnostic = parsed(schema, JSON.parse(body));
    return diagnostic == null
      ? undefined
      : { code: diagnostic.error.code, message: redactEnvironmentDiagnostic(diagnostic.error.message) };
  } catch {
    return;
  } finally {
    reader.releaseLock();
  }
}

export function createEnvironmentConfigServiceClass(dependencies: EnvironmentConfigDependencies) {
  const schemas = dependencies.schemas;
  return class EnvironmentConfigService extends dependencies.RpcHandlerBase {
    private readonly httpClient: any;
    private readonly logger = dependencies.loggerFactory("environmentConfig");

    constructor(getAuthToken: () => Promise<any>, options: any) {
      super();
      this.httpClient = dependencies.createHttpClient(getAuthToken, options);
    }

    async delete(input: unknown) {
      const request = parsed(schemas.deleteRequest, input);
      if (request == null) return { ok: false, error: "invalid-request" };
      const result = await this.performRequest(
        request,
        `/v1/environment-configs/${encodeURIComponent(request.configId)}`,
        schemas.emptyResponse,
        "log",
      );
      return result.ok ? { ok: true } : result;
    }

    async saveEnvironmentValue(input: unknown) {
      const request = parsed(schemas.saveValueRequest, input);
      return request == null
        ? { ok: false, error: "invalid-request" }
        : this.performRequest(request, "/v1/environment-values", schemas.saveValueResponse);
    }

    async list({ accountId, userId, cursor }: any) {
      const [user, workspace] = await Promise.all(
        ["user", "workspace"].map(async (scope) => {
          const scopeCursor = cursor?.[scope];
          if (cursor != null && scopeCursor == null) return null;
          const query = `scope=${scope}&limit=100${scopeCursor == null ? "" : `&cursor=${encodeURIComponent(scopeCursor)}`}`;
          return this.performRequest(
            { method: "GET", accountId, userId },
            `/v1/environment-configs?${query}`,
            schemas.listResponse,
            "log-and-return",
          );
        }),
      );
      if (user != null && !user.ok) return user;
      if (workspace != null && !workspace.ok) return workspace;
      const userCursor = user?.data.nextCursor ?? null;
      const workspaceCursor = workspace?.data.nextCursor ?? null;
      return {
        ok: true,
        page: {
          data: [...(user?.data.data ?? []), ...(workspace?.data.data ?? [])],
          nextCursor: userCursor == null && workspaceCursor == null
            ? null
            : { user: userCursor, workspace: workspaceCursor },
        },
      };
    }

    async request(input: unknown) {
      try {
        const request = parsed(schemas.configRequest, input);
        if (request == null) return { ok: false, error: "invalid-request" };
        const result = await this.performRequest(request, environmentConfigPath(request), schemas.configResponse, "log-and-return");
        return result.ok ? { ok: true, config: result.data } : result;
      } catch {
        return { ok: false, error: "unavailable" };
      }
    }

    async requestVpn(input: unknown) {
      const request = parsed(schemas.vpnRequest, input);
      return request == null
        ? { ok: false, error: "invalid-request" }
        : this.performRequest(
            request,
            `/v1/environment-configs/${encodeURIComponent(request.configId)}/vpn`,
            schemas.vpnResponse,
            "log",
          );
    }

    async requestPersonalSecrets(input: unknown) {
      const request = parsed(schemas.personalSecretsRequest, input);
      if (request == null) return { ok: false, error: "invalid-request" };
      const query = request.method === "GET"
        ? [
            request.cursor == null ? undefined : `cursor=${encodeURIComponent(request.cursor)}`,
            request.namespace == null ? undefined : `namespace=${request.namespace}`,
          ].filter((value) => value != null).join("&")
        : "";
      const route = `/v1/personal-secrets${query ? `?${query}` : ""}`;
      return request.method === "GET"
        ? this.performRequest(request, route, schemas.personalSecretsListResponse)
        : this.performRequest(request, route, schemas.personalSecretsWriteResponse);
    }

    async preflightPersonalSecrets(input: unknown) {
      const request = parsed(schemas.personalSecretsPreflightRequest, input);
      return request == null
        ? { ok: false, error: "invalid-request" }
        : this.performRequest(
            { ...request, method: "GET" },
            `/v1/personal-secrets/preflight?environment_config_id=${encodeURIComponent(request.configId)}`,
            schemas.personalSecretsPreflightResponse,
          );
    }

    async requestApproval(input: unknown) {
      const request = parsed(schemas.approvalRequest, input);
      if (request == null) return { ok: false, error: "invalid-request" };
      const root = `/v1/environment-configs/${encodeURIComponent(request.configId)}`;
      return this.performRequest(request, `${root}/draft/approve/begin`, schemas.operationResponse, "log");
    }

    async readOperation(input: unknown) {
      const request = parsed(schemas.readOperationRequest, input);
      return request == null
        ? { ok: false, error: "invalid-request" }
        : this.performRequest(
            { ...request, method: "GET" },
            `/v1/environment-operations/${encodeURIComponent(request.operationId)}`,
            schemas.operationResponse,
            "log",
          );
    }

    async listOutboundIdentityConnections(input: unknown) {
      const request = parsed(schemas.outboundListRequest, input);
      if (request == null) return { ok: false, error: "invalid-request" };
      const withMethod = { ...request, method: "GET" };
      return this.performRequest(
        withMethod,
        `/v1/environment-configs/${encodeURIComponent(withMethod.configId)}/outbound-identity-connections`,
        schemas.outboundListResponse,
      );
    }

    async requestOutboundIdentityConnection(input: unknown) {
      const request = parsed(schemas.outboundRequest, input);
      if (request == null) return { ok: false, error: "invalid-request" };
      const root = "/v1/outbound-identity-connections";
      return this.performRequest(
        request,
        request.method === "POST" ? root : `${root}/${encodeURIComponent(request.connectionId)}`,
        schemas.outboundResponse,
      );
    }

    private async performRequest(request: any, path: string, responseSchema: any, diagnostics?: "log" | "log-and-return") {
      let normalizedRoute: string | undefined;
      let startedAt: number | undefined;
      const configId = "configId" in request ? request.configId : undefined;
      let operationId: string | undefined;
      if ("operationId" in request) operationId = request.operationId;
      else if ("body" in request && "idempotency_key" in request.body) operationId = request.body.idempotency_key;
      else if ("body" in request && "operation_id" in request.body) operationId = request.body.operation_id;
      let revision: number | undefined;
      if ("body" in request && "expected_revision" in request.body) revision = request.body.expected_revision;
      else if ("body" in request && "expected_draft_revision" in request.body) revision = request.body.expected_draft_revision;
      try {
        const token = await this.httpClient.getAuthToken();
        if (
          !token ||
          dependencies.accountIdFromToken(token) !== request.accountId ||
          (request.userId != null && dependencies.identityFromToken(token)?.userId !== request.userId)
        )
          return { ok: false, error: "authentication" };
        const identityStillMatches = async () => {
          if (request.userId == null) return true;
          const identity = dependencies.identityFromToken(await this.httpClient.getAuthToken().catch(() => null));
          return identity?.accountId === request.accountId && identity.userId === request.userId;
        };
        normalizedRoute = path;
        if (configId != null) normalizedRoute = normalizedRoute.replace(encodeURIComponent(configId), ":configId");
        if (operationId != null) normalizedRoute = normalizedRoute.replace(encodeURIComponent(operationId), ":operationId");
        normalizedRoute = normalizedRoute.split("?")[0];
        startedAt = dependencies.now();
        const outcome = await this.httpClient.fetch(path, {
          method: request.method,
          token,
          signal: dependencies.timeoutSignal(
            request.method === "POST" && configId != null && !path.endsWith("/begin") ? 600_000 : 30_000,
          ),
          body: "body" in request ? JSON.stringify(request.body) : undefined,
        }).then(async ({ response }: any) =>
          (await identityStillMatches())
            ? {
                response,
                responseBody: response.ok && response.status !== 204 ? await response.json() : undefined,
                diagnostic: !response.ok && diagnostics != null
                  ? await readFailureDiagnostic(response, schemas.failureDiagnostic)
                  : undefined,
              }
            : { authenticationChanged: true },
        ).catch((error: unknown) => ({ error }));
        if ("authenticationChanged" in outcome || !(await identityStillMatches()))
          return { ok: false, error: "authentication" };
        if ("error" in outcome) throw outcome.error;
        const { response, responseBody, diagnostic } = outcome;
        if (!response.ok) {
          if (diagnostics == null) return { ok: false, error: "http", status: response.status };
          const requestId = ["x-request-id", "x-openai-request-id", "traceparent"]
            .map((name) => response.headers.get(name))
            .find((value) => value != null && /^[A-Za-z0-9_.:-]{1,128}$/.test(value));
          const result: any = { ok: false, error: "http", status: response.status };
          if (diagnostics === "log-and-return" && diagnostic != null) result.message = diagnostic.message;
          this.logger().warning("Environment configuration request failed", {
            safe: {
              method: request.method,
              route: normalizedRoute,
              status: response.status,
              code: diagnostic?.code,
              revision,
              timestamp: new Date(startedAt).toISOString(),
              elapsedMs: dependencies.now() - startedAt,
            },
            sensitive: {
              configId,
              ...(operationId == null ? {} : { operationId }),
              requestId,
              message: diagnostic?.message,
            },
          });
          return result;
        }
        const responseResult = responseSchema.safeParse(responseBody);
        return responseResult.success
          ? { ok: true, data: responseResult.data }
          : { ok: false, error: "invalid-response" };
      } catch (error) {
        if (diagnostics == null) return { ok: false, error: "unavailable" };
        const message = error instanceof Error ? redactEnvironmentDiagnostic(error.message) : undefined;
        this.logger().warning("Environment configuration request failed", {
          safe: {
            method: request.method,
            route: normalizedRoute,
            revision,
            errorName: error instanceof Error && ["AbortError", "Error", "TimeoutError", "TypeError"].includes(error.name)
              ? error.name
              : undefined,
            timestamp: startedAt == null ? undefined : new Date(startedAt).toISOString(),
            elapsedMs: startedAt == null ? undefined : dependencies.now() - startedAt,
          },
          sensitive: { configId, ...(operationId == null ? {} : { operationId }), message },
        });
        const result: any = { ok: false, error: "unavailable" };
        if (diagnostics === "log-and-return" && message != null) result.message = message;
        return result;
      }
    }
  };
}
