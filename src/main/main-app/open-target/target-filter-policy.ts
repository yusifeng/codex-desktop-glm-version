/** Pure target filtering policy for local and remote open-in hosts. */

export interface OpenTarget {
  id: string;
  supportsSsh?: boolean;
}

export interface TargetFilterPredicates<HostConfig> {
  isHostConfig: (value: unknown) => boolean;
  isLocalHost: (value: HostConfig) => boolean;
  isRemoteHost: (value: HostConfig) => boolean;
  remoteHostLabel: (value: HostConfig) => string | null;
  platform: string;
}

export function isTargetSupported<HostConfig>(
  target: OpenTarget,
  hostConfig: HostConfig,
  predicates: TargetFilterPredicates<HostConfig>,
): boolean {
  if (!predicates.isHostConfig(hostConfig)) return true;
  if (predicates.isLocalHost(hostConfig)) {
    return predicates.platform === `win32` && target.id === `fileManager`;
  }
  if (!predicates.isRemoteHost(hostConfig)) return false;
  return target.id === `zed`
    ? target.supportsSsh !== false && predicates.remoteHostLabel(hostConfig) != null
    : !!target.supportsSsh;
}

export function filterTargetsForHost<HostConfig>(
  hostConfig: HostConfig,
  targets: OpenTarget[],
  predicates: TargetFilterPredicates<HostConfig>,
): OpenTarget[] {
  return targets.filter((target) => isTargetSupported(target, hostConfig, predicates));
}

export function filterTargetIdsForHost<HostConfig>(
  hostConfig: HostConfig,
  targetIds: string[],
  targets: OpenTarget[],
  predicates: TargetFilterPredicates<HostConfig>,
): string[] {
  if (!predicates.isHostConfig(hostConfig)) return targetIds;
  const byId = new Map(targets.map((target) => [target.id, target]));
  return targetIds.filter((id) => {
    const target = byId.get(id);
    return target != null && isTargetSupported(target, hostConfig, predicates);
  });
}

if (typeof module !== "undefined") module.exports = {
  isTargetSupported,
  filterTargetsForHost,
  filterTargetIdsForHost,
};
