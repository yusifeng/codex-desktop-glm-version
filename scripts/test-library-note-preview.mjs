import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("library-note-preview");
console.log(`${assertions} library note preview release assertions passed`);
