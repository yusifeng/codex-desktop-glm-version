// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t(e) {
  if (
    e != null &&
    ((e.appMetadata != null &&
      `firstPartyType` in e.appMetadata &&
      typeof e.appMetadata.firstPartyType == `string` &&
      e.appMetadata.firstPartyType.trim() !== ``) ||
      e.distributionChannel === `DEFAULT_OAI_CATALOG` ||
      e.distributionChannel === `ECOSYSTEM_DIRECTORY`)
  )
    return e.name;
}
function n() {
  return (n = e(() => {}))();
}
export { n, t };
