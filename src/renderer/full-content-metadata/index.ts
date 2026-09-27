import {
  Q3 as rendererLogger,
  Z3 as initializeQueryRuntime,
} from "@rchunk/app-shared";

export interface DiffContentBlock {
  additionLineIndex: number;
  additions: number;
  deletionLineIndex: number;
  deletions: number;
  lines: number;
  type: "addition" | "context" | "deletion" | string;
  [key: string]: unknown;
}

export interface DiffHunk {
  additionCount: number;
  additionStart: number;
  deletionCount: number;
  deletionStart: number;
  hunkContent: DiffContentBlock[];
  splitLineCount: number;
  unifiedLineCount: number;
  [key: string]: unknown;
}

export interface PartialDiffMetadata {
  additionLines: string[];
  cacheKey?: string | null;
  deletionLines: string[];
  hunks: DiffHunk[];
  name: string;
  newObjectId?: string | null;
  prevObjectId?: string | null;
  [key: string]: unknown;
}

export interface FullDiffMetadata extends PartialDiffMetadata {
  isPartial: false;
  splitLineCount: number;
  unifiedLineCount: number;
}

const whitespacePattern = /[ \t\r\n\f\v]/g;

function emptyFullContentResult(): { lines: never[]; type: "success" } {
  return { type: "success", lines: [] };
}

function linesMatch(left: string, right: string, ignoreWhitespace: boolean): boolean {
  return ignoreWhitespace
    ? left.replace(whitespacePattern, "") === right.replace(whitespacePattern, "")
    : left === right;
}

function rangesMatch(
  left: readonly string[],
  right: readonly string[],
  leftStart: number,
  rightStart: number,
  count: number,
  ignoreWhitespace: boolean,
): boolean {
  for (let offset = 0; offset < count; offset += 1) {
    const leftLine = left[leftStart + offset];
    const rightLine = right[rightStart + offset];
    if (
      leftLine == null ||
      rightLine == null ||
      !linesMatch(leftLine, rightLine, ignoreWhitespace)
    ) {
      return false;
    }
  }
  return true;
}

function rejectMetadata(metadata: PartialDiffMetadata, reason: string): null {
  rendererLogger.warning("code_diff_full_content_metadata_rejected", {
    safe: { reason },
    sensitive: { fileName: metadata.name },
  });
  return null;
}

function rebuildHunks(
  metadata: PartialDiffMetadata,
  deletionLines: string[],
  additionLines: string[],
  ignoreWhitespace: boolean,
): Pick<FullDiffMetadata, "hunks" | "splitLineCount" | "unifiedLineCount"> | null {
  const rebuiltHunks: DiffHunk[] = [];
  let splitLineCount = 0;
  let unifiedLineCount = 0;
  let previousAdditionEnd = 0;
  let previousDeletionEnd = 0;

  for (const hunk of metadata.hunks) {
    const additionStart = Math.max(hunk.additionStart - 1, 0);
    const deletionStart = Math.max(hunk.deletionStart - 1, 0);
    const collapsedAdditionCount = additionStart - previousAdditionEnd;
    const collapsedDeletionCount = deletionStart - previousDeletionEnd;
    if (
      collapsedAdditionCount < 0 ||
      collapsedDeletionCount < 0 ||
      collapsedAdditionCount !== collapsedDeletionCount ||
      additionStart + hunk.additionCount > additionLines.length ||
      deletionStart + hunk.deletionCount > deletionLines.length
    ) {
      return null;
    }
    if (
      !rangesMatch(
        deletionLines,
        additionLines,
        previousDeletionEnd,
        previousAdditionEnd,
        collapsedAdditionCount,
        ignoreWhitespace,
      )
    ) {
      return rejectMetadata(metadata, "collapsed_context_mismatch");
    }

    let additionCursor = additionStart;
    let deletionCursor = deletionStart;
    const hunkContent: DiffContentBlock[] = [];
    for (const block of hunk.hunkContent) {
      const additions = block.type === "context" ? block.lines : block.additions;
      const deletions = block.type === "context" ? block.lines : block.deletions;
      if (
        !rangesMatch(
          metadata.deletionLines,
          deletionLines,
          block.deletionLineIndex,
          deletionCursor,
          deletions,
          ignoreWhitespace,
        ) ||
        !rangesMatch(
          metadata.additionLines,
          additionLines,
          block.additionLineIndex,
          additionCursor,
          additions,
          ignoreWhitespace,
        )
      ) {
        return null;
      }
      hunkContent.push({
        ...block,
        additionLineIndex: additionCursor,
        deletionLineIndex: deletionCursor,
      });
      additionCursor += additions;
      deletionCursor += deletions;
    }
    rebuiltHunks.push({
      ...hunk,
      collapsedBefore: collapsedAdditionCount,
      additionLineIndex: additionStart,
      deletionLineIndex: deletionStart,
      hunkContent,
      splitLineStart: splitLineCount + collapsedAdditionCount,
      unifiedLineStart: unifiedLineCount + collapsedAdditionCount,
    });
    splitLineCount += collapsedAdditionCount + hunk.splitLineCount;
    unifiedLineCount += collapsedAdditionCount + hunk.unifiedLineCount;
    previousAdditionEnd = additionStart + hunk.additionCount;
    previousDeletionEnd = deletionStart + hunk.deletionCount;
  }

  if (rebuiltHunks.length > 0) {
    const trailingAdditions = additionLines.length - previousAdditionEnd;
    const trailingDeletions = deletionLines.length - previousDeletionEnd;
    if (trailingAdditions < 0 || trailingDeletions < 0) {
      return rejectMetadata(metadata, "negative_trailing_context");
    }
    if (trailingAdditions !== trailingDeletions) {
      return rejectMetadata(metadata, "trailing_context_line_count_mismatch");
    }
    if (
      !rangesMatch(
        deletionLines,
        additionLines,
        previousDeletionEnd,
        previousAdditionEnd,
        trailingAdditions,
        ignoreWhitespace,
      )
    ) {
      return rejectMetadata(metadata, "trailing_context_mismatch");
    }
    splitLineCount += trailingAdditions;
    unifiedLineCount += trailingAdditions;
  }

  return { hunks: rebuiltHunks, splitLineCount, unifiedLineCount };
}

function createFullContentMetadata(
  metadata: PartialDiffMetadata,
  deletionLines: string[],
  additionLines: string[],
  options: { ignoreWhitespace?: boolean } = {},
): FullDiffMetadata | null {
  const rebuilt = rebuildHunks(
    metadata,
    deletionLines,
    additionLines,
    options.ignoreWhitespace ?? false,
  );
  if (rebuilt == null) return null;
  return {
    ...metadata,
    ...rebuilt,
    isPartial: false,
    deletionLines,
    additionLines,
    cacheKey: `${metadata.cacheKey ?? metadata.name}:full:${metadata.prevObjectId ?? "none"}:${metadata.newObjectId ?? "none"}`,
  };
}

function initializeFullContentMetadata(): void {
  initializeQueryRuntime();
}

export {
  emptyFullContentResult as n,
  initializeFullContentMetadata as r,
  createFullContentMetadata as t,
};
