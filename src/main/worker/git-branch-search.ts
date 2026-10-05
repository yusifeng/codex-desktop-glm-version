// Compatibility facade for branch-search policy exports.
export {
  buildGitBranchSearchRefPatterns,
  gitBranchNameFromRef,
  normalizeGitBranchSearchText,
  parseGitBranchSearchRef,
  stripGitRemoteRefPrefix,
} from "./git-branch-search-policy";

if (typeof module !== `undefined`) module.exports = require(`./git-branch-search-policy`);
