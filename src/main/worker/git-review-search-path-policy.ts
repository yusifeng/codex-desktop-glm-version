function formatReviewSearchPath(change: { oldPath: string; newPath: string }): string { return change.oldPath === change.newPath ? change.newPath : `${change.oldPath} -> ${change.newPath}`; }
export { formatReviewSearchPath };
if (typeof module !== `undefined`) module.exports = { formatReviewSearchPath };
