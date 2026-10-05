/** Runtime compatibility entry used by the bundled worker. */
export { getGitPerformanceRepoIndexSizeBucket } from "./git-watch-index-bucket-policy";
if (typeof module !== "undefined") module.exports = require("./git-watch-index-bucket-policy");
