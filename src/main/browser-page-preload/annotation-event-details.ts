type AnnotationRangeDetailInput = {
  startPath: number[];
  endPath: number[];
  startOffset: number;
  endOffset: number;
  rangeText: string;
};

type AnnotationOpenRequestDetailInput = {
  mode: string;
  enterAnnotationMode: boolean;
  metadata?: Record<string, unknown>;
  initialComment?: string;
  range?: Record<string, unknown>;
};

function createAnnotationRangeDetail(input: AnnotationRangeDetailInput): Record<string, unknown> {
  return {
    startPath: input.startPath,
    endPath: input.endPath,
    startOffset: input.startOffset,
    endOffset: input.endOffset,
    rangeText: input.rangeText,
  };
}

function createAnnotationOpenRequestDetail(input: AnnotationOpenRequestDetailInput): Record<string, unknown> {
  return {
    mode: input.mode,
    enterAnnotationMode: input.enterAnnotationMode,
    metadata: input.metadata,
    initialComment: input.initialComment,
    range: input.range,
  };
}

function readAnnotationEventDetail(event: unknown): Record<string, unknown> | undefined {
  if (typeof CustomEvent !== `undefined` && !(event instanceof CustomEvent)) return undefined;
  const detail = (event as { detail?: unknown } | null)?.detail;
  return typeof detail === `object` && detail !== null ? detail as Record<string, unknown> : undefined;
}

function readAnnotationEventField(detail: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(detail, key);
  return descriptor != null && `value` in descriptor ? descriptor.value : undefined;
}

export {
  createAnnotationOpenRequestDetail,
  createAnnotationRangeDetail,
  readAnnotationEventDetail,
  readAnnotationEventField,
};
if (typeof module !== `undefined`) module.exports = {
  createAnnotationOpenRequestDetail,
  createAnnotationRangeDetail,
  readAnnotationEventDetail,
  readAnnotationEventField,
};
