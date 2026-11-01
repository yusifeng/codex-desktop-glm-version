// Statsig 应用适配层 + stableId 存储 + 线程摘要 SQLite 存储。
//
// 对应 main-C-Mhak1n.ts 61,579-62,087：
//   - gate/config 名单（Xw）、toolCatalog schema（Zw）、默认值（hTe）
//   - 实验覆盖名（$w）与 override 适配器（xTe）：DJB2 比较的 gate/config/
//     experiment/layer 四类覆盖
//   - STe PublishedStatsig：订阅 repository 的 statsig_evaluations 发布，
//     按 identity（principal/authMethod/stableId 三形态）选择 publication，
//     用 vendored StatsigClient 离线实例化（overrideAdapter + 禁网 + 禁存储）
//   - stableId 存储（iT/CTe）：1-256 字符校验 + legacy 导入去重
//   - 线程摘要存储（aT/oT/wTe/TTe/ETe/DTe）：codex-thread-summaries.db 的
//     schema v2 迁移（v0 建表 / v1 加列）+ 乐观 revision UPSERT
import {
  wf as objectSchema,
  Df as strictObjectSchema,
  Ef as recordSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  mf as undefinedSchema,
  jf as unionSchema,
  xf as looseObjectSchema,
  bf as literalSchema,
  vf as discriminatedUnionSchema,
  yf as jsonSchema,
} from "../../shared/zod-facade";
import { composeDefaultEnableFeatures } from "../../shared/app-config";
import { mapValuesModule } from "../../shared/hosts-runtime";
import {
  DisposableBag as disposableBag,
  openSqlite as openStateSqlite,
  stateDatabasePath,
} from "../../shared/sql-git-registry";

class EventEmitterBase {}
type StatsigClientLike = {
  dataAdapter: { setData(data: string): void };
  initializeSync(options?: unknown): { success: boolean };
  getContext(): { user: unknown; values: unknown };
  shutdown(): void;
};

type StatsigAdapterRuntime = {
  StatsigClient: new (sdkKey: string, user: unknown, options?: unknown) => StatsigClientLike;
  djb2Hash(value: string): string;
  makeTypedGet(name: string, value: unknown): (key: string) => unknown;
};

let statsigRuntime: StatsigAdapterRuntime | null = null;

/** Binds the one vendored Statsig instance owned by the main composition root. */
function configureStatsigAdapterRuntime(runtime: StatsigAdapterRuntime) {
  statsigRuntime = runtime;
}

function getStatsigRuntime(): StatsigAdapterRuntime {
  if (statsigRuntime == null)
    throw new Error("Statsig adapter runtime has not been configured");
  return statsigRuntime;
}

// lodash mapValues interop（原 `up = e.a(n.Ra())`）。
const mapValues = (mapValuesModule() as { default: <T, R>(obj: Record<string, T>, fn: (value: T) => R) => Record<string, R> }).default;

// ---------------------------------------------------------------------------
// gate/config 名单与 schema（原 `Xw`/`Zw`/`hTe`）
// ---------------------------------------------------------------------------

/** 应用消费的 statsig gate/config 名单（原 `Xw`）。 */
const STATSIG_NAMES = {
  gates: {
    crossHostHandoff: "codex-app-cross-host-handoff",
    projectTools: "codex-app-project-tools",
    threadPullRequestAssociations: "codex-app-thread-pull-request-associations",
    shareThread: "codex-share-thread",
    multiAgentMode: "codex_rollout_multi_agent_mode",
    sidebarCustomSections: "codex-app-sidebar-custom-sections",
    appLifecycle: "codex_app_enable_new_app_lifecycle",
  },
  configs: {
    modelAvailability: "codex-app-vscode-model-availability",
    realtimeConversationPrompt: "codex-app-realtime-conversation-prompt",
  },
} as const;

/** toolCatalog 的 schema（原 `Zw`）。 */
const toolCatalogSchema = objectSchema({
  gates: strictObjectSchema(mapValues(STATSIG_NAMES.gates, () => booleanSchema())),
  restrictedGates: recordSchema(stringSchema(), booleanSchema()),
  configs: strictObjectSchema(mapValues(STATSIG_NAMES.configs, () => recordSchema(stringSchema(), undefinedSchema()))),
});

/** toolCatalog 默认值（原 `hTe`）。 */
function defaultToolCatalog() {
  return toolCatalogSchema.parse({
    restrictedGates: {},
    gates: mapValues(STATSIG_NAMES.gates, () => false),
    configs: mapValues(STATSIG_NAMES.configs, () => ({})),
  });
}

// ---------------------------------------------------------------------------
// 实验覆盖（原 `$w`/`vTe`/`xTe`/`tT`）
// ---------------------------------------------------------------------------

/** 实验覆盖名（原 `$w`）。 */
const EXPERIMENT_OVERRIDE_NAMES = {
  apiKeyModelDiscovery: "codex_rollout_api_key_model_discovery",
  localThreadStoreCompression: "codex-app-local-thread-store-compression",
  mcp20260728: "codex_rollout_mcp_2026_07_28",
  codexAppsMcp20260728: "codex_rollout_codex_apps_mcp_2026_07_28",
  curatedRemoteMarketplace: "codex-app-openai-curated-remote-marketplace",
  backgroundPaginatedRolloutMigration: "codex-app-background-paginated-rollout-migration",
  permissionRefresh: "codex-app-permission-refresh",
  personality: "codex_vscode_default_personality_assignment_2",
  instructions: "codex_apps_instruction_overrides",
} as const;

const dynamicConfigSchema = recordSchema(stringSchema(), undefinedSchema());

/** 执行侧的 statsig 值 schema（原 `vTe`）。 */
const executionValuesSchema = objectSchema({
  guardianV2Experiment: jsonSchema().optional(),
  experimentalFeatureGates: objectSchema({
    mcp20260728: booleanSchema(),
    codexAppsMcp20260728: booleanSchema(),
    curatedRemoteMarketplace: booleanSchema(),
    backgroundPaginatedRolloutMigration: booleanSchema(),
    localThreadStoreCompression: booleanSchema(),
    apiKeyModelDiscovery: booleanSchema(),
  }),
  toolCatalog: toolCatalogSchema,
  permissionRefresh: booleanSchema(),
  personality: dynamicConfigSchema,
  instructions: dynamicConfigSchema,
});

const GATE_NAME_OPTIONS = (toolCatalogSchema.shape.gates.keyof().options as unknown as string[]);
const CONFIG_NAME_OPTIONS = (toolCatalogSchema.shape.configs.keyof().options as unknown as string[]);

/** statsig 名比较：字面或 DJB2 哈希互比（原 `tT`）。 */
function nameMatches(name: string, expected: string): boolean {
  const { djb2Hash } = getStatsigRuntime();
  return name === expected || djb2Hash(expected) === name || djb2Hash(name) === expected;
}

/** override 适配器（原 `xTe`）：实验值 → StatsigClient 的四类覆盖。 */
function createOverrideAdapter(rawValues: unknown) {
  const { makeTypedGet } = getStatsigRuntime();
  const values = executionValuesSchema.parse(rawValues) as {
    guardianV2Experiment?: unknown;
    experimentalFeatureGates: Record<keyof typeof EXPERIMENT_OVERRIDE_NAMES, boolean>;
    toolCatalog: { gates: Record<string, boolean>; restrictedGates: Record<string, boolean>; configs: Record<string, unknown> };
    permissionRefresh: boolean;
    personality: Record<string, unknown>;
    instructions: Record<string, unknown>;
  };
  return {
    getGateOverride(spec: { name: string; value?: unknown }) {
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.apiKeyModelDiscovery))
        return { ...spec, value: values.experimentalFeatureGates.apiKeyModelDiscovery };
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.localThreadStoreCompression))
        return { ...spec, value: values.experimentalFeatureGates.localThreadStoreCompression };
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.mcp20260728))
        return { ...spec, value: values.experimentalFeatureGates.mcp20260728 };
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.codexAppsMcp20260728))
        return { ...spec, value: values.experimentalFeatureGates.codexAppsMcp20260728 };
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.curatedRemoteMarketplace))
        return { ...spec, value: values.experimentalFeatureGates.curatedRemoteMarketplace };
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.backgroundPaginatedRolloutMigration))
        return { ...spec, value: values.experimentalFeatureGates.backgroundPaginatedRolloutMigration };
      const gateKey = GATE_NAME_OPTIONS.find((key) => nameMatches(spec.name, STATSIG_NAMES.gates[key as keyof typeof STATSIG_NAMES.gates]));
      if (gateKey != null) return { ...spec, value: values.toolCatalog.gates[gateKey] };
      const restricted = Object.entries(values.toolCatalog.restrictedGates).find(([name]) => nameMatches(spec.name, name));
      return restricted == null
        ? nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.permissionRefresh)
          ? { ...spec, value: values.permissionRefresh }
          : null
        : { ...spec, value: restricted[1] };
    },
    getDynamicConfigOverride(spec: { name: string; value?: unknown }) {
      const configKey = CONFIG_NAME_OPTIONS.find((key) => nameMatches(spec.name, STATSIG_NAMES.configs[key as keyof typeof STATSIG_NAMES.configs]));
      return configKey == null
        ? null
        : {
            ...spec,
            value: values.toolCatalog.configs[configKey],
            get: makeTypedGet(spec.name, values.toolCatalog.configs[configKey]),
          };
    },
    getExperimentOverride(spec: { name: string; value?: unknown }) {
      let override: Record<string, unknown> | null = null;
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.personality)) override = values.personality;
      return override == null ? null : { ...spec, value: override, get: makeTypedGet(spec.name, override) };
    },
    getLayerOverride(spec: { name: string; __value?: unknown }) {
      let override: Record<string, unknown> | null = null;
      if (nameMatches(spec.name, EXPERIMENT_OVERRIDE_NAMES.instructions)) override = values.instructions;
      return override == null ? null : { ...spec, __value: override, get: makeTypedGet(spec.name, override) };
    },
  };
}

// ---------------------------------------------------------------------------
// 身份匹配（原 `nT`/`rT`）
// ---------------------------------------------------------------------------

interface StatsigPublication {
  userId: string | null;
  accountId: string | null;
  authMethod: string | null;
  stableId: string | null;
  sdkKey: string;
  payload: string | null | undefined;
  executionValues: unknown;
  defaultEnableFeatures: unknown;
}

interface StatsigIdentity {
  principal: { userId: string; accountId: string } | null;
  authMethod: string | null;
  unauthenticatedStableId: string | null;
}

/** publication 与 StatsigClient user 的匹配（原 `nT`）。 */
function publicationMatchesUser(publication: StatsigPublication, user: { userID?: string; customIDs?: Record<string, string>; custom?: Record<string, unknown> }, identity: StatsigIdentity): boolean {
  return (user.userID ?? null) !== publication.userId ||
    (user.customIDs?.account_id ?? null) !== publication.accountId ||
    (user.custom?.auth_method ?? null) !== publication.authMethod ||
    (user.customIDs?.stableID ?? null) !== publication.stableId
    ? false
    : publicationMatchesIdentity(publication, identity);
}

/** publication 与 identity 的匹配（原 `rT`）：principal / authMethod / 匿名三形态。 */
function publicationMatchesIdentity(publication: StatsigPublication, identity: StatsigIdentity): boolean {
  return identity.principal == null
    ? identity.authMethod == null
      ? identity.unauthenticatedStableId != null &&
        publication.userId == null &&
        publication.accountId == null &&
        publication.authMethod == null &&
        publication.stableId === identity.unauthenticatedStableId
      : identity.authMethod !== "chatgpt" &&
        identity.authMethod !== "chatgptAuthTokens" &&
        publication.accountId == null &&
        publication.authMethod === identity.authMethod
    : publication.userId === identity.principal.userId && publication.accountId === identity.principal.accountId;
}

// ---------------------------------------------------------------------------
// PublishedStatsig（原 `STe`）
// ---------------------------------------------------------------------------

/** statsig user 的 schema（原 `gTe`/_Te）。 */
const statsigUserSchema = objectSchema({
  userID: stringSchema().optional(),
  customIDs: recordSchema(stringSchema(), stringSchema().optional()).optional(),
  email: stringSchema().optional(),
  ip: stringSchema().optional(),
  userAgent: stringSchema().optional(),
  country: stringSchema().optional(),
  locale: stringSchema().optional(),
  appVersion: stringSchema().optional(),
  custom: recordSchema(stringSchema(), unionSchema([stringSchema(), numberSchema(), booleanSchema(), arraySchema(stringSchema()), undefinedSchema()])).optional(),
  privateAttributes: recordSchema(stringSchema(), unionSchema([stringSchema(), numberSchema(), booleanSchema(), arraySchema(stringSchema()), undefinedSchema()])).nullable().optional(),
  analyticsOnlyMetadata: recordSchema(stringSchema(), unionSchema([stringSchema(), numberSchema(), booleanSchema()])).optional(),
}).passthrough();
const statsigClientOptionsSchema = objectSchema({ user: statsigUserSchema }).passthrough();

/**
 * 已发布的 statsig 求值（原 `STe`）。
 *
 * 订阅 repository 的 statsig_evaluations 变更与 identity 变更，按当前身份选择
 * publication，用 vendored StatsigClient 做离线实例化（禁网禁存储，数据来自
 * publication payload）。身份不匹配时返回 null（调用方降级）。
 */
class PublishedStatsig extends EventEmitterBase {
  repository: { get(key: string): StatsigPublication | null; addSubscriber(cb: (key: string) => void): () => void };
  getIdentity: () => Promise<StatsigIdentity>;
  disposables = new disposableBag();
  publications: StatsigPublication[] = [];
  publication: StatsigPublication | undefined;
  client: StatsigClientLike | null = null;
  disposed = false;
  identityEpoch = 0;
  listeners = new Set<() => void>();

  constructor(
    repository: { get(key: string): StatsigPublication | null; addSubscriber(cb: (key: string) => void): () => void },
    getIdentity: () => Promise<StatsigIdentity>,
    onIdentityChanged: (cb: () => void) => () => void,
  ) {
    super();
    this.repository = repository;
    this.getIdentity = getIdentity;
    this.refreshPublications();
    this.disposables.add(
      repository.addSubscriber((key) => {
        if (key === "statsig_evaluations") {
          this.refreshPublications();
          this.listeners.forEach((listener) => listener());
        }
      }),
    );
    this.disposables.add(
      onIdentityChanged(() => {
        this.identityEpoch++;
        this.teardownClient();
        this.listeners.forEach((listener) => listener());
      }),
    );
  }

  onDidChange = (listener: () => void) => (
    this.listeners.add(listener),
    () => {
      this.listeners.delete(listener);
    }
  );

  /** 读取执行侧的 statsig 值（原 `readExecutionAssignments`）。 */
  async readExecutionAssignments(requestedFeatures?: unknown) {
    const epoch = this.identityEpoch;
    let client: StatsigClientLike | null;
    try {
      client = await this.getClient();
    } catch {
      return null;
    }
    return this.disposed || epoch !== this.identityEpoch || client !== this.client
      ? null
      : this.readReadyExecutionAssignments(requestedFeatures);
  }

  async hasReadyExecutionAssignments() {
    return this.readReadyExecutionAssignments() != null;
  }

  /** 就绪值的同步读取（原 `readReadyExecutionAssignments`）。 */
  readReadyExecutionAssignments(requestedFeatures?: unknown) {
    if (this.disposed) return null;
    const client = this.getReadyClient();
    const publication = this.publication;
    // payload 为 null：有发布但无求值数据 → 全默认值。
    if (publication != null && publication.payload == null) {
      return {
        identity: {
          userId: publication.userId,
          accountId: publication.accountId,
          authMethod: publication.authMethod,
          stableId: publication.stableId,
        },
        values: {
          experimentalFeatureGates: {
            mcp20260728: false,
            codexAppsMcp20260728: false,
            curatedRemoteMarketplace: false,
            backgroundPaginatedRolloutMigration: false,
            localThreadStoreCompression: false,
            apiKeyModelDiscovery: false,
          },
          toolCatalog: defaultToolCatalog(),
          permissionRefresh: false,
          personality: {},
          instructions: {},
        },
        defaultEnableFeatures: {},
      };
    }
    if (client == null || publication?.payload == null) return null;
    const user = ((client as StatsigClientLike).getContext() as { user: { userID?: string; customIDs?: Record<string, string>; custom?: Record<string, unknown> } }).user;
    return {
      identity: {
        userId: user.userID ?? null,
        accountId: user.customIDs?.account_id ?? null,
        stableId: user.customIDs?.stableID ?? null,
        authMethod: typeof user.custom?.auth_method == "string" ? (user.custom.auth_method as string) : null,
      },
      values: (publication as StatsigPublication & { executionValues: unknown }).executionValues,
      defaultEnableFeatures: composeDefaultEnableFeatures(
        (publication as StatsigPublication & { defaultEnableFeatures: Record<string, unknown> }).defaultEnableFeatures,
        ((publication as StatsigPublication & { executionValues: { guardianV2Experiment?: unknown } }).executionValues).guardianV2Experiment as any,
        requestedFeatures as string | null,
      ),
    };
  }

  getReadyClient = (): StatsigClientLike | null => (this.disposed ? null : this.client);

  /** 获取（或重建）当前身份的离线 StatsigClient（原 `getClient`）。 */
  getClient = async (): Promise<StatsigClientLike | null> => {
    if (this.disposed) return null;
    const epoch = this.identityEpoch;
    const identity = await this.getIdentity();
    if (this.disposed || epoch !== this.identityEpoch) return null;
    const matched = this.publications.find((publication) => publicationMatchesIdentity(publication, identity));
    if (matched?.payload === undefined) return (this.teardownClient(), null);
    if (matched === this.publication && this.client != null && publicationMatchesUser(matched, (this.client as StatsigClientLike & { getContext(): { user: never } }).getContext().user, identity))
      return this.client;
    this.teardownClient();
    if (matched.payload == null) {
      // 有发布但 payload 为空：仅当身份完全匹配时记住 publication，返回 null。
      publicationMatchesUser(
        matched,
        {
          userID: matched.userId ?? undefined,
          customIDs: { account_id: matched.accountId ?? undefined, stableID: matched.stableId ?? undefined },
          custom: { auth_method: matched.authMethod ?? undefined },
        } as never,
        identity,
      ) && (this.publication = matched);
      return null;
    }
    let user: Record<string, unknown>;
    let overrideAdapter: ReturnType<typeof createOverrideAdapter>;
    try {
      ({ user } = statsigClientOptionsSchema.parse(JSON.parse(matched.payload)));
      overrideAdapter = createOverrideAdapter(matched.executionValues);
    } catch {
      return null;
    }
    if (!publicationMatchesUser(matched, user as never, identity)) return null;
    const { StatsigClient } = getStatsigRuntime();
    const client = new StatsigClient(matched.sdkKey, user, {
      overrideAdapter,
      disableStorage: true,
      loggingEnabled: "disabled",
      networkConfig: { preventAllNetworkTraffic: true },
    }) as unknown as StatsigClientLike;
    return (
      (client as StatsigClientLike & { dataAdapter: { setData(data: string): void } }).dataAdapter.setData(matched.payload),
      !(client as StatsigClientLike & { initializeSync(opts: unknown): { success: boolean } }).initializeSync({ disableBackgroundCacheRefresh: true }).success ||
      (client as StatsigClientLike & { getContext(): { values: unknown } }).getContext().values == null
        ? ((client as StatsigClientLike & { shutdown(): void }).shutdown(), null)
        : ((this.publication = matched), (this.client = client), client)
    );
  };

  dispose = () => {
    this.disposed = true;
    this.disposables.dispose();
    this.listeners.clear();
    this.publications = [];
    this.teardownClient();
  };

  /** repository 变更时刷新 publication 列表（原 `#e`）。 */
  private refreshPublications() {
    const latest = this.repository.get("statsig_evaluations");
    if (latest == null) {
      this.publications = [];
      this.teardownClient();
      return;
    }
    const existingIndex = this.publications.findIndex(
      (publication) =>
        publication.userId === latest.userId &&
        publication.accountId === latest.accountId &&
        publication.authMethod === latest.authMethod &&
        publication.stableId === latest.stableId,
    );
    if (existingIndex !== -1) {
      if (this.publications[existingIndex] === this.publication) this.teardownClient();
      this.publications.splice(existingIndex, 1);
    }
    this.publications.unshift(latest);
  }
  /** 关闭当前 client（原 `#t`）。 */
  private teardownClient() {
    const client = this.client;
    this.client = null;
    this.publication = undefined;
    client?.shutdown();
  }
}

// ---------------------------------------------------------------------------
// stableId 存储（原 `iT`/`CTe`）
// ---------------------------------------------------------------------------

const stableIdSchema = stringSchema().min(1).max(256);

/** stableId 的读取与 legacy 导入（原 `CTe`）。 */
class StableIdStore extends EventEmitterBase {
  storage: { read(): Promise<unknown>; write(value: string): Promise<void> };
  pendingImport: Promise<string> | null = null;

  constructor(storage: { read(): Promise<unknown>; write(value: string): Promise<void> }) {
    super();
    this.storage = storage;
  }

  async getStableId(): Promise<string | null> {
    if (this.pendingImport != null) return this.pendingImport;
    const parsed = stableIdSchema.safeParse(await this.storage.read());
    return parsed.success ? (parsed.data as string) : null;
  }

  /** 导入 legacy stableId（已有值时不覆盖，原 `importLegacyStableId`）。 */
  async importLegacyStableId(value: string): Promise<string> {
    const parsed = stableIdSchema.parse(value);
    if (this.pendingImport != null) return this.pendingImport;
    const attempt = this.importOnce(parsed as string);
    this.pendingImport = attempt;
    try {
      return await attempt;
    } finally {
      if (this.pendingImport === attempt) this.pendingImport = null;
    }
  }

  private async importOnce(value: string): Promise<string> {
    const existing = stableIdSchema.safeParse(await this.storage.read());
    return existing.success ? (existing.data as string) : (await this.storage.write(value), value);
  }
}

// ---------------------------------------------------------------------------
// 线程摘要 SQLite 存储（原 `aT`~`DTe`）
// ---------------------------------------------------------------------------

const THREAD_SUMMARIES_SCHEMA_VERSION = 2;
/** 懒打开的 db 单例（原 `oT`）。 */
let threadSummariesDb: unknown | null = null;

/** 打开（并按需迁移）线程摘要 db（原 `wTe`）；非 Electron 环境返回 null。 */
function getThreadSummariesDb(): unknown | null {
  return process.versions.electron
    ? ((threadSummariesDb ??= openStateSqlite(stateDatabasePath({ databaseFileName: threadSummariesDbFileName() }), migrateThreadSummariesSchema)), threadSummariesDb)
    : null;
}

/** schema 迁移（原 `TTe`）：v0 建表，v1 加 compact 列，v2 完成。 */
function migrateThreadSummariesSchema(db: {
  prepare(sql: string): { get(): unknown; run(...args: unknown[]): { changes: number }; all(...args: unknown[]): unknown[] };
  exec(sql: string): void;
}) {
  const version = ((db.prepare("PRAGMA user_version").get() as { user_version?: number })?.user_version ?? 0) as number;
  if (version > THREAD_SUMMARIES_SCHEMA_VERSION)
    throw new Error(`Task summary schema ${version} is newer than supported`);
  if (version !== THREAD_SUMMARIES_SCHEMA_VERSION) {
    db.prepare("BEGIN").run();
    try {
      if (version === 0) {
        db.exec(`
        CREATE TABLE thread_turn_summaries (
          principal_key TEXT NOT NULL CHECK (length(principal_key) > 0),
          host_key TEXT NOT NULL CHECK (length(host_key) > 0),
          thread_id TEXT NOT NULL CHECK (length(thread_id) > 0),
          summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 280),
          compact_summary TEXT CHECK (
            compact_summary IS NULL OR length(compact_summary) BETWEEN 1 AND 60
          ),
          compact_summary_turn_key TEXT CHECK (
            compact_summary_turn_key IS NULL OR
            length(compact_summary_turn_key) > 0
          ),
          revision INTEGER NOT NULL CHECK (revision >= 0),
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (principal_key, host_key, thread_id)
        );
      `);
      } else {
        db.exec(`
        ALTER TABLE thread_turn_summaries
        ADD COLUMN compact_summary TEXT CHECK (
          compact_summary IS NULL OR length(compact_summary) BETWEEN 1 AND 60
        );
        ALTER TABLE thread_turn_summaries
        ADD COLUMN compact_summary_turn_key TEXT CHECK (
          compact_summary_turn_key IS NULL OR
          length(compact_summary_turn_key) > 0
        );
      `);
      }
      db.prepare(`PRAGMA user_version = ${THREAD_SUMMARIES_SCHEMA_VERSION}`).run();
      db.prepare("COMMIT").run();
    } catch (error) {
      throw (db.prepare("ROLLBACK").run(), error);
    }
  }
}

/** db 文件名按 build flavor 区分（原 `ETe`）。 */
function threadSummariesDbFileName(): string {
  const flavor = process.env.BUILD_FLAVOR ?? (process.env.NODE_ENV === "production" ? "prod" : "dev");
  return flavor === "prod" ? "codex-thread-summaries.db" : `codex-thread-summaries-${flavor}.db`;
}

interface ThreadTurnSummary {
  threadId: string;
  summary: string;
  compactSummary?: string;
  compactSummaryTurnKey?: string;
  revision: number;
}

/** 线程摘要 DAO（原 `DTe`）：批量读 + 乐观 revision UPSERT + 删除。 */
class ThreadTurnSummariesStore {
  db: {
    prepare(sql: string): { all(...args: unknown[]): unknown[]; run(...args: unknown[]): { changes: number } };
  };

  constructor(db: ThreadTurnSummariesStore["db"]) {
    this.db = db;
  }

  readMany(principalKey: string, hostKey: string, threadIds: string[]): ThreadTurnSummary[] {
    if (threadIds.length === 0) return [];
    const placeholders = threadIds.map(() => "?").join(", ");
    return (this.db.prepare(
      `SELECT thread_id, summary, compact_summary, compact_summary_turn_key,
                revision
         FROM thread_turn_summaries
         WHERE principal_key = ? AND host_key = ?
           AND thread_id IN (${placeholders})`,
    ).all(principalKey, hostKey, ...threadIds) as Array<{
      thread_id: string;
      summary: string;
      compact_summary: string | null;
      compact_summary_turn_key: string | null;
      revision: number;
    }>).map(
      ({
        thread_id: threadId,
        summary,
        compact_summary: compactSummary,
        compact_summary_turn_key: compactSummaryTurnKey,
        revision,
      }) => ({
        threadId,
        summary,
        ...(compactSummary == null ? {} : { compactSummary }),
        ...(compactSummaryTurnKey == null ? {} : { compactSummaryTurnKey }),
        revision,
      }),
    );
  }

  /** 写入（revision 更高才生效，原 `set`）。 */
  set(
    principalKey: string,
    hostKey: string,
    threadId: string,
    summary: string,
    revision: number,
    compactSummary: string | null,
    compactSummaryTurnKey: string | null,
  ): boolean {
    if (summary.length === 0 || summary.length > 280)
      throw new Error("Task summaries must contain between 1 and 280 characters");
    if (compactSummary != null && (compactSummary.length === 0 || compactSummary.length > 60))
      throw new Error("Compact task summaries must contain between 1 and 60 characters");
    if ((compactSummary == null) != (compactSummaryTurnKey == null) || compactSummaryTurnKey?.length === 0)
      throw new Error("Compact task summaries must include their completed turn key");
    if (!Number.isSafeInteger(revision) || revision < 0)
      throw new Error("Task summary revisions must be non-negative safe integers");
    return (
      this.db.prepare(
        `INSERT INTO thread_turn_summaries (
           principal_key, host_key, thread_id, summary, compact_summary,
           compact_summary_turn_key, revision, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(principal_key, host_key, thread_id) DO UPDATE SET
           summary = excluded.summary,
           compact_summary = excluded.compact_summary,
           compact_summary_turn_key = excluded.compact_summary_turn_key,
           revision = excluded.revision,
           updated_at = excluded.updated_at
         WHERE excluded.revision > thread_turn_summaries.revision`,
      ).run(principalKey, hostKey, threadId, summary, compactSummary ?? null, compactSummaryTurnKey ?? null, revision, Date.now()).changes === 1
    );
  }

  delete(principalKey: string, hostKey: string, threadId: string) {
    this.db
      .prepare(
        `DELETE FROM thread_turn_summaries
         WHERE principal_key = ? AND host_key = ? AND thread_id = ?`,
      )
      .run(principalKey, hostKey, threadId);
  }
}

export {
  configureStatsigAdapterRuntime,
  STATSIG_NAMES,
  EXPERIMENT_OVERRIDE_NAMES,
  toolCatalogSchema,
  defaultToolCatalog,
  executionValuesSchema,
  nameMatches,
  createOverrideAdapter,
  publicationMatchesIdentity,
  publicationMatchesUser,
  PublishedStatsig,
  StableIdStore,
  getThreadSummariesDb,
  threadSummariesDbFileName,
  ThreadTurnSummariesStore,
  type StatsigPublication,
  type StatsigIdentity,
  type ThreadTurnSummary,
};
