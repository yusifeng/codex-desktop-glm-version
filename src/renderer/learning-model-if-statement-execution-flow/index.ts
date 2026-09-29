// If-statement execution-flow learning-model manifest. Release chunk: type-62569be7b3b6.js.
import "@rchunk/rolldown-runtime";

const ifStatementExecutionFlowSpecification = {
  type: "IF_STATEMENT_EXECUTION_FLOW",
  version: 1,
  thumbnailAssetKey: "if-statement-execution-flow-v1",
  parameters: {
    score: { kind: "integer" as const, defaultValue: 60, min: 0, max: 100 },
  },
};

function initializeIfStatementExecutionFlowSpecification(): void {}

export { ifStatementExecutionFlowSpecification as n, initializeIfStatementExecutionFlowSpecification as t };
