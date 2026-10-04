export type AnnotationSummaryCounts = {
  annotationCount: number;
  commentCount: number;
  designTweakCount?: number;
};

export type AnnotationSummaryMessages = {
  annotationCount: unknown;
  commentCount: unknown;
  mixedSummary: unknown;
};

export type AnnotationSummaryFormatter = {
  formatMessage: (message: unknown, values?: Record<string, unknown>) => string;
};

/** Formats the attachment summary without depending on renderer lifecycle state. */
export function formatAnnotationSummary(
  formatter: AnnotationSummaryFormatter,
  { annotationCount, commentCount, designTweakCount = 0 }: AnnotationSummaryCounts,
  messages: AnnotationSummaryMessages,
  formatCount: (formatter: AnnotationSummaryFormatter, message: unknown, count: number, kind: "annotation" | "comment") => string,
): string {
  const annotations = annotationCount + designTweakCount;
  if (annotations > 0 && commentCount > 0) {
    return formatter.formatMessage(messages.mixedSummary, {
      annotations: formatCount(formatter, messages.annotationCount, annotations, "annotation"),
      comments: formatCount(formatter, messages.commentCount, commentCount, "comment"),
    });
  }
  if (annotations > 0) return formatCount(formatter, messages.annotationCount, annotations, "annotation");
  if (commentCount > 0) return formatCount(formatter, messages.commentCount, commentCount, "comment");
  return "";
}
