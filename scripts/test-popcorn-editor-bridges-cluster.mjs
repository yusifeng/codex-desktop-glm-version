import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
for (const [owner, exportName] of [
  ["popcorn-presentation-panel", "PopcornElectronPresentationPanel"],
  ["popcorn-workbook-panel", "PopcornElectronWorkbookPanel"],
  ["popcorn-document-panel", "PopcornElectronDocumentPanel"],
]) {
  assertions += assertReleaseOwner(owner, [
    new RegExp(`export \\{ [A-Za-z_$][\\w$]* as ${exportName} \\}`),
  ]);
}
console.log(`Popcorn editor release-faithful assertions passed (${assertions})`);
