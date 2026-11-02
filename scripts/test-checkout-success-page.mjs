import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const assertions = assertReleaseOwner("checkout-success-page", [
  /@rchunk\/checkout-session/,
  /@rchunk\/subscription-onboarding-content/,
  /export \{ ni as CheckoutSuccessPage \}/,
]);
console.log(`${assertions} release-faithful checkout success assertions passed`);
