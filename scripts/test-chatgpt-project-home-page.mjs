import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("chatgpt-project-home-page", [
  /@rchunk\/chatgpt-project-share-dialog/,
  /@rchunk\/chatgpt-project-settings-modal/,
  /@rchunk\/chatgpt-project-add-sources-dialog/,
  /export \{ Uo as ChatGptProjectHome \}/,
]);

console.log(`${assertions} release-faithful project home assertions passed`);
