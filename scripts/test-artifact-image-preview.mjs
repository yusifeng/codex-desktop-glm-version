import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("image-side-panel", [/panorama_load/, /Image comment surface/]);
assertions += assertReleaseOwner("library-image-preview");
console.log(`${assertions} artifact image preview release assertions passed`);
