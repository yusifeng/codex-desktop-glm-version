import "@rchunk/rolldown-runtime";

type ConfusionCell = "fn" | "fp" | "tn" | "tp";
type CellRole = "denominator" | "numerator-and-denominator" | "unused";
type MetricName = "accuracy" | "f1" | "precision" | "recall" | "specificity";

interface ConfusionMatrix {
  fn: number;
  fp: number;
  tn: number;
  tp: number;
}

interface MetricResult {
  cellRoles: Record<ConfusionCell, CellRole>;
  denominator: number;
  numerator: number;
  symbolicDenominator: string;
  symbolicNumerator: string;
  value: number | null;
}

let computeBinaryClassificationMetric: (
  metric: MetricName,
  matrix: ConfusionMatrix,
) => MetricResult;

function safeRatio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function roles(
  numeratorCells: readonly ConfusionCell[],
  denominatorCells: readonly ConfusionCell[],
): Record<ConfusionCell, CellRole> {
  return Object.fromEntries(
    (["tp", "fp", "tn", "fn"] as const).map((cell) => [
      cell,
      numeratorCells.includes(cell)
        ? "numerator-and-denominator"
        : denominatorCells.includes(cell)
          ? "denominator"
          : "unused",
    ]),
  ) as Record<ConfusionCell, CellRole>;
}

function initializeBinaryClassificationMetrics(): void {
  computeBinaryClassificationMetric = (metric, matrix) => {
    if (metric === "accuracy") {
      const numerator = matrix.tp + matrix.tn;
      const denominator = numerator + matrix.fp + matrix.fn;
      return {
        numerator,
        denominator,
        value: safeRatio(numerator, denominator),
        symbolicNumerator: "TP + TN",
        symbolicDenominator: "TP + FP + FN + TN",
        cellRoles: roles(["tp", "tn"], ["tp", "fp", "tn", "fn"]),
      };
    }
    if (metric === "precision") {
      const numerator = matrix.tp;
      const denominator = matrix.tp + matrix.fp;
      return {
        numerator,
        denominator,
        value: safeRatio(numerator, denominator),
        symbolicNumerator: "TP",
        symbolicDenominator: "TP + FP",
        cellRoles: roles(["tp"], ["tp", "fp"]),
      };
    }
    if (metric === "recall") {
      const numerator = matrix.tp;
      const denominator = matrix.tp + matrix.fn;
      return {
        numerator,
        denominator,
        value: safeRatio(numerator, denominator),
        symbolicNumerator: "TP",
        symbolicDenominator: "TP + FN",
        cellRoles: roles(["tp"], ["tp", "fn"]),
      };
    }
    if (metric === "specificity") {
      const numerator = matrix.tn;
      const denominator = matrix.tn + matrix.fp;
      return {
        numerator,
        denominator,
        value: safeRatio(numerator, denominator),
        symbolicNumerator: "TN",
        symbolicDenominator: "TN + FP",
        cellRoles: roles(["tn"], ["tn", "fp"]),
      };
    }
    const numerator = 2 * matrix.tp;
    const denominator = numerator + matrix.fp + matrix.fn;
    return {
      numerator,
      denominator,
      value: safeRatio(numerator, denominator),
      symbolicNumerator: "2TP",
      symbolicDenominator: "2TP + FP + FN",
      cellRoles: roles(["tp"], ["tp", "fp", "fn"]),
    };
  };
}

export { initializeBinaryClassificationMetrics as n, computeBinaryClassificationMetric as t };
