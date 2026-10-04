import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createGitHubPullRequestSummaryHandler } = require('../app/.vite/build/worker/github-pull-request-summary.js');

let calls = 0;
const handler = createGitHubPullRequestSummaryHandler({
  runGraphql: async () => { calls++; return { stdout: JSON.stringify({ data: { viewer: { login: 'me' }, p0: { pullRequest: null } } }) }; },
  parseResponse: JSON.parse,
  normalizeChecks: (x) => x,
  summarizeChecks: () => ({ checks: [], ciStatus: 'none' }),
  canMerge: () => false,
  mergeBlocker: () => null,
  parseRemoteUrl: () => null,
  warn: () => {},
  setTimeout: (fn) => { fn(); return 0; },
});
const account = { login: 'me', hostname: 'github.com' };
const host = { id: 'h', hostname: 'github.com' };
const request = { account, pullRequest: { owner: 'o', repository: 'r', number: 1 } };
const result = await handler(request, host);
assert.deepEqual(result, { status: 'not-found' });
assert.equal(calls, 1);
console.log('github pull request summary tests passed (2 assertions)');
