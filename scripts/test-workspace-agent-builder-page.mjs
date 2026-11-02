import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const assertions = assertReleaseOwner("workspace-agent-builder-page", [
  /@rchunk\/workspace-agent-detail-query/,
  /@rchunk\/builder-analytics/,
  /export \{ Dr as WorkspaceAgentBuilderPage \}/,
]);
console.log(`${assertions} release-faithful workspace agent builder assertions passed`);
