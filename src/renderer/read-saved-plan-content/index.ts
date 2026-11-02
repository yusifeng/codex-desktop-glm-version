// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { n as t, r as n } from "@rchunk/text-file-storage";
async function r({ hostId: e, path: t, save: r }) {
  if (r != null && !(await r())) throw Error(`Could not save the edited plan`);
  return (await n({ filePath: t, hostId: e })).content;
}
function i() {
  return (i = e(() => {
    t();
  }))();
}
export { r as n, i as t };
