function hasAnnotationComments<T>(comments: readonly T[]): boolean { return comments.length > 0; }
function getAnnotationCommentCount<T>(comments: readonly T[]): number { return comments.length; }
export { hasAnnotationComments, getAnnotationCommentCount };
if (typeof module !== `undefined`) module.exports = { hasAnnotationComments, getAnnotationCommentCount };
