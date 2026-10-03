import { createHash, randomUUID } from "node:crypto";

import {
  effectiveExecutionEnvironment,
  effectiveRrule,
  isCronAutomation,
  isHeartbeatAutomation,
} from "./automation-settings";

export interface AutomationOwner {
  accountId: string;
  userId: string;
  installationId: string | null;
}

export interface AutomationRecord {
  id: string;
  name: string;
  prompt: string;
  status: string;
  kind: "cron" | "heartbeat";
  rrule: string;
  nextRunAt: number | null;
  lastRunAt: number | null;
  createdAt: number;
  updatedAt: number;
  model: string | null;
  reasoningEffort: string | null;
  notificationPolicy?: string;
  targetThreadId?: string;
  pluginTemplateId?: string | null;
  target?: { type: string; projectId?: string } | null;
  cwds?: string[];
  executionEnvironment?: string | null;
  localEnvironmentConfigPath?: string | null;
  legacyAutomationId?: string | null;
}

type CreateInput = Partial<AutomationRecord> & {
  name: string;
  prompt: string;
  kind: "cron" | "heartbeat";
};

const records = new Map<string, AutomationRecord>();
const owners = new Map<string, AutomationOwner>();
const legacyIds = new Map<string, string>();
const pendingRuns = new Map<string, { automationId: string; startedAt: number; name: string; cwd: string | null }>();
const runThreads = new Map<string, string>();
let migrationOwner: AutomationOwner | null = null;
let migrationState: "in_progress" | "complete" = "complete";

/** SQL parameter tuple used by the registry's owner-scope predicates (原 cB). */
export function automationScopeParams(): [number, string | null, string | null, string | null] {
  const owner = migrationOwner;
  return [
    migrationState === "in_progress" || owner == null ? 1 : 0,
    owner?.accountId ?? null,
    owner?.userId ?? null,
    owner?.installationId ?? null,
  ];
}

function clone(record: AutomationRecord): AutomationRecord {
  return {
    ...record,
    target: record.target == null ? record.target : { ...record.target },
    cwds: record.cwds == null ? record.cwds : [...record.cwds],
  };
}

function normalize(record: CreateInput): AutomationRecord {
  const now = Date.now();
  const id = record.id?.trim() || slug(record.name);
  return {
    id,
    name: record.name,
    prompt: record.prompt,
    status: record.status ?? "ACTIVE",
    kind: record.kind,
    rrule: effectiveRrule(record.rrule),
    nextRunAt: record.nextRunAt ?? null,
    lastRunAt: record.lastRunAt ?? null,
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? now,
    model: record.model?.trim() || null,
    reasoningEffort: record.reasoningEffort ?? null,
    ...(record.notificationPolicy == null ? {} : { notificationPolicy: record.notificationPolicy }),
    ...(record.targetThreadId == null ? {} : { targetThreadId: record.targetThreadId }),
    pluginTemplateId: record.pluginTemplateId ?? null,
    target: record.target ?? (record.kind === "cron" ? { type: "projectless" } : null),
    cwds: record.kind === "cron" ? [...(record.cwds ?? [])] : undefined,
    executionEnvironment: record.kind === "cron" ? effectiveExecutionEnvironment(record.executionEnvironment) : undefined,
    localEnvironmentConfigPath: record.localEnvironmentConfigPath ?? null,
    legacyAutomationId: record.legacyAutomationId ?? null,
  };
}

function slug(value: string): string {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "automation";
  if (!records.has(base)) return base;
  for (let i = 2; i <= 20; i += 1) if (!records.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function ownerMatches(id: string, owner: AutomationOwner | null = migrationOwner): boolean {
  if (owner == null) return true;
  const actual = owners.get(id);
  return actual == null || (actual.accountId === owner.accountId && actual.userId === owner.userId && actual.installationId === owner.installationId);
}

export function listLocalAutomations(): AutomationRecord[] {
  return [...records.values()].filter((record) => record.status !== "DELETED").map(clone).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCanonicalAutomation(id: string): AutomationRecord | null {
  const record = records.get(id);
  return record == null || record.status === "DELETED" || !ownerMatches(id) ? null : clone(record);
}

export function createLocalAutomation(input: CreateInput, cwds: string[] = [], options?: { persist?: boolean }): AutomationRecord | null {
  const record = normalize({ ...input, cwds: input.kind === "cron" ? cwds : undefined });
  if (records.has(record.id)) return null;
  if (options?.persist !== false) records.set(record.id, record);
  return clone(record);
}

export function updateLocalAutomation(input: CreateInput, cwds: string[] = [], options?: { persist?: boolean }): AutomationRecord | null {
  const record = normalize({ ...input, cwds: input.kind === "cron" ? cwds : undefined });
  if (!records.has(record.id)) return null;
  const previous = records.get(record.id)!;
  const updated = { ...previous, ...record, createdAt: previous.createdAt, updatedAt: Date.now() };
  if (options?.persist !== false) records.set(updated.id, updated);
  return clone(updated);
}

export function updateCanonicalRecord(input: CreateInput, cwds: string[] = []): AutomationRecord | null {
  const existing = records.get(input.id ?? "");
  if (existing == null) return createLocalAutomation(input, cwds);
  return updateLocalAutomation(input, cwds);
}

export function cacheCloudAutomation(input: CreateInput, owner: AutomationOwner, legacyAutomationId?: string): AutomationRecord | null {
  const record = normalize({ ...input, legacyAutomationId: legacyAutomationId ?? input.legacyAutomationId });
  records.set(record.id, record);
  owners.set(record.id, owner);
  if (record.legacyAutomationId != null) legacyIds.set(record.id, record.legacyAutomationId);
  return clone(record);
}

export function removeLocalAutomation(id: string): "deleted" | "not_found" | "state_cleanup_failed" {
  if (!records.has(id)) return "not_found";
  records.delete(id);
  owners.delete(id);
  legacyIds.delete(id);
  return "deleted";
}

export const removeAutomationWithStatus = removeLocalAutomation;

export function isMigratedAutomation(id: string): boolean {
  return owners.has(id) || legacyIds.has(id);
}

export function getLocalIdentity(id: string): string | null {
  return legacyIds.get(id) ?? null;
}

export function collectPendingMigrations(_before?: Map<string, string>): AutomationRecord[] {
  return listLocalAutomations().filter((record) => !isMigratedAutomation(record.id));
}

export function hasMigrationConflicts(ids?: string[]): boolean {
  const seen = new Set<string>();
  for (const id of ids ?? []) {
    if (seen.has(id)) return true;
    seen.add(id);
  }
  return false;
}

export function setMigrationOwner(owner: AutomationOwner | null, state: "in_progress" | "complete" = "complete"): void {
  migrationOwner = owner;
  migrationState = state;
}

export function adoptMigratedAutomation(id: string, record: CreateInput, owner: AutomationOwner, legacyId?: string): AutomationRecord | null {
  if (legacyId != null) legacyIds.set(id, legacyId);
  return cacheCloudAutomation({ ...record, id }, owner, legacyId);
}

export function getArchivedHeartbeatIds(owner: AutomationOwner): string[] {
  return [...records.values()].filter((record) => record.kind === "heartbeat" && record.status === "DELETED" && ownerMatches(record.id, owner)).map((record) => record.id);
}

export function pruneNonCloudAutomations(cloudIds: Set<string>, owner: AutomationOwner): number {
  let removed = 0;
  for (const record of [...records.values()]) {
    if (!cloudIds.has(record.id) && ownerMatches(record.id, owner) && isMigratedAutomation(record.id)) {
      removeLocalAutomation(record.id);
      removed += 1;
    }
  }
  return removed;
}

export function isSingleRrule(rrule: string): boolean {
  return /(?:^|[;\n])COUNT=1(?:;|$)/i.test(rrule) && !/(?:^|[;\n])(?:RDATE|EXDATE|EXRULE)=/i.test(rrule);
}

function ruleParts(rrule: string): Map<string, string> {
  const parts = new Map<string, string>();
  for (const part of rrule.replace(/^RRULE:/i, "").split(/[;\n]/)) {
    const index = part.indexOf("=");
    if (index > 0) parts.set(part.slice(0, index).toUpperCase(), part.slice(index + 1));
  }
  return parts;
}

export function computeNextRunAtFromRrule({ rrule, now }: { rrule: string; now: number }): number | null {
  const parts = ruleParts(rrule);
  const freq = parts.get("FREQ")?.toUpperCase();
  const interval = Math.max(1, Number(parts.get("INTERVAL") ?? 1));
  if (freq == null) return null;
  const date = new Date(now);
  date.setSeconds(0, 0);
  const minute = Number(parts.get("BYMINUTE")?.split(",")[0] ?? date.getMinutes());
  const hour = Number(parts.get("BYHOUR")?.split(",")[0] ?? date.getHours());
  if (!["MINUTELY", "HOURLY", "DAILY", "WEEKLY"].includes(freq)) return null;
  if (freq === "MINUTELY") date.setTime(now + interval * 60_000);
  else if (freq === "HOURLY") {
    date.setMinutes(minute, 0, 0);
    if (date.getTime() <= now) date.setHours(date.getHours() + interval);
  } else if (freq === "DAILY") {
    date.setHours(hour, minute, 0, 0);
    while (date.getTime() <= now) date.setDate(date.getDate() + interval);
  } else {
    date.setHours(hour, minute, 0, 0);
    while (date.getTime() <= now) date.setDate(date.getDate() + 7 * interval);
  }
  return date.getTime() > now ? date.getTime() : null;
}

export function computeAutomationNextRun(input: { automation: Pick<AutomationRecord, "rrule">; now: number }): number | null {
  return computeNextRunAtFromRrule({ rrule: input.automation.rrule, now: input.now });
}

export function isRruleDue(rrule: string): boolean {
  return computeNextRunAtFromRrule({ rrule, now: Date.now() - 60_000 }) != null;
}

export function updateAutomationNextRunAt(id: string, nextRunAt: number | null): boolean {
  const record = records.get(id);
  if (record == null) return false;
  record.nextRunAt = nextRunAt;
  record.updatedAt = Date.now();
  return true;
}

export function recordAutomationRunStart(id: string, nextRunAt: number | null): boolean {
  const record = records.get(id);
  if (record == null) return false;
  record.lastRunAt = Date.now();
  record.nextRunAt = nextRunAt;
  return true;
}

export function recordAutomationRunPendingStart(id: string, token: string, name: string, cwd: string | null): boolean {
  pendingRuns.set(token, { automationId: id, startedAt: Date.now(), name, cwd });
  return true;
}

export function commitAutomationRunThread(token: string, threadId: string): boolean {
  const pending = pendingRuns.get(token);
  if (pending == null) return false;
  runThreads.set(threadId, pending.automationId);
  pendingRuns.delete(token);
  return true;
}

export function failAutomationRun(token: string, _source: string): boolean {
  return pendingRuns.delete(token);
}

export function settleInterruptedAutomationRuns(): boolean {
  const changed = pendingRuns.size > 0;
  pendingRuns.clear();
  return changed;
}

export function pruneAutomationRegistry(now: number): number {
  let count = 0;
  for (const [token, pending] of pendingRuns) {
    if (now - pending.startedAt > 86_400_000) {
      pendingRuns.delete(token);
      count += 1;
    }
  }
  return count;
}

export function automationIdentity(owner: AutomationOwner): string {
  return createHash("sha256").update(`${owner.accountId}:${owner.userId}:${owner.installationId ?? ""}`).digest("hex");
}

export {
  listLocalAutomations as Ar,
  setMigrationOwner as Br,
  automationScopeParams as Cr,
  migrationOwner as ownerState,
  hasMigrationConflicts as Dr,
  computeNextRunAtFromRrule as Er,
  adoptMigratedAutomation as Fr,
  migrateLegacyAutomations as Ir,
  pruneNonCloudAutomations as Lr,
  collectPendingMigrations as Mr,
  getArchivedHeartbeatIds as Nr,
  isMigratedAutomation as Or,
  recordAutomationRunStart as Pr,
  getLocalIdentity as Sr,
  computeAutomationNextRun as Tr,
  updateCanonicalRecord as Vr,
  pruneAutomationRegistry as _r,
  removeLocalAutomation as br,
  isSingleRrule as kr,
  recordAutomationRunPendingStart as Qr,
  getCanonicalAutomation as xr,
  cacheCloudAutomation as vr,
  createLocalAutomation as yr,
  updateAutomationNextRunAt as zr,
};

function migrateLegacyAutomations(resolveTarget: (cwd: string) => Promise<{ type: string; projectId?: string } | null>): Promise<number> {
  return Promise.resolve().then(async () => {
    let migrated = 0;
    for (const record of listLocalAutomations()) {
      if (!isCronAutomation(record) || record.target != null || record.cwds == null) continue;
      const target = await resolveTarget(record.cwds[0] ?? "");
      if (target == null) continue;
      updateCanonicalRecord({ ...record, target, cwds: [record.cwds[0]!] });
      migrated += 1;
    }
    return migrated;
  });
}
