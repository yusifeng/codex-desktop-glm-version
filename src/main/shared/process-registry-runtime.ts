import {
  adoptMigratedAutomation as adopt,
  cacheCloudAutomation,
  commitAutomationRunThread as commitRunThread,
  collectPendingMigrations,
  computeAutomationNextRun,
  computeNextRunAtFromRrule,
  createLocalAutomation,
  getArchivedHeartbeatIds,
  getCanonicalAutomation,
  getLocalIdentity,
  hasMigrationConflicts,
  isMigratedAutomation,
  isRruleDue,
  isSingleRrule,
  listLocalAutomations,
  pruneAutomationRegistry,
  pruneNonCloudAutomations,
  recordAutomationRunPendingStart,
  recordAutomationRunStart,
  removeAutomationWithStatus,
  removeLocalAutomation,
  setMigrationOwner,
  settleInterruptedAutomationRuns as settleRuns,
  failAutomationRun as failRun,
  updateAutomationNextRunAt,
  updateCanonicalRecord,
  updateLocalAutomation,
} from "./automation-registry";
import type { AutomationOwner, AutomationRecord } from "./automation-registry";

export type AutomationPrincipal = AutomationOwner;
export type { AutomationRecord };
let currentOwner: AutomationPrincipal | null = null;

export function setAutomationOwner(owner: AutomationPrincipal | null, mode: "complete" | "in_progress" = "complete"): void {
  currentOwner = owner;
  setMigrationOwner(owner, mode);
}
export function currentAutomationPrincipal(): AutomationPrincipal | null { return currentOwner; }
export function migrationConflicts(excluded?: Set<string>): boolean { return hasMigrationConflicts(excluded == null ? undefined : [...excluded]); }
export function legacyAutomationId(id: string): string | null { return getLocalIdentity(id); }
export function getLocalAutomation(id: string): AutomationRecord | null { return getCanonicalAutomation(id); }
export function adoptMigratedAutomation(id: string, target: AutomationRecord, owner: AutomationPrincipal, legacyId?: string): AutomationRecord | null { return adopt(id, target, owner, legacyId); }
export function recordAutomationRunPendingStartCompat(id: string, token?: string, name?: string, cwd?: string | null): boolean { return recordAutomationRunPendingStart(id, token ?? id, name ?? "", cwd ?? null); }
export function setAutomationNextRunAt(id: string, nextRunAt: number | null): boolean { return updateAutomationNextRunAt(id, nextRunAt); }
export function settleInterruptedAutomationRuns(): boolean { return settleRuns(); }
export function commitAutomationRunThread(id: string, threadId: string): boolean { return commitRunThread(id, threadId); }
export function failAutomationRun(id: string, source?: string): boolean { return failRun(id, source ?? "auto"); }

export {
  listLocalAutomations, collectPendingMigrations, getArchivedHeartbeatIds, isMigratedAutomation,
  isSingleRrule, computeNextRunAtFromRrule, computeAutomationNextRun, isRruleDue,
  recordAutomationRunStart, updateLocalAutomation, updateCanonicalRecord, createLocalAutomation,
  cacheCloudAutomation, removeLocalAutomation, removeAutomationWithStatus, pruneNonCloudAutomations,
  pruneAutomationRegistry,
};

export {
  setAutomationOwner as Br, currentAutomationPrincipal as Cr, migrationConflicts as Dr,
  computeNextRunAtFromRrule as Er, adoptMigratedAutomation as Fr, pruneNonCloudAutomations as Lr,
  collectPendingMigrations as Mr, getArchivedHeartbeatIds as Nr, isMigratedAutomation as Or,
  recordAutomationRunStart as Pr, legacyAutomationId as Sr, computeAutomationNextRun as Tr,
  updateLocalAutomation as Vr, pruneAutomationRegistry as _r, removeLocalAutomation as br,
  isSingleRrule as kr, getLocalAutomation as xr, cacheCloudAutomation as vr,
  createLocalAutomation as yr, setAutomationNextRunAt as zr,
  recordAutomationRunPendingStartCompat as Qr, getCanonicalAutomation as Xr,
};
