// 远程环境控制（remote control）：云端环境 REST + 客户端 enrollment/刷新 +
// 设备密钥签名质询 + websocket transport。
//
// 对应 main-C-Mhak1n.ts 65,141-66,068：
//   - 环境 REST（BEe/VEe/HEe/WT/KT/qT/JT/YT，65,146-65,277）：分页递归枚举、
//     rename/delete、404→FeatureUnavailable / 403→PermissionDenied / 401→AuthFailed
//   - RemoteControlWebsocketTransport（JEe extends n.Ut，65,305-65,338）：
//     handshake → enrollClient → authorizeDeviceKeyChallenge
//   - enrollment 状态机（rE，65,405-65,625）：无本地 enrollment → start/finish
//     （step-up token + 设备密钥创建 + 失败清理）；有 → refresh/finish；
//     404/撤销/密钥缺失时清本地重新 enroll
//   - 身份解析（sE/$Ee/oE/aE/QEe）：JWT claims + ChatGPT-Account-Id 头比对
//   - step-up token 校验（eDe/tDe/nDe/uE）：账号一致 + 新鲜度（iat/pwd_auth_time
//     300s）+ scope 恰为 codex.remote_control.enroll
//   - enrollment 查找/持久化（fE/aDe/oDe/pE/sDe/cDe/lDe）：globalState
//     electron-remote-control-client-enrollments 键，多账号身份候选逐一探测
//   - 设备密钥（uDe/mE/dDe/hE/gE/fDe）：Secure Enclave 密钥创建/删除/签名，
//     challenge 与本地 enrollment/设备身份哈希逐字段比对
import { createHash } from "node:crypto";
import {
  wf as objectSchema,
  Of as stringSchema,
  Mf as unknownSchema,
  Ef as recordSchema,
  bs as hostIdOfEnvId,
  Ut as WebSocketConnectionBase,
  Wt as websocketUrlOf,
  eo as enrollmentRecordSchema,
  Qa as keychainErrorOf,
  $a as KEYCHAIN_ERROR_CODE,
  to as parseJwt,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  vt as authedFetch,
  pt as SignInRequiredError,
  mt as applyAuthHeaders,
  ht as applyWorkspaceRouting,
  _t as assertSameAuthIdentity,
  xt as resolveBackendApiUrl,
  bt as getAuthHeaders,
  Y as REMOTE_CONTROL_CLIENT_ENROLLMENTS_KEY,
} from "@chunk/bootstrap";

const logger = memoizedTaggedLogger("remote-control-websocket");

// ---------------------------------------------------------------------------
// 错误类型与常量
// ---------------------------------------------------------------------------

/** 环境列表 404（功能不可用，原 `VT`）。 */
class RemoteControlFeatureUnavailableError extends Error {}
/** 认证失败（原 `HT`）。 */
class RemoteControlAuthError extends Error {}
/** 权限拒绝（原 `UT`）。 */
class RemoteControlPermissionError extends Error {}
/** step-up token 与当前账号不符（原 `WEe`）。 */
class StepUpTokenAccountMismatchError extends Error {
  errorCode = KEYCHAIN_ERROR_CODE;
  constructor() {
    super("Remote control enrollment step-up token does not match current account.");
  }
}

const REMOTE_CONTROL_SCOPES = ["remote_control_controller_websocket"];
const STEP_UP_REQUIRED_SCOPE = "codex.remote_control.enroll";
const STEP_UP_FRESHNESS_SECONDS = 300;
const DEVICE_KEY_STORAGE_TAG = "after-first-unlock-device-key-v1";
const ENVIRONMENTS_PAGE_LIMIT = 100;

/** 错误响应体的 detail 提取 schema（原 `zEe`）。 */
const errorDetailSchema = objectSchema({ detail: stringSchema().optional() });
/** step-up token payload 的 claim 白名单（原 `$T`）。 */
const stepUpClaimsSchema = recordSchema(stringSchema(), unknownSchema());

// ---------------------------------------------------------------------------
// 环境 REST（65,146-65,277）
// ---------------------------------------------------------------------------

interface DesktopApiOptions {
  desktopOriginator?: string;
  devApiBaseUrl: string;
  prodApiBaseUrl: string;
}

interface AppServerClient {
  getBackendRequestAuth(opts: { refreshToken: boolean }): Promise<unknown>;
}

interface RemoteControlEnvironment {
  hostId: string;
  displayName: string;
  hostName: string;
  hasReportedHostName: boolean;
  autoConnect: boolean;
  source: "remote-control";
  envId: string;
  environmentKind: string;
  clientType: string;
  online: boolean;
  busy: boolean;
  os: string;
  arch: string;
  appServerVersion: string;
  installationId: string | null;
  lastSeenAt: string | null;
}

/** 枚举全部环境（分页递归，原 `BEe`/`KT`）。 */
async function listRemoteControlEnvironments({
  appServerClient,
  clientId,
  desktopApiOptions,
}: {
  appServerClient: AppServerClient;
  clientId: string | null;
  desktopApiOptions: DesktopApiOptions;
}): Promise<RemoteControlEnvironment[]> {
  return listEnvironmentsPage({ appServerClient, clientId, desktopApiOptions, cursor: null });
}

async function listEnvironmentsPage({
  appServerClient,
  clientId,
  desktopApiOptions,
  cursor,
}: {
  appServerClient: AppServerClient;
  clientId: string | null;
  desktopApiOptions: DesktopApiOptions;
  cursor: string | null;
}): Promise<RemoteControlEnvironment[]> {
  const page = await (
    await remoteControlRequest({
      action: "load remote control environments",
      appServerClient,
      desktopApiOptions,
      mapNotFoundToFeatureUnavailable: clientId == null,
      method: "GET",
      path: environmentsPath(clientId, cursor),
    })
  ).json();
  const environments = (page as { items: unknown[] }).items.map(normalizeEnvironment);
  return (page as { cursor: string | null }).cursor == null
    ? environments
    : environments.concat(
        await listEnvironmentsPage({ appServerClient, clientId, desktopApiOptions, cursor: (page as { cursor: string }).cursor }),
      );
}

/** 重命名环境（原 `VEe`）。 */
async function renameRemoteControlEnvironment({
  appServerClient,
  desktopApiOptions,
  envId,
  name,
}: {
  appServerClient: AppServerClient;
  desktopApiOptions: DesktopApiOptions;
  envId: string;
  name: string;
}) {
  return normalizeEnvironment(
    await (
      await remoteControlRequest({
        action: "rename remote control environment",
        appServerClient,
        desktopApiOptions,
        method: "PATCH",
        path: environmentPath(envId),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        mapNotFoundToFeatureUnavailable: false,
      })
    ).json(),
  );
}

/** 删除环境（原 `HEe`）。 */
async function deleteRemoteControlEnvironment({
  appServerClient,
  desktopApiOptions,
  envId,
}: {
  appServerClient: AppServerClient;
  desktopApiOptions: DesktopApiOptions;
  envId: string;
}) {
  await remoteControlRequest({
    action: "delete remote control environment",
    appServerClient,
    desktopApiOptions,
    method: "DELETE",
    path: environmentPath(envId),
    mapNotFoundToFeatureUnavailable: false,
  });
}

/** REST 门面（原 `WT`）：404/403/401 的错误映射。 */
async function remoteControlRequest({
  action,
  appServerClient,
  desktopApiOptions,
  path,
  method,
  headers = {},
  body,
  signal,
  mapNotFoundToFeatureUnavailable = true,
}: {
  action: string;
  appServerClient: AppServerClient;
  desktopApiOptions: DesktopApiOptions;
  path: string;
  method: string;
  headers?: Record<string, unknown>;
  body?: string;
  signal?: AbortSignal;
  mapNotFoundToFeatureUnavailable?: boolean;
}): Promise<Response> {
  let response: Response;
  try {
    response = (await authedFetch({
      action,
      appServerClient,
      desktopApiOptions,
      path,
      request: { method, headers, body, signal },
    })) as Response;
  } catch (error) {
    throw error instanceof SignInRequiredError ? new RemoteControlAuthError(error.message) : error;
  }
  if (response.status === 404 && mapNotFoundToFeatureUnavailable) throw new RemoteControlFeatureUnavailableError();
  if (response.status === 403) throw new RemoteControlPermissionError(await errorDetailOf(response));
  if (response.status === 401) throw new RemoteControlAuthError(`Sign in to ChatGPT to ${action}.`);
  if (!response.ok) throw new Error(`Remote control request failed (${response.status}): ${await errorDetailOf(response)}`);
  return response;
}

/** 环境列表路径（原 `UEe`）。 */
function environmentsPath(clientId: string | null, cursor: string | null): string {
  const params = new URLSearchParams({ limit: String(ENVIRONMENTS_PAGE_LIMIT) });
  if (cursor != null) params.set("cursor", cursor);
  return clientId == null
    ? `/codex/remote/control/environments?${params.toString()}`
    : `/codex/remote/control/clients/${encodeURIComponent(clientId)}/environments?${params.toString()}`;
}

function environmentPath(envId: string): string {
  return `/codex/remote/control/environments/${encodeURIComponent(envId)}`;
}

/** 服务端环境记录 → 桌面模型（原 `qT`）。 */
function normalizeEnvironment(entry: Record<string, unknown>): RemoteControlEnvironment {
  const envId = entry.env_id as string;
  const displayName = stringFieldOf(entry, "display_name");
  const hostName = stringFieldOf(entry, "host_name");
  const name = (displayName ?? (entry.name as string) ?? hostName ?? "").trim();
  const host = (hostName ?? (entry.name as string) ?? displayName ?? "").trim();
  const display = name || host || envId;
  const resolvedHost = host || display;
  return {
    hostId: hostIdOfEnvId(envId),
    displayName: display,
    hostName: resolvedHost,
    hasReportedHostName: hostName != null && hostName.trim().length > 0,
    autoConnect: false,
    source: "remote-control",
    envId,
    environmentKind: entry.kind as string,
    clientType: (entry.client_type as string) ?? "CODEX_UNKNOWN",
    online: entry.online as boolean,
    busy: entry.busy as boolean,
    os: entry.os as string,
    arch: entry.arch as string,
    appServerVersion: entry.app_server_version as string,
    installationId: (entry.installation_id as string) ?? null,
    lastSeenAt: (entry.last_seen_at as string) ?? null,
  };
}

function stringFieldOf(entry: Record<string, unknown>, key: string): string | null {
  const value = entry[key];
  return typeof value == "string" ? value : null;
}

/** 错误响应 detail（原 `YT`）。 */
async function errorDetailOf(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return response.statusText || "Unknown error";
    try {
      const parsed = errorDetailSchema.safeParse(JSON.parse(text));
      if (parsed.success && (parsed.data as { detail?: string }).detail != null)
        return (parsed.data as { detail: string }).detail;
    } catch {}
    return text;
  } catch {
    return response.statusText || "Unknown error";
  }
}

// ---------------------------------------------------------------------------
// 身份解析（65,384-65,383 + 65,641-65,674）
// ---------------------------------------------------------------------------

interface AuthIdentity {
  headerChatGptAccountId: string | null;
  tokenAccountId: string | null;
  tokenAccountUserId: string | null;
  tokenAuthUserId: string | null;
  tokenSubject: string | null;
}

/** enrollment 的连接 key（原 `eE`）。 */
function enrollmentConnectionKey(options: DesktopApiOptions): string {
  return [options.desktopOriginator, options.devApiBaseUrl, options.prodApiBaseUrl, DEVICE_KEY_STORAGE_TAG].join("\n");
}

/** enrollment 记录的存储 key（原 `tE`）。 */
function enrollmentStorageKey(connectionKey: string, accountUserId: string): string {
  return `${connectionKey}\n${accountUserId}`;
}

/** 认证头集合（原 `nE`）。 */
async function authedHeaders({
  action = "connect remote control environments",
  appServerClient,
  desktopApiOptions,
  headers,
}: {
  action?: string;
  appServerClient: AppServerClient;
  desktopApiOptions: DesktopApiOptions;
  headers?: Record<string, unknown>;
}) {
  return getAuthHeaders({
    action,
    appServerClient,
    desktopOriginator: desktopApiOptions.desktopOriginator,
    headers,
  });
}

function headerChatGptAccountId(headers: Record<string, unknown>): string | null {
  return ((headers["ChatGPT-Account-Id"] ?? headers["chatgpt-account-id"]) as string) ?? null;
}

function findHeader(headers: Record<string, unknown>, name: string): unknown {
  const lowered = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) if (key.toLowerCase() === lowered) return value;
  return null;
}

/** Authorization: Bearer 的 token（原 `oE`）。 */
function bearerTokenOf(headers: Record<string, unknown>): string | null {
  const value = findHeader(headers, "authorization");
  if (value == null) return null;
  const [scheme, token] = String(value).split(/\s+/, 2);
  return scheme?.toLowerCase() !== "bearer" || !token ? null : token;
}

/** step-up token 的 claims schema（原 `qEe`）。 */
const stepUpIdentitySchema = objectSchema({
  sub: stringSchema().optional(),
  "https://api.openai.com/auth": objectSchema({
    account_id: stringSchema().optional(),
    account_user_id: stringSchema().optional(),
    chatgpt_account_id: stringSchema().optional(),
    chatgpt_account_user_id: stringSchema().optional(),
    user_id: stringSchema().optional(),
  })
    .loose()
    .optional(),
}).loose();

/** 解析 token 身份（原 `$Ee`）。 */
function tokenIdentityOf(token: string) {
  try {
    const parsed = stepUpIdentitySchema.safeParse(decodeJwtPayload(token));
    return parsed.success ? (parsed.data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** 头 + token 的完整身份（原 `sE`）。 */
function resolveAuthIdentity(headers: Record<string, unknown>): AuthIdentity {
  const token = bearerTokenOf(headers);
  const claims = token == null ? null : tokenIdentityOf(token);
  const auth = claims?.["https://api.openai.com/auth"] as Record<string, unknown> | undefined;
  return {
    headerChatGptAccountId: headerChatGptAccountId(headers),
    tokenAccountId: ((auth?.chatgpt_account_id ?? auth?.account_id) as string) ?? null,
    tokenAccountUserId: ((auth?.chatgpt_account_user_id ?? auth?.account_user_id) as string) ?? null,
    tokenAuthUserId: (auth?.user_id as string) ?? null,
    tokenSubject: (claims?.sub as string) ?? null,
  };
}

/** 日志标签（原 `cE`）。 */
function enrollmentLogTags({
  authIdentity,
  existingEnrollment,
  hasExistingEnrollment,
  responseAccountUserId,
  responseChallengeId,
  responseClientId,
}: {
  authIdentity: AuthIdentity;
  existingEnrollment?: EnrollmentRecord | null;
  hasExistingEnrollment: boolean;
  responseAccountUserId?: string;
  responseChallengeId?: string;
  responseClientId?: string;
}) {
  return {
    safe: { hasExistingEnrollment },
    sensitive: {
      headerChatGptAccountId: authIdentity.headerChatGptAccountId,
      localEnrollmentAccountUserId: existingEnrollment?.accountUserId ?? null,
      localEnrollmentClientId: existingEnrollment?.clientId ?? null,
      responseAccountUserId: responseAccountUserId ?? null,
      responseChallengeId: responseChallengeId ?? null,
      responseClientId: responseClientId ?? null,
      selectedAccountUserId: authIdentity.tokenAccountUserId,
      tokenAccountId: authIdentity.tokenAccountId,
      tokenAccountUserId: authIdentity.tokenAccountUserId,
      tokenAuthUserId: authIdentity.tokenAuthUserId,
      tokenSubject: authIdentity.tokenSubject,
    },
  };
}

/** token 响应的日志标签（原 `lE`）。 */
function tokenResponseLogTags(response: TokenResponse) {
  return {
    safe: { expiresAt: response.expires_at, scopes: response.scopes },
    sensitive: { accountUserId: response.account_user_id, clientId: response.client_id },
  };
}

// ---------------------------------------------------------------------------
// step-up token 校验（65,706-65,768）
// ---------------------------------------------------------------------------

/** 校验 step-up token（原 `eDe`）：账号一致 + 新鲜度 + scope。 */
function validateStepUpToken({ accountUserId, stepUpToken }: { accountUserId: string; stepUpToken: string }) {
  const payload = decodeJwtPayload(stepUpToken);
  logStepUpTokenPayload(payload);
  const claims = parseJwt(payload);
  const auth = claims["https://api.openai.com/auth"];
  const tokenAccountUserId = auth.chatgpt_account_user_id ?? auth.account_user_id;
  const scopes = tokenScopesOf(claims);
  if (tokenAccountUserId !== accountUserId) throw new StepUpTokenAccountMismatchError();
  if (Math.floor(Date.now() / 1e3) - claims.iat > STEP_UP_FRESHNESS_SECONDS)
    throw new Error("Remote control enrollment step-up token is not fresh.");
  if (Date.now() - claims.pwd_auth_time > STEP_UP_FRESHNESS_SECONDS * 1e3)
    throw new Error("Remote control enrollment step-up token does not have fresh password auth.");
  if (scopes.length !== 1 || scopes[0] !== STEP_UP_REQUIRED_SCOPE)
    throw new Error("Remote control enrollment step-up token is missing required authorization.");
  return {
    accountUserId: tokenAccountUserId ?? null,
    issuedAt: claims.iat,
    passwordAuthTime: claims.pwd_auth_time,
    scopes,
  };
}

/** scope + scp 合并去重（原 `tDe`）。 */
function tokenScopesOf(claims: { scope?: string; scp?: string[] }): string[] {
  const scopes = new Set<string>();
  for (const scope of claims.scope?.split(/\s+/) ?? []) if (scope.length > 0) scopes.add(scope);
  for (const scope of claims.scp ?? []) if (scope.length > 0) scopes.add(scope);
  return [...scopes];
}

/** step-up payload 的结构日志（原 `nDe`）。 */
function logStepUpTokenPayload(payload: unknown) {
  const parsed = stepUpClaimsSchema.safeParse(payload);
  if (!parsed.success) {
    logger().warning("remote_control_step_up_token_payload_unexpected", {
      safe: { payloadType: typeof payload },
      sensitive: {},
    });
    return;
  }
  const claims = parsed.data;
  const auth = stepUpClaimsSchema.safeParse(claims["https://api.openai.com/auth"]);
  const mfa = stepUpClaimsSchema.safeParse(claims["https://api.openai.com/mfa"]);
  logger().info("remote_control_step_up_token_payload_decoded", {
    safe: {
      claimKeys: Object.keys(claims).sort(),
      hasScope: typeof claims.scope == "string",
      hasScopeArray: Array.isArray(claims.scp),
      hasIssuedAt: typeof claims.iat == "number",
      hasPasswordAuthTime: typeof claims.pwd_auth_time == "number",
      authClaimKeys: auth.success ? Object.keys(auth.data).sort() : null,
      hasAuthAmr: Array.isArray((auth.data as { amr?: unknown })?.amr),
      hasAuthAccountUserId: typeof (auth.data as { chatgpt_account_user_id?: unknown })?.chatgpt_account_user_id == "string",
      hasLegacyAuthAccountUserId: typeof (auth.data as { account_user_id?: unknown })?.account_user_id == "string",
      mfaClaimKeys: mfa.success ? Object.keys(mfa.data).sort() : null,
      hasMfaRequired: typeof (mfa.data as { required?: unknown })?.required == "string",
    },
    sensitive: {},
  });
}

/** JWT payload 解码（原 `uE`）。 */
function decodeJwtPayload(token: string): Record<string, never> {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) throw new Error("Remote control enrollment step-up token is malformed.");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

// ---------------------------------------------------------------------------
// enrollment 查找与持久化（65,804-65,876）
// ---------------------------------------------------------------------------

interface EnrollmentRecord {
  accountUserId: string;
  algorithm: string;
  clientId: string;
  keyId: string;
  protectionClass: string;
  publicKeySpkiDerBase64: string;
}

interface DeviceKeyClient {
  createDeviceKey(protection: string): Promise<{ algorithm: string; keyId: string; protectionClass: string; publicKeySpkiDerBase64: string }>;
  deleteDeviceKey(keyId: string): Promise<void>;
  getDeviceKeyPublic(keyId: string): Promise<{ keyId: string; publicKeySpkiDerBase64: string; algorithm: string; protectionClass: string }>;
  signDeviceKey(keyId: string, payload: unknown): Promise<{ signatureDerBase64: string; signedPayloadBase64: string; algorithm: string }>;
}

type GlobalStateLike = {
  get(key: unknown): unknown;
  update(key: unknown, fn: (value: unknown) => unknown): void;
};

/** 候选身份的 enrollment 探测（原 `fE`）：逐候选尝试，keychain 缺失跳过。 */
async function findExistingEnrollment({
  authIdentity,
  connectionKey,
  deviceKeyClient,
  globalState,
}: {
  authIdentity: AuthIdentity;
  connectionKey: string;
  deviceKeyClient: DeviceKeyClient;
  globalState: GlobalStateLike;
}): Promise<{ key: string; record: EnrollmentRecord } | null> {
  const attempts = await Promise.all(
    candidateAccountUserIds(authIdentity).map(async (accountUserId) => {
      const key = enrollmentStorageKey(connectionKey, accountUserId);
      try {
        return {
          key,
          record: await readValidatedEnrollment({ deviceKeyClient, enrollmentKey: key, globalState }),
        };
      } catch (error) {
        if (keychainErrorOf(error) == null) throw error;
        return { key, record: null, error };
      }
    }),
  );
  const hit = attempts.find((attempt) => attempt.record != null);
  if (hit?.record != null) return { key: hit.key, record: hit.record };
  const failed = attempts.find((attempt) => "error" in attempt);
  if (failed != null) throw (failed as { error: unknown }).error;
  return null;
}

/** 候选账号身份（原 `aDe`）：token 主体 + 头匹配时的 auth user id。 */
function candidateAccountUserIds(identity: AuthIdentity): string[] {
  if (identity.tokenAccountUserId == null) return [];
  const candidates = [identity.tokenAccountUserId];
  if (
    identity.tokenAccountId != null &&
    identity.headerChatGptAccountId === identity.tokenAccountId &&
    identity.tokenAuthUserId != null &&
    identity.tokenAuthUserId !== identity.tokenAccountUserId
  )
    candidates.push(identity.tokenAuthUserId);
  return candidates;
}

/** 读取并校验本地 enrollment（原 `oDe`/`pE`）：记录与密钥库逐字段比对。 */
async function readValidatedEnrollment({
  deviceKeyClient,
  enrollmentKey,
  globalState,
}: {
  deviceKeyClient: DeviceKeyClient;
  enrollmentKey: string;
  globalState: GlobalStateLike;
}): Promise<EnrollmentRecord | null> {
  const stored = readStoredEnrollment(globalState, enrollmentKey);
  if (stored == null) return null;
  try {
    const key = await deviceKeyClient.getDeviceKeyPublic(stored.keyId);
    return key.keyId === stored.keyId &&
      key.publicKeySpkiDerBase64 === stored.publicKeySpkiDerBase64 &&
      key.algorithm === stored.algorithm &&
      key.protectionClass === stored.protectionClass
      ? stored
      : null;
  } catch (error) {
    if (keychainErrorOf(error) != null) throw error;
    return null;
  }
}

function readStoredEnrollment(globalState: GlobalStateLike, enrollmentKey: string): EnrollmentRecord | null {
  const all = (globalState.get(REMOTE_CONTROL_CLIENT_ENROLLMENTS_KEY) ?? {}) as Record<string, unknown>;
  const parsed = enrollmentRecordSchema.safeParse(all[enrollmentKey]);
  return parsed.success ? (parsed.data as never) : null;
}

/** 保存 enrollment（原 `sDe`）。 */
function storeEnrollment(globalState: GlobalStateLike, storageKey: string, record: EnrollmentRecord) {
  globalState.update(REMOTE_CONTROL_CLIENT_ENROLLMENTS_KEY, (all) => ({ ...(all as object), [storageKey]: record }));
}

/** 删除 enrollment（原 `cDe`）。 */
function forgetEnrollment(globalState: GlobalStateLike, storageKey: string) {
  globalState.update(REMOTE_CONTROL_CLIENT_ENROLLMENTS_KEY, (all) => {
    const next = { ...(all as Record<string, unknown>) };
    delete next[storageKey];
    return next;
  });
}

/** 可静默重新 enroll 的失败（原 `lDe`）。 */
function isEnrollmentRevokedError(error: unknown): boolean {
  return error instanceof Error
    ? error.message === "Remote control request failed (404): Remote-control client not found" ||
        error.message === "Remote-control client has been revoked" ||
        error.message === "Remote control request failed (401): Remote-control client enrollment is incomplete" ||
        error.message === "Remote control request failed (403): Remote-control client key material missing"
    : false;
}

// ---------------------------------------------------------------------------
// 设备密钥（65,877-66,068）
// ---------------------------------------------------------------------------

/** 创建设备密钥 enrollment 记录（原 `uDe`）。 */
async function createDeviceKeyEnrollment({
  accountUserId,
  clientId,
  deviceKeyClient,
}: {
  accountUserId: string;
  clientId: string;
  deviceKeyClient: DeviceKeyClient;
}): Promise<EnrollmentRecord> {
  const key = await deviceKeyClient.createDeviceKey("allow_os_protected_nonextractable");
  return {
    accountUserId,
    algorithm: key.algorithm,
    clientId,
    keyId: key.keyId,
    protectionClass: key.protectionClass,
    publicKeySpkiDerBase64: key.publicKeySpkiDerBase64,
  };
}

/** 删除设备密钥（失败仅告警，原 `mE`）。 */
async function deleteDeviceKeyQuietly({ deviceKeyClient, enrollment }: { deviceKeyClient: DeviceKeyClient; enrollment: EnrollmentRecord }) {
  try {
    await deviceKeyClient.deleteDeviceKey(enrollment.keyId);
  } catch (error) {
    logger().warning("remote_control_client_enrollment_key_cleanup_failed", {
      safe: {},
      sensitive: { accountUserId: enrollment.accountUserId, clientId: enrollment.clientId, keyId: enrollment.keyId, error },
    });
  }
}

/** 设备身份上报（原 `dDe`）。 */
function deviceIdentityPayload(enrollment: EnrollmentRecord) {
  return {
    key_id: enrollment.keyId,
    public_key_spki_der_base64: enrollment.publicKeySpkiDerBase64,
    algorithm: enrollment.algorithm,
    protection_class: enrollment.protectionClass,
  };
}

/** 设备身份哈希（原 `hE`）。 */
function deviceIdentityHash(enrollment: EnrollmentRecord): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        algorithm: enrollment.algorithm,
        keyId: enrollment.keyId,
        protectionClass: enrollment.protectionClass,
        publicKeySpkiDerBase64: enrollment.publicKeySpkiDerBase64,
      }),
    )
    .digest("base64url");
}

/** API base（原 `rDe`）。 */
function apiBaseUrl(options: DesktopApiOptions): string {
  const override = process.env.CODEX_API_BASE_URL;
  return override && override.trim().length > 0
    ? override.replace(/\/+$/, "")
    : (process.env.CODEX_API_ENDPOINT ?? "").toLowerCase() === "localhost"
      ? options.devApiBaseUrl
      : options.prodApiBaseUrl;
}

/** challenge 的目标 origin/path（原 `iDe`）。 */
function challengeTarget(options: DesktopApiOptions, path: string, auth: { token: string; routing: unknown }) {
  const url = new URL(path.replace(/^\/+/, ""), `${apiBaseUrl(options).replace(/\/+$/, "")}/`);
  return { targetOrigin: new URL(applyWorkspaceRouting(url.href, {}, auth)).origin, targetPath: url.pathname };
}

interface DeviceKeyChallenge {
  purpose: string;
  audience: string;
  account_user_id: string;
  client_id: string;
  target_origin: string;
  target_path: string;
  device_identity_hash?: string | null;
  challenge_expires_at: string;
  challenge_id: string;
  challenge_token: string;
  nonce: string;
}

/** enrollment/refresh 的 challenge 签名（原 `gE`）。 */
async function signEnrollmentChallenge({
  auth,
  challenge,
  deviceKeyClient,
  desktopApiOptions,
  enrollment,
  expectedPath,
  requireDeviceIdentityHash,
}: {
  auth: { token: string; signal: AbortSignal; routing: unknown };
  challenge: DeviceKeyChallenge;
  deviceKeyClient: DeviceKeyClient;
  desktopApiOptions: DesktopApiOptions;
  enrollment: EnrollmentRecord;
  expectedPath: string;
  requireDeviceIdentityHash: boolean;
}) {
  const expected = challengeTarget(desktopApiOptions, expectedPath, auth);
  if (
    challenge.purpose !== "remote_control_client_enrollment" ||
    challenge.audience !== "remote_control_client_enrollment" ||
    challenge.account_user_id !== enrollment.accountUserId ||
    challenge.client_id !== enrollment.clientId ||
    challenge.target_origin !== expected.targetOrigin ||
    challenge.target_path !== expected.targetPath
  )
    throw (
      logger().warning("remote_control_client_enrollment_challenge_mismatch", {
        safe: {},
        sensitive: {
          accountUserId: challenge.account_user_id,
          clientId: challenge.client_id,
          enrollmentAccountUserId: enrollment.accountUserId,
          enrollmentClientId: enrollment.clientId,
          expectedTargetOrigin: expected.targetOrigin,
          expectedTargetPath: expected.targetPath,
          targetOrigin: challenge.target_origin,
          targetPath: challenge.target_path,
        },
      }),
      new Error("Remote control enrollment challenge does not match local enrollment.")
    );
  if (requireDeviceIdentityHash && challenge.device_identity_hash == null)
    throw new Error("Remote control enrollment challenge is missing device identity hash.");
  const identityHash = challenge.device_identity_hash ?? deviceIdentityHash(enrollment);
  if (identityHash !== deviceIdentityHash(enrollment))
    throw new Error("Remote control enrollment challenge does not match local device identity.");
  logger().info("remote_control_client_enrollment_challenge_signing", {
    safe: {
      challengeExpiresAt: challenge.challenge_expires_at,
      purpose: challenge.purpose,
      requireDeviceIdentityHash,
    },
    sensitive: {
      accountUserId: challenge.account_user_id,
      challengeId: challenge.challenge_id,
      clientId: challenge.client_id,
      expectedTargetOrigin: expected.targetOrigin,
      expectedTargetPath: expected.targetPath,
      keyId: enrollment.keyId,
      targetOrigin: challenge.target_origin,
      targetPath: challenge.target_path,
    },
  });
  const signed = await deviceKeyClient.signDeviceKey(enrollment.keyId, {
    type: "remoteControlClientEnrollment",
    nonce: challenge.nonce,
    audience: "remote_control_client_enrollment",
    challengeId: challenge.challenge_id,
    targetOrigin: challenge.target_origin,
    targetPath: challenge.target_path,
    accountUserId: challenge.account_user_id,
    clientId: challenge.client_id,
    deviceIdentitySha256Base64url: identityHash,
    challengeExpiresAt: challenge.challenge_expires_at,
  });
  logger().info("remote_control_client_enrollment_challenge_signed", {
    safe: { algorithm: signed.algorithm },
    sensitive: {
      accountUserId: challenge.account_user_id,
      challengeId: challenge.challenge_id,
      clientId: challenge.client_id,
      keyId: enrollment.keyId,
    },
  });
  return {
    challenge_token: challenge.challenge_token,
    key_id: enrollment.keyId,
    signature_der_base64: signed.signatureDerBase64,
    signed_payload_base64: signed.signedPayloadBase64,
    algorithm: signed.algorithm,
  };
}

/** websocket 连接的 device-key 质询签名（原 `fDe`）。 */
async function authorizeDeviceKeyChallenge({
  challenge,
  deviceKeyClient,
  enrollmentKey,
  globalState,
}: {
  challenge: {
    audience: string;
    nonce: string;
    sessionId: string;
    targetOrigin: string;
    targetPath: string;
    accountUserId: string;
    clientId: string;
    tokenSha256Base64url: string;
    tokenExpiresAt: string;
    scopes: string[];
  };
  deviceKeyClient: DeviceKeyClient;
  enrollmentKey: string;
  globalState: GlobalStateLike;
}) {
  const enrollment = await readValidatedEnrollment({
    deviceKeyClient,
    enrollmentKey: enrollmentStorageKey(enrollmentKey, challenge.accountUserId),
    globalState,
  });
  logger().debug("remote_control_websocket_device_key_challenge", {
    safe: { audience: challenge.audience, hasLocalEnrollment: enrollment != null },
    sensitive: {
      accountUserId: challenge.accountUserId,
      clientId: challenge.clientId,
      localEnrollmentAccountUserId: enrollment?.accountUserId ?? null,
      localEnrollmentClientId: enrollment?.clientId ?? null,
      sessionId: challenge.sessionId,
      targetOrigin: challenge.targetOrigin,
      targetPath: challenge.targetPath,
    },
  });
  if (enrollment == null || enrollment.accountUserId !== challenge.accountUserId || enrollment.clientId !== challenge.clientId)
    throw (
      logger().warning("remote_control_websocket_device_key_challenge_mismatch", {
        safe: { hasLocalEnrollment: enrollment != null },
        sensitive: {
          accountUserId: challenge.accountUserId,
          clientId: challenge.clientId,
          localEnrollmentAccountUserId: enrollment?.accountUserId ?? null,
          localEnrollmentClientId: enrollment?.clientId ?? null,
          sessionId: challenge.sessionId,
        },
      }),
      new Error("Remote control device-key challenge has no matching local key.")
    );
  const payload = {
    type: "remoteControlClientConnection",
    nonce: challenge.nonce,
    audience: challenge.audience,
    sessionId: challenge.sessionId,
    targetOrigin: challenge.targetOrigin,
    targetPath: challenge.targetPath,
    accountUserId: challenge.accountUserId,
    clientId: challenge.clientId,
    tokenSha256Base64url: challenge.tokenSha256Base64url,
    tokenExpiresAt: challenge.tokenExpiresAt,
    scopes: challenge.scopes,
  };
  const signed = await deviceKeyClient.signDeviceKey(enrollment.keyId, payload);
  logger().info("remote_control_websocket_device_key_challenge_signed", {
    safe: { algorithm: signed.algorithm, scopes: challenge.scopes, tokenExpiresAt: challenge.tokenExpiresAt },
    sensitive: {
      accountUserId: challenge.accountUserId,
      clientId: challenge.clientId,
      keyId: enrollment.keyId,
      sessionId: challenge.sessionId,
      targetOrigin: challenge.targetOrigin,
      targetPath: challenge.targetPath,
    },
  });
  return {
    type: "device_key_proof",
    keyId: enrollment.keyId,
    signatureDerBase64: signed.signatureDerBase64,
    signedPayloadBase64: signed.signedPayloadBase64,
    algorithm: signed.algorithm,
  };
}

// ---------------------------------------------------------------------------
// enrollment 状态机（65,405-65,625）
// ---------------------------------------------------------------------------

interface TokenResponse {
  client_id: string;
  account_user_id: string;
  expires_at: string;
  scopes: string[];
  remote_control_token: string;
}

/** enroll/refresh 的 POST（原 `dE`）。 */
async function postEnrollmentRequest({
  appServerClient,
  body,
  desktopApiOptions,
  headers,
  mapNotFoundToFeatureUnavailable,
  path,
  signal,
}: {
  appServerClient: AppServerClient;
  body: unknown;
  desktopApiOptions: DesktopApiOptions;
  headers: Record<string, unknown>;
  mapNotFoundToFeatureUnavailable?: boolean;
  path: string;
  signal?: AbortSignal;
}) {
  return await (
    await remoteControlRequest({
      action: "connect remote control environments",
      appServerClient,
      desktopApiOptions,
      headers: { ...headers, "content-type": "application/json" },
      method: "POST",
      path,
      signal,
      body: JSON.stringify(body),
      mapNotFoundToFeatureUnavailable,
    })
  ).json();
}

/**
 * enroll 或刷新客户端（原 `rE`）。
 * 无本地 enrollment：start → 创建设备密钥 → step-up → finish → 持久化。
 * 有本地 enrollment：refresh/finish；被撤销时清本地密钥后重新 enroll。
 */
async function enrollClient({
  appServerClient,
  deviceKeyClient,
  desktopApiOptions,
  enrollmentKey,
  globalState,
  headers,
  onEnrollmentAuthorizationRequired,
  requestRemoteControlEnrollmentStepUpToken,
}: {
  appServerClient: AppServerClient;
  deviceKeyClient: DeviceKeyClient;
  desktopApiOptions: DesktopApiOptions;
  enrollmentKey: string;
  globalState: GlobalStateLike;
  headers?: Record<string, unknown>;
  onEnrollmentAuthorizationRequired?: () => Promise<void>;
  requestRemoteControlEnrollmentStepUpToken?: (args: { accountId: string | null }) => Promise<string>;
}) {
  const backendAuth = (await appServerClient.getBackendRequestAuth({ refreshToken: false })) as {
    token: string;
    signal: AbortSignal;
    routing: unknown;
  } | null;
  if (backendAuth == null) throw new SignInRequiredError("connect remote control environments");
  assertSameAuthIdentity(bearerTokenOf(headers ?? {}), backendAuth);
  backendAuth.signal.throwIfAborted();

  const authIdentity = resolveAuthIdentity(headers ?? {});
  const accountUserId = authIdentity.tokenAccountUserId;
  if (accountUserId == null)
    throw new Error("Remote control enrollment requires the current ChatGPT account user id.");
  const accountId = authIdentity.tokenAccountId ?? authIdentity.headerChatGptAccountId;
  const existing = await findExistingEnrollment({ authIdentity, connectionKey: enrollmentKey, deviceKeyClient, globalState });
  const existingRecord = existing?.record ?? null;
  const fallbackStorageKey = enrollmentStorageKey(enrollmentKey, accountUserId);
  const storageKey = existing?.key ?? fallbackStorageKey;
  let enrollment = existingRecord;
  let tokenResponse: TokenResponse;

  if (enrollment == null) {
    // —— 新 enrollment：start → 设备密钥 → step-up → finish ——
    if (requestRemoteControlEnrollmentStepUpToken == null) {
      await onEnrollmentAuthorizationRequired?.();
      throw new Error("Remote control enrollment requires explicit authorization in settings.");
    }
    logger().info("remote_control_client_enrollment_start_request", {
      ...enrollmentLogTags({ authIdentity, hasExistingEnrollment: false }),
    });
    const start = (await postEnrollmentRequest({
      path: "/codex/remote/control/client/enroll/start",
      signal: backendAuth.signal,
      appServerClient,
      body: {},
      desktopApiOptions,
      headers: headers ?? {},
    })) as { account_user_id: string; client_id: string; device_key_challenge: DeviceKeyChallenge };
    logger().info("remote_control_client_enrollment_start_response", {
      ...enrollmentLogTags({
        authIdentity,
        hasExistingEnrollment: false,
        responseAccountUserId: start.account_user_id,
        responseClientId: start.client_id,
        responseChallengeId: start.device_key_challenge.challenge_id,
      }),
    });
    if (
      start.account_user_id !== accountUserId &&
      (authIdentity.tokenAccountId == null ||
        authIdentity.headerChatGptAccountId !== authIdentity.tokenAccountId ||
        authIdentity.tokenAuthUserId !== start.account_user_id)
    )
      throw (
        logger().warning("remote_control_client_enrollment_start_account_mismatch", {
          ...enrollmentLogTags({
            authIdentity,
            hasExistingEnrollment: false,
            responseAccountUserId: start.account_user_id,
            responseClientId: start.client_id,
            responseChallengeId: start.device_key_challenge.challenge_id,
          }),
        }),
        new Error("Remote control enrollment start does not match current account.")
      );
    enrollment = await createDeviceKeyEnrollment({ accountUserId: start.account_user_id, clientId: start.client_id, deviceKeyClient });
    try {
      logger().info("remote_control_client_enrollment_key_created", {
        safe: { algorithm: enrollment.algorithm, protectionClass: enrollment.protectionClass },
        sensitive: { accountUserId: enrollment.accountUserId, clientId: enrollment.clientId, keyId: enrollment.keyId },
      });
      if (requestRemoteControlEnrollmentStepUpToken == null)
        throw new Error("Remote control enrollment requires a step-up authorization flow.");
      logger().info("remote_control_client_enrollment_step_up_requested", {
        ...enrollmentLogTags({
          authIdentity,
          hasExistingEnrollment: false,
          responseAccountUserId: start.account_user_id,
          responseChallengeId: start.device_key_challenge.challenge_id,
          responseClientId: start.client_id,
        }),
      });
      const stepUpToken = await requestRemoteControlEnrollmentStepUpToken({ accountId });
      const validated = validateStepUpToken({ accountUserId, stepUpToken });
      const tags = enrollmentLogTags({
        authIdentity,
        hasExistingEnrollment: false,
        responseAccountUserId: start.account_user_id,
        responseChallengeId: start.device_key_challenge.challenge_id,
        responseClientId: start.client_id,
      });
      logger().info("remote_control_client_enrollment_step_up_validated", {
        safe: { ...tags.safe, stepUpTokenScopes: validated.scopes },
        sensitive: {
          ...tags.sensitive,
          stepUpIssuedAt: validated.issuedAt,
          stepUpPasswordAuthTime: validated.passwordAuthTime,
          stepUpTokenAccountUserId: validated.accountUserId,
        },
      });
      tokenResponse = (await postEnrollmentRequest({
        path: "/codex/remote/control/client/enroll/finish",
        signal: backendAuth.signal,
        appServerClient,
        body: {
          client_id: enrollment.clientId,
          step_up_token: stepUpToken,
          device_identity: deviceIdentityPayload(enrollment),
          device_key_proof: await signEnrollmentChallenge({
            auth: backendAuth,
            challenge: start.device_key_challenge,
            deviceKeyClient,
            desktopApiOptions,
            enrollment,
            expectedPath: "/codex/remote/control/client/enroll/finish",
            requireDeviceIdentityHash: false,
          }),
        },
        desktopApiOptions,
        headers: headers ?? {},
      })) as TokenResponse;
      logger().info("remote_control_client_enrollment_finish_response", { ...tokenResponseLogTags(tokenResponse) });
      backendAuth.signal.throwIfAborted();
      validateTokenResponse(tokenResponse, enrollment);
      storeEnrollment(globalState, enrollmentStorageKey(enrollmentKey, enrollment.accountUserId), enrollment);
    } catch (error) {
      throw (await deleteDeviceKeyQuietly({ deviceKeyClient, enrollment }), error);
    }
  } else {
    // —— 已有 enrollment：refresh ——
    logger().info("remote_control_client_refresh_start_request", {
      ...enrollmentLogTags({ authIdentity, existingEnrollment: existingRecord, hasExistingEnrollment: true }),
    });
    let refreshStart: { account_user_id: string; client_id: string; device_key_challenge: DeviceKeyChallenge };
    try {
      refreshStart = (await postEnrollmentRequest({
        path: "/codex/remote/control/client/refresh/start",
        signal: backendAuth.signal,
        mapNotFoundToFeatureUnavailable: false,
        appServerClient,
        body: { client_id: enrollment.clientId },
        desktopApiOptions,
        headers: headers ?? {},
      })) as never;
    } catch (error) {
      if (!isEnrollmentRevokedError(error)) throw error;
      // 被撤销：清本地密钥与记录后递归重新 enroll。
      return (
        await deleteDeviceKeyQuietly({ deviceKeyClient, enrollment }),
        forgetEnrollment(globalState, storageKey),
        enrollClient({
          appServerClient,
          deviceKeyClient,
          desktopApiOptions,
          enrollmentKey,
          globalState,
          headers,
          onEnrollmentAuthorizationRequired,
          requestRemoteControlEnrollmentStepUpToken,
        })
      );
    }
    logger().info("remote_control_client_refresh_start_response", {
      ...enrollmentLogTags({
        authIdentity,
        existingEnrollment: existingRecord,
        hasExistingEnrollment: true,
        responseAccountUserId: refreshStart.account_user_id,
        responseClientId: refreshStart.client_id,
        responseChallengeId: refreshStart.device_key_challenge.challenge_id,
      }),
    });
    if (refreshStart.client_id !== enrollment.clientId || refreshStart.account_user_id !== enrollment.accountUserId)
      throw (
        logger().warning("remote_control_client_refresh_start_mismatch", {
          ...enrollmentLogTags({
            authIdentity,
            existingEnrollment: existingRecord,
            hasExistingEnrollment: true,
            responseAccountUserId: refreshStart.account_user_id,
            responseClientId: refreshStart.client_id,
            responseChallengeId: refreshStart.device_key_challenge.challenge_id,
          }),
        }),
        new Error("Remote control refresh challenge does not match local enrollment.")
      );
    tokenResponse = (await postEnrollmentRequest({
      path: "/codex/remote/control/client/refresh/finish",
      signal: backendAuth.signal,
      appServerClient,
      body: {
        client_id: enrollment.clientId,
        device_key_proof: await signEnrollmentChallenge({
          auth: backendAuth,
          challenge: refreshStart.device_key_challenge,
          deviceKeyClient,
          desktopApiOptions,
          enrollment,
          expectedPath: "/codex/remote/control/client/refresh/finish",
          requireDeviceIdentityHash: true,
        }),
      },
      desktopApiOptions,
      headers: headers ?? {},
    })) as TokenResponse;
    logger().info("remote_control_client_refresh_finish_response", { ...tokenResponseLogTags(tokenResponse) });
  }

  backendAuth.signal.throwIfAborted();
  const validated = validateTokenResponse(tokenResponse, enrollment);
  return {
    clientId: tokenResponse.client_id,
    headers: { "x-codex-client-session-token": `Bearer ${tokenResponse.remote_control_token}` },
    tokenExpiresAt: validated.tokenExpiresAt,
    scopes: validated.scopes,
    requiresDeviceKeyProof: true,
  };
}

/** token 响应校验（原 `iE`）。 */
function validateTokenResponse(response: TokenResponse, enrollment: EnrollmentRecord) {
  if (response.client_id !== enrollment.clientId || response.account_user_id !== enrollment.accountUserId)
    throw new Error("Remote control token response does not match local enrollment.");
  const expiresAt = parseEpochSeconds(response.expires_at);
  if (expiresAt == null || expiresAt <= Math.floor(Date.now() / 1e3))
    throw new Error("Remote control token response has invalid expiration.");
  if (response.scopes.length !== REMOTE_CONTROL_SCOPES.length || !REMOTE_CONTROL_SCOPES.every((scope, i) => response.scopes[i] === scope))
    throw new Error("Remote control token response has unexpected scopes.");
  return { tokenExpiresAt: expiresAt, scopes: [...REMOTE_CONTROL_SCOPES] };
}

function parseEpochSeconds(value: string): number | undefined {
  if (value == null) return;
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) return Math.floor(parsed / 1e3);
}

// ---------------------------------------------------------------------------
// websocket transport + 授权入口（65,305-65,383）
// ---------------------------------------------------------------------------

/** 远程控制 websocket transport（原 `JEe`）。 */
class RemoteControlWebsocketTransport extends WebSocketConnectionBase {
  constructor(options: {
    appServerClient: AppServerClient;
    desktopApiOptions: DesktopApiOptions;
    globalState: GlobalStateLike;
    deviceKeyClient: DeviceKeyClient;
    hostConfig: { env_id: string };
    onEnrollmentAuthorizationRequired?: () => Promise<void>;
    requestRemoteControlEnrollmentStepUpToken?: (args: { accountId: string | null }) => Promise<string>;
  }) {
    const connectionKey = enrollmentConnectionKey(options.desktopApiOptions);
    const globalState = options.globalState;
    const deviceKeyClient = options.deviceKeyClient;
    super({
      envId: options.hostConfig.env_id,
      connectionGroup: options.appServerClient,
      connectionKey,
      getHandshake: async ({ headers = {} } = {}) => {
        const backendAuth = (await options.appServerClient.getBackendRequestAuth({ refreshToken: false })) as {
          token: string;
          signal: AbortSignal;
          routing: unknown;
        } | null;
        if (backendAuth == null) throw new Error("Sign in to ChatGPT to connect remote control environments.");
        const requestHeaders = { ...headers };
        const explicitToken = findHeader(requestHeaders, "authorization");
        assertSameAuthIdentity(explicitToken?.replace(/^Bearer /i, ""), backendAuth);
        applyAuthHeaders(requestHeaders, backendAuth.token, options.desktopApiOptions);
        const url = applyWorkspaceRouting(resolveBackendApiUrl(options.desktopApiOptions, "/codex/remote/control/client"), requestHeaders, backendAuth);
        return { url: websocketUrlOf(url), headers: requestHeaders, signal: backendAuth.signal };
      },
      enrollClient: ({ headers }) =>
        enrollClient({
          appServerClient: options.appServerClient,
          deviceKeyClient,
          desktopApiOptions: options.desktopApiOptions,
          enrollmentKey: connectionKey,
          globalState,
          headers,
          onEnrollmentAuthorizationRequired: options.onEnrollmentAuthorizationRequired,
          requestRemoteControlEnrollmentStepUpToken: options.requestRemoteControlEnrollmentStepUpToken,
        }),
      authorizeDeviceKeyChallenge: (challenge: never) =>
        authorizeDeviceKeyChallenge({ challenge, deviceKeyClient, enrollmentKey: connectionKey, globalState }),
    } as never);
  }
}

/** 授权入口（原 `YEe`）：enroll 或刷新。 */
async function authorizeRemoteControlEnvironments({
  appServerClient,
  desktopApiOptions,
  deviceKeyClient,
  globalState,
  requestRemoteControlEnrollmentStepUpToken,
}: {
  appServerClient: AppServerClient;
  desktopApiOptions: DesktopApiOptions;
  deviceKeyClient: DeviceKeyClient;
  globalState: GlobalStateLike;
  requestRemoteControlEnrollmentStepUpToken?: (args: { accountId: string | null }) => Promise<string>;
}) {
  await enrollClient({
    appServerClient,
    deviceKeyClient,
    desktopApiOptions,
    enrollmentKey: enrollmentConnectionKey(desktopApiOptions),
    globalState,
    headers: (await authedHeaders({
      action: "authorize remote control environments",
      appServerClient,
      desktopApiOptions,
    })) as Record<string, unknown>,
    requestRemoteControlEnrollmentStepUpToken,
  });
}

/** 检查是否已授权（原 `XEe`）。 */
async function checkRemoteControlAuthorization({
  appServerClient,
  desktopApiOptions,
  deviceKeyClient,
  globalState,
}: {
  appServerClient: AppServerClient;
  desktopApiOptions: DesktopApiOptions;
  deviceKeyClient: DeviceKeyClient;
  globalState: GlobalStateLike;
}) {
  const authIdentity = resolveAuthIdentity(
    (await authedHeaders({
      action: "check remote control authorization",
      appServerClient,
      desktopApiOptions,
    })) as Record<string, unknown>,
  );
  if (authIdentity.tokenAccountUserId == null) return { clientAuthorized: false, clientId: null };
  const existing = await findExistingEnrollment({
    authIdentity,
    connectionKey: enrollmentConnectionKey(desktopApiOptions),
    deviceKeyClient,
    globalState,
  }).catch((error) => {
    if (keychainErrorOf(error) != null) return null;
    throw error;
  });
  return { clientAuthorized: existing != null, clientId: existing?.record.clientId ?? null };
}

export {
  RemoteControlFeatureUnavailableError,
  RemoteControlAuthError,
  RemoteControlPermissionError,
  StepUpTokenAccountMismatchError,
  listRemoteControlEnvironments,
  renameRemoteControlEnvironment,
  deleteRemoteControlEnvironment,
  RemoteControlWebsocketTransport,
  authorizeRemoteControlEnvironments,
  checkRemoteControlAuthorization,
  enrollClient,
  enrollmentConnectionKey,
  resolveAuthIdentity,
  type RemoteControlEnvironment,
  type DesktopApiOptions,
  type AppServerClient,
  type DeviceKeyClient,
  type GlobalStateLike,
};
