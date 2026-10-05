/** Pure policy for projecting checkout overwrite-conflict output. */

function parseCheckoutConflictPaths(output: string) {
  const lines = output.split(/\r?\n/);
  const header = /^(error:\s*)?.*\bwould be overwritten by checkout:\s*$/i;
  const conflictedPaths = new Set<string>();
  let collecting = false;
  let hasConflictHeader = false;
  for (const lineValue of lines) {
    const line = lineValue.replace(/\r$/, ``).trim();
    if (!collecting) {
      if (header.test(line)) {
        hasConflictHeader = true;
        collecting = true;
      }
      continue;
    }
    if (!line) continue;
    const lower = line.toLowerCase();
    if (lower.startsWith(`please `) || lower.startsWith(`error:`) || lower === `aborting`) break;
    conflictedPaths.add(line);
  }
  return { conflictedPaths: Array.from(conflictedPaths), hasConflictHeader };
}

function classifyCheckoutFailure(stdout: string, stderr: string) {
  const parsed = parseCheckoutConflictPaths([stderr, stdout].filter(Boolean).join(`\n`));
  return parsed.hasConflictHeader || parsed.conflictedPaths.length > 0
    ? { errorType: `blocked-by-working-tree-changes`, conflictedPaths: parsed.conflictedPaths }
    : { errorType: `unknown`, conflictedPaths: [] };
}

export { classifyCheckoutFailure, parseCheckoutConflictPaths };
if (typeof module !== `undefined`)
  module.exports = { classifyCheckoutFailure, parseCheckoutConflictPaths };
