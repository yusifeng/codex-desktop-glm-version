export type CloudUnavailableReason = "remote-project" | "pull-request" | "context" | "account" | null;
export interface CloudUnavailableInput { cloudAccess: unknown; supportsCloud: boolean; isPrimaryReviewComposer: boolean; isRemoteProject: boolean }
export function deriveCloudUnavailableReason(input: CloudUnavailableInput): CloudUnavailableReason {
  if (input.isRemoteProject) return "remote-project";
  if (input.isPrimaryReviewComposer) return "pull-request";
  if (input.cloudAccess === "enabled") return input.supportsCloud ? null : "context";
  return "account";
}
