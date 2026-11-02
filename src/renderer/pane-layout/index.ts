// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { I3 as t } from "@rchunk/app-shared";
function n(e, { header: t, headerPlacement: n, content: i }) {
  return e({
    headerRows: [{ id: `artifact-header`, height: `content`, placement: n, content: t }],
    content: (0, r.jsx)(`div`, { className: `flex h-full min-h-0 min-w-0 flex-col`, children: i }),
  });
}
var r;
function i() {
  return (i = e(() => {
    r = t();
  }))();
}
export { n, i as t };
