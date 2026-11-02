// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { wL as t } from "@rchunk/app-shared";
import { dnt as n } from "@rchunk/app-initial";
import { n as r } from "@rchunk/chronicle-settings";
function i(e) {
  return (
    e.stage === `beta` &&
    e.name !== `memories` &&
    e.name !== `multi_agent` &&
    e.name !== `plugins` &&
    e.name !== `plugin` &&
    e.name !== `remote_control` &&
    !e.name.startsWith(`realtime_`) &&
    e.name !== `chronicle` &&
    e.name !== `workspace_dependencies`
  );
}
function a() {
  return (a = e(() => {
    (t(), n(), r());
  }))();
}
export { i as n, a as t };
