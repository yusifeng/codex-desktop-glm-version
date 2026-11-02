// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { TT as t } from "@rchunk/app-initial";
function n({ planType: e, initialPlanType: t, updatedPlanType: n }) {
  let r = (t === `pro` || t === `prolite`) && (n === `pro` || n === `prolite`);
  return e === `pro`
    ? r
      ? `Pro 20x`
      : `Pro`
    : e === `prolite`
      ? r
        ? `Pro 5x`
        : `Pro`
      : e === `plus`
        ? `Plus`
        : e === `go`
          ? `Go`
          : null;
}
var r;
function i() {
  return (i = e(() => {
    r = t({
      free: { id: `pricingPlanConstants.free.name`, defaultMessage: `Free` },
      plus: { id: `pricingPlanConstants.plus.name`, defaultMessage: `Plus` },
      go: { id: `pricingPlanConstants.go.name`, defaultMessage: `Go` },
      team: { id: `pricingPlanConstants.teams.teamPlanName`, defaultMessage: `Business` },
      pro: { id: `pricingPlanConstants.pro.name`, defaultMessage: `Pro` },
    });
  }))();
}
export { n, i as r, r as t };
