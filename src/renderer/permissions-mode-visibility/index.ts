import "@rchunk/rolldown-runtime";
import {
  dun as createFeatureFlag,
  uun as initializeFeatureFlags,
} from "@rchunk/app-initial";

export type PermissionMode =
  | "auto"
  | "custom"
  | "full-access"
  | "granular"
  | "guardian-approvals"
  | "read-only";

function resolveFullAccessVisibility(
  value: boolean | { "full-access"?: boolean } | null | undefined,
): boolean {
  return typeof value === "boolean" ? value : (value?.["full-access"] ?? true);
}

function getPermissionModeVisibility({
  canShowDefaultPermissions,
  canSelectGuardianMode,
  canShowConfigCustom,
  canShowConfigFullAccess,
  canShowGuardianOption,
  selectionAgentModes,
  visibleAgentModes,
}: {
  canShowDefaultPermissions: boolean;
  canSelectGuardianMode: boolean;
  canShowConfigCustom: boolean;
  canShowConfigFullAccess: boolean;
  canShowGuardianOption: boolean;
  selectionAgentModes: PermissionMode[];
  visibleAgentModes: PermissionMode[];
}): {
  canShowCustom: boolean;
  canShowFullAccess: boolean;
  optionCount: number;
  showGuardianOption: boolean;
} {
  const canShowFullAccess =
    canShowConfigFullAccess && visibleAgentModes.includes("full-access");
  const canShowCustom = canShowConfigCustom && selectionAgentModes.includes("custom");
  return {
    canShowCustom,
    canShowFullAccess,
    optionCount:
      Number(canShowDefaultPermissions) +
      Number(canShowGuardianOption && canSelectGuardianMode) +
      Number(canShowFullAccess) +
      Number(canShowCustom),
    showGuardianOption: canShowGuardianOption,
  };
}

function getVisiblePermissionModes({
  availableAgentModes,
  showFullAccessInComposer,
}: {
  availableAgentModes: PermissionMode[];
  showFullAccessInComposer: boolean;
}): PermissionMode[] {
  return availableAgentModes.filter((mode) => {
    if (mode === "full-access") return showFullAccessInComposer;
    if (mode === "custom") return false;
    return true;
  });
}

function getSelectablePermissionModes({
  availableAgentModes,
  visibleAgentModes,
}: {
  availableAgentModes: PermissionMode[];
  visibleAgentModes: PermissionMode[];
}): PermissionMode[] {
  return availableAgentModes.includes("custom")
    ? [...visibleAgentModes, "custom"]
    : visibleAgentModes;
}

let composerPermissionModeVisibility: unknown;

function initializePermissionsModeVisibility(): void {
  initializeFeatureFlags();
  composerPermissionModeVisibility = createFeatureFlag(
    "composer-permission-mode-visibility",
    true,
  );
}

export {
  initializePermissionsModeVisibility as a,
  getVisiblePermissionModes as i,
  getSelectablePermissionModes as n,
  composerPermissionModeVisibility as o,
  resolveFullAccessVisibility as r,
  getPermissionModeVisibility as t,
};
