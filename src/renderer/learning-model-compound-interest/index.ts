// Compound-interest mode and input metadata. Release chunk: type-1a3e6eca2001.js.
import "@rchunk/rolldown-runtime";
type Mode = "lump_sum" | "annuity_fv" | "annuity_pv" | "continuous";
interface Specification {
  type: "COMPOUND_INTEREST";
  version: 5;
  thumbnailAssetKey: "compound-interest-v1";
  parameters: {
    mode: { kind: "enum"; defaultValue: Mode; allowedValues: Mode[] };
    amount: { kind: "number"; defaultValue: 1000; min: 0.01; max: 1000000000 };
    ratePercent: { kind: "number"; defaultValue: 5; min: 0; max: 100 };
    periods: { kind: "number"; defaultValue: 20; min: 0; max: 1000 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "COMPOUND_INTEREST",
    version: 5,
    thumbnailAssetKey: "compound-interest-v1",
    parameters: {
      mode: {
        kind: "enum",
        defaultValue: "lump_sum",
        allowedValues: ["lump_sum", "annuity_fv", "annuity_pv", "continuous"],
      },
      amount: {
        kind: "number",
        defaultValue: 1000,
        min: 0.01,
        max: 1000000000,
      },
      ratePercent: { kind: "number", defaultValue: 5, min: 0, max: 100 },
      periods: { kind: "number", defaultValue: 20, min: 0, max: 1000 },
    },
  };
}
export { specification as n, initialize as t };
