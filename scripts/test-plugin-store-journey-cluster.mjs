import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
let assertions = 0;
assertions += assertReleaseOwner("plugin-request-empty-state", [
  /@rchunk\/hosted-plugin-creation-actions/,
  /@rchunk\/plugin-setup/,
  /export \{/,
]);
assertions += assertReleaseOwner("plugins-store-page", [
  /@rchunk\/use-search-plugins/,
  /@rchunk\/hosted-plugin-create-dialog/,
  /export \{ ki as i, Zo as n, Si as r, Wo as t \}/,
]);
console.log(`${assertions} release-faithful plugin store assertions passed`);
