export interface CommentAttachmentGroups<T> {
  annotationCommentAttachments: T[];
  designTweakCommentAttachments: T[];
  diffCommentAttachments: T[];
}

/** Partition attachments by the three comment-surface categories. */
export function partitionCommentAttachments<T>(
  attachments: readonly T[],
  isDesignTweak: (attachment: T) => boolean,
  isAnnotation: (attachment: T) => boolean,
  isDiff: (attachment: T) => boolean,
): CommentAttachmentGroups<T> {
  const annotationCommentAttachments: T[] = [];
  const designTweakCommentAttachments: T[] = [];
  const diffCommentAttachments: T[] = [];
  for (const attachment of attachments) {
    if (isDesignTweak(attachment)) designTweakCommentAttachments.push(attachment);
    else if (isAnnotation(attachment) || isDiff(attachment)) annotationCommentAttachments.push(attachment);
    else diffCommentAttachments.push(attachment);
  }
  return { annotationCommentAttachments, designTweakCommentAttachments, diffCommentAttachments };
}
