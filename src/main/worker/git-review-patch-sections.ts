type ReviewPatchSectionDependencies = {
  maxBytes?: number;
  maxConcurrency?: number;
};

import {
  collectNonEmptySections,
  defaultMaxBytes,
  defaultMaxConcurrency,
  resolvePatchSectionLimits,
} from './git-review-patch-sections-policy';

async function collectUntrackedDiffSections(
  readDiff: (path: string, signal: AbortSignal) => Promise<any>,
  untrackedPaths: { success: boolean; paths?: string[] },
  signal: AbortSignal,
  dependencies: ReviewPatchSectionDependencies = {},
) {
  if (!untrackedPaths.success) return { success: false, error: { type: `unknown` } };

  const paths = untrackedPaths.paths ?? [];
  const { maxBytes, maxConcurrency } = resolvePatchSectionLimits(dependencies);
  const sections: string[] = [];
  const pending = Array<string | null | undefined>(paths.length).fill(undefined);
  let nextPathIndex = 0;
  let nextSectionIndex = 0;
  let stopped = false;
  let error: any = null;
  let totalBytes = 0;

  const stop = (reason: any) => {
    if (!stopped) {
      stopped = true;
      error = reason;
    }
  };
  const flushCompletedSections = () => {
    if (stopped) return;
    while (nextSectionIndex < pending.length) {
      const section = pending[nextSectionIndex];
      if (section === undefined) return;
      nextSectionIndex += 1;
      if (section != null && section.trim().length > 0) sections.push(section);
    }
  };
  const takeNextPath = () => {
    if (stopped || nextPathIndex >= paths.length) return null;
    const index = nextPathIndex;
    nextPathIndex += 1;
    return { index, path: paths[index] };
  };
  const worker = async (): Promise<void> => {
    if (stopped) return;
    const next = takeNextPath();
    if (next == null) return;
    const result = await readDiff(next.path, signal);
    if (result.type === `error`) {
      stop(result.error);
      return;
    }
    const resultBytes = result.unifiedDiffBytes ?? result.unifiedDiff.length;
    if (totalBytes + resultBytes > maxBytes) {
      stop({ type: `diff-too-large`, limitBytes: maxBytes });
      return;
    }
    totalBytes += resultBytes;
    pending[next.index] = result.unifiedDiff.trim().length > 0 ? result.unifiedDiff : null;
    flushCompletedSections();
    await worker();
  };

  await Promise.all(
    Array.from({ length: Math.min(maxConcurrency, paths.length) }, () => worker()),
  );
  return error == null ? { success: true, sections } : { success: false, error };
}

export {
  collectNonEmptySections,
  collectUntrackedDiffSections,
  defaultMaxBytes,
  defaultMaxConcurrency,
};
if (typeof module !== `undefined`)
  module.exports = {
    collectNonEmptySections,
    collectUntrackedDiffSections,
    defaultMaxBytes,
    defaultMaxConcurrency,
  };
