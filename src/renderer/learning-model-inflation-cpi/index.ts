// Inflation/CPI comparison metadata. Release chunk: type-f80006839631.js.
import "@rchunk/rolldown-runtime";
type ComparisonInterval = "one_month" | "twelve_months";
interface Specification {
  type: "INFLATION_CPI";
  version: 2;
  thumbnailAssetKey: "inflation-cpi-v3";
  parameters: {
    earlier_cpi: { kind: "number"; defaultValue: 120; min: 50; max: 300 };
    later_cpi: { kind: "number"; defaultValue: 126; min: 50; max: 300 };
    comparison_interval: {
      kind: "enum";
      defaultValue: ComparisonInterval;
      allowedValues: ComparisonInterval[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "INFLATION_CPI",
    version: 2,
    thumbnailAssetKey: "inflation-cpi-v3",
    parameters: {
      earlier_cpi: { kind: "number", defaultValue: 120, min: 50, max: 300 },
      later_cpi: { kind: "number", defaultValue: 126, min: 50, max: 300 },
      comparison_interval: {
        kind: "enum",
        defaultValue: "twelve_months",
        allowedValues: ["one_month", "twelve_months"],
      },
    },
  };
}
export { specification as n, initialize as t };
