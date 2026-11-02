// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, FX as n, I3 as r, If as i } from "@rchunk/app-shared";
import { Sun as a, cJt as o } from "@rchunk/app-initial";
import { Zd as s } from "@rchunk/app-primary";
function c({ libraryFileId: e, parentDirectoryId: t, onNavigate: n }) {
  return null;
}
function l() {
  return (l = e(() => {
    (t(), n(), a(), o(), i(), s(), r());
  }))();
}
function u(e) {
  return d[e];
}
var d;
function f() {
  return (f = e(() => {
    d = {
      csv: void 0,
      docx: `artifact`,
      ipynb: `surface`,
      pdf: `artifact`,
      pptx: `artifact`,
      tex: `surface`,
      "text-document": `surface`,
      tsv: void 0,
      xlsx: void 0,
    };
  }))();
}
export { l as i, f as n, c as r, u as t };
