import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const assertions = assertReleaseOwner("pricing-plan-page", [
  /@rchunk\/pricing-plan-comparison/,
  /@rchunk\/subscription-update-dialog/,
  /export \{ ur as PricingPlanPage \}/,
]);
console.log(`${assertions} release-faithful pricing plan page assertions passed`);
