function reviewFileKey(path: string, previousPath: string | null | undefined) {
  return `${previousPath ?? ``}\0${path}`;
}

function gitStatusToReviewChangeKind(status: string) {
  return status === `A`
    ? `added`
    : status === `D`
      ? `deleted`
      : status === `R`
        ? `renamed`
        : status === `C`
          ? `copied`
          : status === `T`
            ? `type-changed`
            : status === `U`
              ? `unmerged`
              : `modified`;
}

export { gitStatusToReviewChangeKind, reviewFileKey };

if (typeof module !== `undefined`)
  module.exports = { gitStatusToReviewChangeKind, reviewFileKey };
