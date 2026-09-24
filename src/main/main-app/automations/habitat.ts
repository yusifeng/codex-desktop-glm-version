// habitat-automations：云端 automations → 本地 habitat 的 enrollment/迁移/同步。
//
// 对应 main-C-Mhak1n.ts 67,640-68,304：
//   - OOe/ZE/kOe/QE schema（云端 automation 记录）
//   - AOe HabitatAutomations 类（67,683-68,151，~470 行）：
//     enrollment 状态机（not_enrolled/accepted/complete）、迁移串行队列
//     （operationTail/migrationPromise/syncPromise）、双向同步（分页发现 +
//     归档清理 + 本地缓存投影）、保存后独立验证（saveAndVerify）
//   - $E/eD/tD/jOe/nD 转换器（68,152-68,232）：云端记录 ↔ 本地模型
//   - NOe registerHabitatAutomations（68,240-68,274）：principal 变更 +
//     item/completed 通知触发 sync
//   - POe localAutomationOps（68,275-68,283）
//   - FOe unsubscribeCompletedAutomation（68,284-68,304）：cron 完成后退订线程
//
// 与 R2 的 automations 执行引擎（main-app/automations/index.ts）是两码事：
// 这里管云端迁移/同步，那边管本地 cron 调度执行。
import { randomUUID } from "node:crypto";
import { net } from "electron";
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  df as enumSchema,
  bf as literalSchema,
  jf as unionSchema,
  Pf as cuidSchema,
  gd as notificationPolicySchema,
  _d as reasoningEffortSchema,
  Uf as EventEmitterBase,
  $u as threadIdOf,
  // shared chunk 的 automations 登记表（本地 habitat 存储 API）
  Ar as listLocalAutomations,
  Mr as collectPendingMigrations,
  Dr as hasMigrationConflicts,
  Br as setMigrationOwner,
  Fr as adoptMigratedAutomation,
  yr as createLocalAutomation,
  Vr as updateLocalAutomation,
  vr as cacheCloudAutomation,
  xr as getLocalAutomation,
  br as removeLocalAutomation,
  Or as isMigratedAutomation,
  Sr as getLocalIdentity,
  Nr as getArchivedHeartbeatIds,
  Lr as pruneNonCloudAutomations,
  kr as isSingleRrule,
  Er as computeNextRunAtFromRrule,
  bd as isCronAutomation,
  Ns as normalizeProjectPath,
  m as requestThreadUnsubscribe,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { vt as authedFetch, N as AUTOMATIONS_INSTALLATION_ID_KEY, M as AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY } from "@chunk/bootstrap";
import { getDesktopFeatureAvailability } from "../misc/availability";

const logger = memoizedTaggedLogger("habitat-automations");

// ---------------------------------------------------------------------------
// 云端 schema（原 `OOe`/`ZE`/`kOe`/`QE`）
// ---------------------------------------------------------------------------

const localConfigurationSchema = objectSchema({
  target: unionSchema([
    objectSchema({ type: literalSchema("project"), project_id: stringSchema().min(1) }),
    objectSchema({ type: literalSchema("projectless") }),
  ]).nullable(),
  compatibility_cwds: arraySchema(stringSchema().min(1)),
  execution_environment: enumSchema(["local", "worktree"]),
  local_environment_config_path: stringSchema().nullable(),
  plugin_template_id: stringSchema().nullable(),
});

/** 云端 automation 记录（原 `ZE`）。 */
const cloudAutomationSchema = objectSchema({
  id: stringSchema().min(1),
  created_at: stringSchema(),
  updated_at: stringSchema(),
  title: stringSchema(),
  schedule: stringSchema(),
  is_enabled: booleanSchema(),
  prompt: stringSchema(),
  executor: literalSchema("local"),
  installation_id: cuidSchema(),
  legacy_automation_id: stringSchema().min(1),
  model: stringSchema().nullable(),
  notification_policy: (notificationPolicySchema as unknown as { nullable(): unknown }).nullable(),
  reasoning_effort: (reasoningEffortSchema as unknown as { nullable(): unknown }).nullable(),
  target_thread_id: stringSchema().nullable(),
  local_configuration: (localConfigurationSchema as unknown as { nullable(): unknown }).nullable(),
});

const cloudAutomationPageSchema = objectSchema({ items: arraySchema(cloudAutomationSchema), cursor: stringSchema().nullable().optional() });
const enrollmentStatusSchema = objectSchema({ status: enumSchema(["not_enrolled", "accepted", "complete"]) });

// ---------------------------------------------------------------------------
// 转换器（原 `$E`/`eD`/`tD`/`jOe`/`nD`）
// ---------------------------------------------------------------------------

interface LocalAutomation {
  id: string;
  name: string;
  prompt: string;
  status: string;
  model: string | null;
  reasoningEffort: unknown;
  notificationPolicy?: unknown;
  rrule: string;
  nextRunAt: number | null;
  lastRunAt: number | null;
  createdAt: number;
  updatedAt: number;
  kind: "cron" | "heartbeat";
  targetThreadId?: string | null;
  pluginTemplateId?: string | null;
  target?: unknown;
  cwds?: string[];
  executionEnvironment?: unknown;
  localEnvironmentConfigPath?: string | null;
}

/** 云端记录与本地草稿逐字段比对（原 `$E`）。 */
function cloudRecordMatches(record: Record<string, unknown>, automation: LocalAutomation, localConfiguration: unknown): boolean {
  return (
    record.title === automation.name &&
    record.prompt === automation.prompt &&
    record.model === automation.model &&
    record.notification_policy === (automation.notificationPolicy ?? null) &&
    record.reasoning_effort === automation.reasoningEffort &&
    record.target_thread_id === (automation.kind === "heartbeat" ? automation.targetThreadId : null) &&
    record.is_enabled === (automation.status === "ACTIVE") &&
    normalizeSchedule(record.schedule as string) === normalizeSchedule(wrapRrule(automation.rrule)) &&
    JSON.stringify(record.local_configuration) === JSON.stringify(localConfiguration)
  );
}

/** schedule 的规范形式（原 `eD`）：单 RRULE 行剥前缀，否则按行拼接。 */
function normalizeSchedule(schedule: string): string {
  const lines = schedule
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !["", "BEGIN:VEVENT", "END:VEVENT"].includes(line));
  return lines.length === 1 && lines[0].startsWith("RRULE:")
    ? lines[0].slice(6)
    : lines.join("\n");
}

/** rrule 包成 VEVENT（原 `tD`）。 */
function wrapRrule(rrule: string): string {
  const trimmed = rrule.trim();
  return trimmed.includes("BEGIN:VEVENT")
    ? trimmed
    : `BEGIN:VEVENT\n${
        trimmed.includes("\n") || trimmed.startsWith("RRULE:") ? trimmed : `RRULE:${trimmed}`
      }\nEND:VEVENT`;
}

/** 本地执行设置 → 云端 local_configuration（原 `jOe`）。 */
function toLocalConfiguration(automation: LocalAutomation): unknown {
  if (!isCronAutomation(automation)) return null;
  const target = automation.target as { type?: string; projectId?: string } | undefined;
  return {
    target: target?.type === "project" ? { type: "project", project_id: target.projectId } : target,
    compatibility_cwds: [...(automation.cwds ?? [])],
    execution_environment: automation.executionEnvironment,
    local_environment_config_path: automation.localEnvironmentConfigPath,
    plugin_template_id: automation.pluginTemplateId,
  };
}

/** 云端记录 → 本地模型（原 `nD`）。 */
function cloudRecordToLocal(record: Record<string, unknown>, local: LocalAutomation | null): LocalAutomation {
  const localConfiguration = record.local_configuration as Record<string, unknown> | null;
  const scheduleMatches = local != null && normalizeSchedule(local.rrule) === normalizeSchedule(record.schedule as string);
  let nextRunAt: number | null = scheduleMatches ? local.nextRunAt : null;
  const normalizedSchedule = normalizeSchedule(record.schedule as string);
  if (!scheduleMatches && isSingleRrule(normalizedSchedule)) {
    nextRunAt = computeNextRunAtFromRrule({ rrule: normalizedSchedule, now: Date.parse(local == null ? (record.created_at as string) : (record.updated_at as string)) - 1 } as never) as number | null;
  }
  const base = {
    id: record.id as string,
    name: record.title as string,
    prompt: record.prompt as string,
    status: record.is_enabled ? "ACTIVE" : "PAUSED",
    model: record.model as string | null,
    reasoningEffort: record.reasoning_effort,
    notificationPolicy: record.notification_policy ?? undefined,
    rrule: scheduleMatches ? (local!.rrule as string) : normalizedSchedule,
    nextRunAt,
    lastRunAt: local?.lastRunAt ?? null,
    createdAt: local?.createdAt ?? Date.parse(record.created_at as string),
    updatedAt: Date.parse(record.updated_at as string),
  } as LocalAutomation;
  if (record.target_thread_id != null)
    return { ...base, kind: "heartbeat", targetThreadId: record.target_thread_id as string };
  if (localConfiguration == null) throw new Error("Cron automation is missing its local execution settings");
  const target = localConfiguration.target as { type?: string; project_id?: string } | null;
  return {
    ...base,
    kind: "cron",
    pluginTemplateId: localConfiguration.plugin_template_id as string | null,
    target: target?.type === "project" ? { type: "project", projectId: target.project_id } : target,
    cwds: (localConfiguration.compatibility_cwds as string[]).map(normalizeProjectPath as never),
    executionEnvironment: localConfiguration.execution_environment,
    localEnvironmentConfigPath: localConfiguration.local_environment_config_path as string | null,
  };
}

// ---------------------------------------------------------------------------
// HabitatAutomations（原 `AOe`）
// ---------------------------------------------------------------------------

interface HabitatOwner {
  accountId: string;
  userId: string;
  installationId: string | null;
}

interface HabitatGlobalState {
  get(key: unknown): unknown;
  set(key: unknown, value: unknown): void;
  update(key: unknown, fn: (value: unknown) => unknown): void;
  flushOrThrow(): Promise<void>;
}

/** 云端 automations 的迁移/同步管理器（原 `AOe`）。 */
class HabitatAutomations extends EventEmitterBase {
  appServerClient: { getAuthenticatedPrincipal(): Promise<HabitatOwner | null> };
  desktopApiOptions: unknown;
  globalState: HabitatGlobalState;
  isRolloutEnabled: () => boolean;
  fetch: (url: string, init: unknown) => Promise<Response>;
  onChanged: () => void;
  logger = memoizedTaggedLogger("habitat-automations");
  owner: HabitatOwner | null = null;
  operationTail = Promise.resolve();
  migrationPromise: Promise<unknown> | null = null;
  syncPromise: Promise<unknown> | null = null;
  migrationError: string | undefined;
  enrollmentStatus: string | null = null;
  enrollmentOwnerKey: string | null = null;

  constructor(
    appServerClient: HabitatAutomations["appServerClient"],
    desktopApiOptions: unknown,
    globalState: HabitatGlobalState,
    isRolloutEnabled: () => boolean,
    fetch: HabitatAutomations["fetch"] = (url, init) => net.fetch(url, init),
    onChanged: () => void = () => {},
  ) {
    super();
    this.appServerClient = appServerClient;
    this.desktopApiOptions = desktopApiOptions;
    this.globalState = globalState;
    this.isRolloutEnabled = isRolloutEnabled;
    this.fetch = fetch;
    this.onChanged = onChanged;
  }

  /** principal 变更时重置迁移归属（原 `handlePrincipalChanged`）。 */
  handlePrincipalChanged(principal: { accountId: string; userId: string } | null) {
    const installationId = this.globalState.get(AUTOMATIONS_INSTALLATION_ID_KEY) as string | null;
    const owner =
      principal == null || installationId == null
        ? null
        : { accountId: principal.accountId, userId: principal.userId, installationId };
    const status = owner == null ? null : this.getPersistedStatus(owner);
    const inProgress = status === "in_progress";
    this.enrollmentStatus = null;
    this.enrollmentOwnerKey = null;
    this.owner = inProgress || status === "complete" ? owner : null;
    setMigrationOwner(this.owner, inProgress ? "in_progress" : "complete");
    this.migrationError = undefined;
  }

  /** 当前迁移状态（原 `getState`）。 */
  async getState() {
    const principal = await this.appServerClient.getAuthenticatedPrincipal();
    if (principal == null) return (this.handlePrincipalChanged(null), this.state("unavailable"));
    const installationId = this.globalState.get(AUTOMATIONS_INSTALLATION_ID_KEY) as string | null;
    if (installationId == null)
      return this.isRolloutEnabled()
        ? this.state(this.getPersistedStatus(principal) === "declined" ? "declined" : "eligible")
        : this.state("unavailable");
    const owner = { accountId: principal.accountId, userId: principal.userId, installationId };
    await this.readEnrollment(owner);
    const status = this.getPersistedStatus(owner) ?? this.getPersistedStatus(principal);
    const inProgress = status === "in_progress";
    this.owner = inProgress || status === "complete" ? owner : null;
    setMigrationOwner(this.owner, inProgress ? "in_progress" : "complete");
    return this.migrationPromise == null
      ? status === "complete" && this.enrollmentStatus === "complete"
        ? this.state("complete")
        : !this.isRolloutEnabled() && this.enrollmentStatus === "not_enrolled"
          ? this.state("unavailable")
          : status === "declined" && this.enrollmentStatus === "not_enrolled"
            ? this.state("declined")
            : this.migrationError == null
              ? this.state("eligible")
              : this.state("error", this.migrationError)
      : this.state("migrating");
  }

  /** 执行迁移（原 `migrate`）：enroll → 逐个上传 → 本地收养 → 双向校验。 */
  async migrate(principal: { accountId: string; userId: string }) {
    if (this.migrationPromise != null) return this.migrationPromise;
    if (!this.isRolloutEnabled() && this.globalState.get("electron-automations-installation-id") == null)
      return this.state("unavailable");
    this.migrationPromise = this.enqueue(async () => {
      const owner = await this.getCurrentOwner(principal);
      if (
        this.enrollmentOwnerKey !== `${owner.accountId}:${owner.userId}:${owner.installationId}` &&
        (await this.readEnrollment(owner)),
        this.enrollmentStatus === "not_enrolled"
      ) {
        if (!this.isRolloutEnabled()) return this.state("unavailable");
        await this.writeEnrollment(owner, "accept");
      }
      if (this.getPersistedStatus(owner) === "complete" && this.enrollmentStatus === "complete")
        return this.state("complete");
      this.migrationError = undefined;
      await this.persistStatus(owner, "in_progress");
      await this.checkOwner(owner);
      // 快照本地待迁移项，迁移后逐一核对。
      const before = new Map();
      const pending = collectPendingMigrations(before) as Array<{ id: string }>;
      const pendingIds = new Set(pending.map(({ id }) => id));
      if (hasMigrationConflicts(pendingIds))
        return (
          (this.migrationError = "Some automations could not be migrated."),
          this.state("error", this.migrationError)
        );
      const uploaded = (
        await Promise.all(
          pending.map(async (automation) => {
            try {
              const response = await this.saveAndVerify(null, automation as LocalAutomation, owner, (automation as LocalAutomation).id);
              return (await this.checkOwner(owner), { automation, response });
            } catch (error) {
              this.logger().warning("Failed to migrate a desktop automation", {
                safe: {},
                sensitive: { automationId: (automation as LocalAutomation).id, error },
              });
              return null;
            }
          }),
        )
      ).filter((entry): entry is { automation: { id: string }; response: Record<string, unknown> } => entry != null);
      const after = new Map();
      collectPendingMigrations(after);
      if (uploaded.length !== pending.length || hasMigrationConflicts(pendingIds) || pending.some(({ id }) => before.get(id) !== after.get(id)))
        return (
          (this.migrationError = "Some automations could not be migrated."),
          this.state("error", this.migrationError)
        );
      await this.checkOwner(owner);
      this.owner = owner;
      setMigrationOwner(owner, "in_progress");
      for (const { automation, response } of uploaded)
        if (adoptMigratedAutomation(automation.id, { ...cloudRecordToLocal(response, automation as LocalAutomation), status: (automation as LocalAutomation).status }, owner as never, before.get(automation.id)) == null)
          throw new Error("Migrated automation could not be adopted locally");
      return (
        hasMigrationConflicts() || (await this.syncOwner(owner), await this.checkOwner(owner)),
        hasMigrationConflicts()
          ? ((this.migrationError = "Some automations could not be migrated."),
            this.state("error", this.migrationError))
          : (await this.writeEnrollment(owner, "complete"),
            await this.persistStatus(owner, "complete"),
            setMigrationOwner(owner, "complete"),
            this.state("complete"))
      );
    }).catch((error) => (
      this.logger().warning("Desktop automation migration did not finish", {
        safe: {},
        sensitive: { error },
      }),
      (this.migrationError = "Automation migration could not finish. Try again."),
      this.state("error", this.migrationError)
    ));
    try {
      return await this.migrationPromise;
    } finally {
      this.migrationPromise = null;
      this.onChanged();
    }
  }

  /** 拒绝迁移（原 `decline`）。 */
  async decline(principal: { accountId: string; userId: string }) {
    if (!this.isRolloutEnabled()) return;
    if (this.globalState.get("electron-automations-installation-id") == null) {
      const current = await this.appServerClient.getAuthenticatedPrincipal();
      if (current?.accountId !== principal.accountId || current.userId !== principal.userId)
        throw new Error("The signed-in automation owner changed");
      await this.persistStatus(principal, "declined");
      return;
    }
    const owner = await this.getCurrentOwner(principal);
    const status = this.getPersistedStatus(owner);
    if (status !== "in_progress" && status !== "complete") await this.persistStatus(owner, "declined");
  }

  list() {
    return listLocalAutomations();
  }

  isMigrationInProgress() {
    return this.migrationPromise != null;
  }

  getMigrationOwner() {
    return this.owner != null && this.getPersistedStatus(this.owner) === "complete"
      ? { accountId: this.owner.accountId, userId: this.owner.userId }
      : null;
  }

  getHostedInstallationId() {
    return this.usableOwner?.installationId ?? null;
  }

  isLocalMigrationActive() {
    const status = this.owner == null ? undefined : this.getPersistedStatus(this.owner);
    return this.migrationPromise != null || status === "in_progress" || status === "complete";
  }

  /** 与云端同步（原 `sync`）：单飞（syncPromise 复用）。 */
  async sync() {
    const owner = this.usableOwner;
    if (owner != null) {
      this.syncPromise =
        this.syncPromise ??
        this.enqueue(() => this.syncOwner(owner)).finally(() => {
          this.syncPromise = null;
        });
      return this.syncPromise;
    }
  }

  async create(automation: LocalAutomation, cwds: string[] = []) {
    if (this.usableOwner == null) {
      if (this.isLocalMigrationActive()) throw new Error("Automation migration is in progress");
      return createLocalAutomation(automation as never, cwds as never);
    }
    return this.enqueue(async () => {
      const owner = await this.getActiveOwner();
      const local = createLocalAutomation(automation as never, cwds as never, { persist: false });
      if (local == null) return null;
      const response = await this.saveAndVerify(null, local as LocalAutomation, owner, (local as LocalAutomation).id);
      const cached = cacheCloudAutomation(cloudRecordToLocal(response, local as LocalAutomation), owner as never, (local as LocalAutomation).id);
      if (cached == null) throw new Error("Created automation could not be cached locally");
      return cached;
    });
  }

  async update(automation: LocalAutomation, cwds: string[] = []) {
    if (!isMigratedAutomation(automation.id)) {
      if (this.isLocalMigrationActive()) throw new Error("Automation migration is in progress");
      return updateLocalAutomation(automation as never, cwds as never);
    }
    return this.enqueue(async () => {
      const owner = await this.getActiveOwner();
      const local = updateLocalAutomation(automation as never, cwds as never, { persist: false });
      if (local == null) return null;
      const legacyId = getLocalIdentity(automation.id);
      if (legacyId == null) throw new Error("Automation is missing its local identity");
      const response = await this.saveAndVerify(automation.id, local as LocalAutomation, owner, legacyId);
      const cached = cacheCloudAutomation(cloudRecordToLocal(response, local as LocalAutomation), owner as never, legacyId);
      if (cached == null) throw new Error("Updated automation could not be cached locally");
      return cached;
    });
  }

  async delete(id: string) {
    if (!isMigratedAutomation(id)) {
      if (this.isLocalMigrationActive()) throw new Error("Automation migration is in progress");
      return { item: getLocalAutomation(id), status: removeLocalAutomation(id) };
    }
    return this.enqueue(async () => {
      const owner = await this.getActiveOwner();
      const item = getLocalAutomation(id);
      return item == null
        ? { item: null, status: "not_found" }
        : (await this.request(owner, "delete automation", "/automations/remove", "POST", {
            automation_id: id,
          }),
          { item, status: removeLocalAutomation(id) });
    });
  }

  /** 删除已归档的 heartbeat（原 `deleteArchivedHeartbeat`）。 */
  async deleteArchivedHeartbeat(id: string) {
    const item = getLocalAutomation(id) as LocalAutomation | null;
    if (item?.kind !== "heartbeat") return "not_found";
    const owner = this.owner;
    if (owner == null || !isMigratedAutomation(id)) {
      if (!this.isLocalMigrationActive()) return (await this.delete(id)).status;
      if (updateLocalAutomation({ ...item, status: "DELETED" } as never) == null) return "state_cleanup_failed";
    } else if (cacheCloudAutomation({ ...item, status: "DELETED", nextRunAt: null } as never, owner as never, getLocalIdentity(id) ?? undefined) == null) {
      return "state_cleanup_failed";
    }
    return (this.onChanged(), await this.sync(), "deleted");
  }

  state(status: string, error?: string) {
    return {
      status,
      pendingCount: (collectPendingMigrations() as unknown[]).length || Number(Boolean(hasMigrationConflicts())),
      migratedCount: this.list().filter(({ id }: { id: string }) => isMigratedAutomation(id)).length,
      consentAccepted: this.enrollmentStatus === "accepted" || this.enrollmentStatus === "complete",
      error,
    };
  }

  /** 操作串行队列（原 `enqueue`）。 */
  enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const chained = this.operationTail.then(operation, operation);
    this.operationTail = chained.then(() => void 0).catch(() => void 0);
    return chained;
  }

  getPersistedStatus(owner: { accountId: string; userId: string; installationId: string | null }) {
    const key = `${owner.accountId}:${owner.userId}${owner.installationId == null ? "" : `:${owner.installationId}`}`;
    return (this.globalState.get(AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY) as Record<string, string> | undefined)?.[key];
  }

  async persistStatus(owner: { accountId: string; userId: string; installationId?: string | null }, status: string) {
    const key = `${owner.accountId}:${owner.userId}${owner.installationId == null ? "" : `:${owner.installationId}`}`;
    const previous = this.globalState.get(AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY);
    this.globalState.update(AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY, (all) => ({ ...(all as object), [key]: status }));
    try {
      await this.globalState.flushOrThrow();
    } catch (error) {
      throw (this.globalState.set(AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY, previous ?? undefined), error);
    }
  }

  /** 当前 owner（无 installationId 时生成并持久化，原 `getCurrentOwner`）。 */
  async getCurrentOwner(principal: { accountId: string; userId: string }) {
    let installationId = this.globalState.get(AUTOMATIONS_INSTALLATION_ID_KEY) as string | null;
    if (installationId == null) {
      const current = await this.appServerClient.getAuthenticatedPrincipal();
      if (current?.accountId !== principal.accountId || current.userId !== principal.userId || !this.isRolloutEnabled())
        throw new Error("The signed-in automation owner or rollout changed");
      installationId = randomUUID();
      this.globalState.set(AUTOMATIONS_INSTALLATION_ID_KEY, installationId);
      await this.globalState.flushOrThrow();
    }
    const owner = { ...principal, installationId };
    return (await this.checkOwner(owner), owner);
  }

  async getActiveOwner() {
    const owner = this.usableOwner;
    if (owner == null) throw new Error("Local automation cloud storage is unavailable");
    return (await this.checkOwner(owner), owner);
  }

  get usableOwner() {
    return this.owner != null && this.getPersistedStatus(this.owner) === "complete" ? this.owner : null;
  }

  /** owner 一致性校验（原 `checkOwner`）。 */
  async checkOwner(owner: HabitatOwner) {
    const current = await this.appServerClient.getAuthenticatedPrincipal();
    if (
      current?.accountId !== owner.accountId ||
      current.userId !== owner.userId ||
      this.globalState.get("electron-automations-installation-id") !== owner.installationId
    )
      throw new Error("The signed-in automation owner or rollout changed");
  }

  /** 读云端 enrollment（原 `readEnrollment`）。 */
  async readEnrollment(owner: HabitatOwner) {
    const params = new URLSearchParams({ installation_id: owner.installationId as string });
    const { status } = (enrollmentStatusSchema.parse(
      await this.request(owner, "read local automation enrollment", `/automations/local_storage_enrollment?${params.toString()}`, "GET"),
    ) as { status: string });
    this.enrollmentStatus = status;
    this.enrollmentOwnerKey = `${owner.accountId}:${owner.userId}:${owner.installationId}`;
  }

  /** 写云端 enrollment（原 `writeEnrollment`）。 */
  async writeEnrollment(owner: HabitatOwner, action: string) {
    const { status } = (enrollmentStatusSchema.parse(
      await this.request(owner, "update local automation enrollment", "/automations/local_storage_enrollment", "POST", {
        installation_id: owner.installationId,
        action,
      }),
    ) as { status: string });
    if (status !== (action === "accept" ? "accepted" : "complete") && (action !== "accept" || status !== "complete"))
      throw new Error("Local automation enrollment was not confirmed");
    this.enrollmentStatus = status;
    this.enrollmentOwnerKey = `${owner.accountId}:${owner.userId}:${owner.installationId}`;
  }

  /** 双向同步（原 `syncOwner`）：清理云端归档 → 分页拉取 → 本地投影 → 剪除。 */
  async syncOwner(owner: HabitatOwner) {
    await this.checkOwner(owner);
    const archivedIds = getArchivedHeartbeatIds(owner as never) as string[];
    await Promise.all(
      (archivedIds as string[]).map((id) =>
        this.request(owner, "delete archived heartbeat", "/automations/remove", "POST", {
          automation_id: id,
        }),
      ),
    );
    const records: Record<string, unknown>[] = [];
    const seenCursors = new Set<string>();
    const fetchPage = async (cursor: string | null) => {
      const params = new URLSearchParams({
        filter: "local",
        installation_id: owner.installationId as string,
        limit: "100",
      });
      if (cursor != null) params.set("cursor", cursor);
      const page = cloudAutomationPageSchema.parse(
        await this.request(owner, "list local automations", `/automations?${params.toString()}`, "GET"),
      ) as { items: Record<string, unknown>[]; cursor: string | null };
      for (const record of page.items) {
        if (record.installation_id !== owner.installationId)
          throw new Error("Local automation belongs to another installation");
        records.push(record);
      }
      if (page.cursor != null) {
        if (seenCursors.size >= 100 || seenCursors.has(page.cursor))
          throw new Error("Local automation discovery returned invalid pagination");
        seenCursors.add(page.cursor);
        await fetchPage(page.cursor);
      }
    };
    await fetchPage(null);
    await this.checkOwner(owner);
    for (const record of records)
      if (cacheCloudAutomation(cloudRecordToLocal(record, getLocalAutomation(record.id as string) as LocalAutomation | null), owner as never, record.legacy_automation_id) == null)
        throw new Error("Cloud automation could not be cached locally");
    const cloudIds = new Set(records.map(({ id }) => id as string));
    for (const id of archivedIds) if (!cloudIds.has(id)) removeLocalAutomation(id);
    pruneNonCloudAutomations(cloudIds, owner as never);
    this.onChanged();
  }

  /** 保存并独立验证（原 `saveAndVerify`）。 */
  async saveAndVerify(existingId: string | null, automation: LocalAutomation, owner: HabitatOwner, legacyId: string): Promise<Record<string, unknown>> {
    const localConfiguration = toLocalConfiguration(automation);
    const saved = cloudAutomationSchema.parse(
      await this.request(
        owner,
        existingId == null ? "create local automation" : "update local automation",
        "/automations/save",
        "POST",
        {
          default_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          email_enabled: false,
          executor: "local",
          installation_id: owner.installationId,
          is_enabled: automation.status === "ACTIVE",
          jawbone_id: existingId,
          legacy_automation_id: legacyId,
          local_configuration: localConfiguration,
          notification_policy: automation.notificationPolicy ?? null,
          notifications_enabled: false,
          model: automation.model,
          prompt: automation.prompt,
          reasoning_effort: automation.reasoningEffort,
          schedule: wrapRrule(automation.rrule),
          target_thread_id: automation.kind === "heartbeat" ? automation.targetThreadId : null,
          timing_mode: 0,
          title: automation.name,
        },
      ),
    ) as Record<string, unknown>;
    // 已有同名记录时（id 冲突）改走更新路径。
    if (existingId == null && !cloudRecordMatches(saved, automation, localConfiguration)) {
      if (saved.installation_id !== owner.installationId || saved.legacy_automation_id !== legacyId)
        throw new Error("Existing automation belongs to another installation");
      return this.saveAndVerify(saved.id as string, automation, owner, legacyId);
    }
    const verified = cloudAutomationSchema.parse(
      await this.request(
        owner,
        "verify saved automation",
        `/automation/${encodeURIComponent(saved.id as string)}`,
        "GET",
      ),
    ) as Record<string, unknown>;
    if (
      verified.id !== saved.id ||
      verified.installation_id !== owner.installationId ||
      verified.legacy_automation_id !== legacyId ||
      !cloudRecordMatches(verified, automation, localConfiguration)
    )
      throw new Error("Saved automation could not be independently verified");
    return verified;
  }

  /** 云端请求门面（原 `request`）：前后校验 owner，404 automation_not_found 静默。 */
  async request(owner: HabitatOwner, action: string, path: string, method: string, body?: unknown) {
    await this.checkOwner(owner);
    const response = (await authedFetch(
      {
        action,
        appServerClient: this.appServerClient,
        desktopApiOptions: this.desktopApiOptions,
        path,
        beforeSend: () => this.checkOwner(owner),
        request: {
          method,
          headers: body == null ? {} : { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15e3),
          body: body == null ? undefined : JSON.stringify(body),
        },
      },
      this.fetch,
    )) as Response;
    await this.checkOwner(owner);
    if (
      response.status === 404 &&
      path === "/automations/remove" &&
      ((objectSchema({ detail: objectSchema({ code: stringSchema() }) }) as unknown as { safeParse(input: unknown): { success: boolean; data?: { detail?: { code?: string } } } })
        .safeParse(await response.json()).data?.detail?.code === "automation_not_found")
    ) {
      await this.checkOwner(owner);
      return;
    }
    if (!response.ok) throw new Error(`${action} failed (${response.status})`);
    const json = response.status === 204 ? undefined : await response.json();
    return (await this.checkOwner(owner), json);
  }
}

// ---------------------------------------------------------------------------
// 装配（原 `NOe`/`POe`/`FOe`）
// ---------------------------------------------------------------------------

/** item/completed 的 mcpToolCall 过滤 schema（原 `MOe`）。 */
const automationToolCallSchema = objectSchema({
  item: objectSchema({
    type: literalSchema("mcpToolCall"),
    appContext: objectSchema({ connectorId: literalSchema("connector_openai_automations") }),
  }),
});

/** 注册 habitat automations（原 `NOe`）。 */
function registerHabitatAutomations(
  appServerClient: {
    registerInternalAuthenticatedPrincipalChangeHandler(cb: (event: { current: { accountId: string; userId: string } | null }) => void): () => void;
    registerInternalNotificationHandler(cb: (notification: { method: string; params: unknown }) => void): () => void;
  } & HabitatAutomations["appServerClient"],
  desktopApiOptions: unknown,
  globalState: HabitatGlobalState,
  invalidateQueries: (keys: string[], all?: boolean) => void,
  disposables: { add(dispose: () => void): void },
) {
  const invalidate = (all = false) => {
    invalidateQueries(["vscode", "list-automations"], all);
    invalidateQueries(["vscode", "inbox-items"], all);
    invalidateQueries(["cloud-automations"]);
    invalidateQueries(["local-automation-habitat-migration"]);
  };
  const automations = new HabitatAutomations(
    appServerClient,
    desktopApiOptions,
    globalState,
    () => getDesktopFeatureAvailability().localAutomationHabitatMigration,
    (url, init) => net.fetch(url, init),
    invalidate,
  );
  const unsubscribePrincipal = appServerClient.registerInternalAuthenticatedPrincipalChangeHandler(({ current }) => {
    automations.handlePrincipalChanged(current);
    invalidate(true);
  });
  const unsubscribeNotifications = appServerClient.registerInternalNotificationHandler((notification) => {
    if (notification.method === "item/completed" && automationToolCallSchema.safeParse(notification.params).success) {
      automations.sync().catch((error) => {
        logger().warning("Failed to refresh automations after hosted tool call", {
          safe: {},
          sensitive: { error },
        });
      });
    }
  });
  disposables.add(() => {
    unsubscribePrincipal();
    unsubscribeNotifications();
  });
  return automations;
}

/** 本地 host 的 automation 操作面（原 `POe`）。 */
function localAutomationOps(
  hostId: string,
  getAutomations: () => HabitatAutomations,
) {
  return hostId === "local"
    ? {
        onDeleteAutomation: (id: string) => getAutomations().deleteArchivedHeartbeat(id),
        getHostedAutomationInstallationId: () => getAutomations().getHostedInstallationId(),
        isAutomationMigrationInProgress: () => getAutomations().isLocalMigrationActive(),
      }
    : {};
}

/** cron 完成后退订线程（原 `FOe`）。 */
async function unsubscribeCompletedAutomation(
  unsubscribeThread: (threadId: string) => Promise<void>,
  completion: { automationKind: string; hostId: string; threadId: string },
  windowOwners: Array<() => { ownsThread(hostId: string, threadId: string): boolean }>,
  appViews: Set<{ services: Promise<{ clientCoordination: unknown }> }>,
) {
  if (completion.automationKind === "cron" && completion.hostId === "local") {
    try {
      const { hostId, threadId } = completion;
      const normalizedThreadId = threadIdOf(threadId);
      const isOwned = () => {
        for (const getOwner of windowOwners) if (getOwner().ownsThread(hostId, normalizedThreadId)) return true;
        return false;
      };
      if (isOwned()) return;
      const unsubscribes = await Promise.allSettled(
        Array.from(appViews, async (view) => requestThreadUnsubscribe((await view.services).clientCoordination, hostId, normalizedThreadId)),
      );
      if (isOwned() || unsubscribes.some((result) => result.status === "rejected" || (result.status === "fulfilled" && result.value === true))) return;
      await unsubscribeThread(threadId);
    } catch (error) {
      logger().warning("Failed to unsubscribe completed automation", {
        safe: { threadId: completion.threadId },
        sensitive: { error },
      });
    }
  }
}

export {
  cloudAutomationSchema,
  cloudRecordToLocal,
  normalizeSchedule,
  wrapRrule,
  HabitatAutomations,
  registerHabitatAutomations,
  localAutomationOps,
  unsubscribeCompletedAutomation,
  type LocalAutomation,
  type HabitatOwner,
  type HabitatGlobalState,
};
