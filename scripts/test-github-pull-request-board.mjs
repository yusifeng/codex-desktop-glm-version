import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildPullRequestListArgs, resolveRepositoryCandidates, getBoardState, mapPullRequestBoardItems } = require('../app/.vite/build/worker/github-pull-request-board.js');

assert.deepEqual(buildPullRequestListArgs({ searchQuery: null, state: 'open' }).slice(-2), ['--author', '@me']);
assert.deepEqual(buildPullRequestListArgs({ searchQuery: ' bug ', repoArg: 'o/r' }).slice(-4), ['--search', 'bug', '--repo', 'o/r']);
assert.deepEqual(resolveRepositoryCandidates({ originUrl: 'https://github.com/o/r.git', upstreamUrl: 'git@github.example:o/r.git', parseRemoteUrl: (url) => url.includes('example') ? { host: 'github.example', owner: 'o', repo: 'r' } : { host: 'github.com', owner: 'o', repo: 'r' } }), ['github.example/o/r', 'o/r']);
assert.equal(getBoardState({ canMerge: true, ciStatus: 'passing', isDraft: false }), 'ready');
assert.equal(getBoardState({ canMerge: false, ciStatus: 'none', isDraft: true }), 'draft');
const items = mapPullRequestBoardItems({ cwd: '/repo', hostId: 'h', repo: 'o/r', searchQuery: null, normalizeChecks: (v) => v, summarizeChecks: () => ({ checks: [], ciStatus: 'passing' }), canMerge: () => true, mergeBlocker: () => null, items: [{ state: 'OPEN', number: 1, isDraft: false, mergeStateStatus: 'CLEAN', mergeable: 'MERGEABLE' }, { state: 'MERGED', number: 2 }] });
assert.deepEqual(items.map((item) => item.state), ['ready', 'merged']);
console.log('github pull request board tests passed (6 assertions)');
