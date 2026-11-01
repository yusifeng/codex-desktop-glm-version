import { Qu as isValidSemver, Zu as compareSemver } from "@chunk/shared";

export const APP_SERVER_SECTIONS_VERSION = "0.148.0-alpha.7";

export function isValidAppServerVersion(version: unknown): version is string {
  return version != null && isValidSemver(version);
}

export function supportsAppServerSections(version: unknown): boolean {
  return isValidAppServerVersion(version) && compareSemver(version, APP_SERVER_SECTIONS_VERSION) >= 0;
}
