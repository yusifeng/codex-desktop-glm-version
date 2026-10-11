type StableMetadataFailureInput = {
  isPermissionError: boolean;
  isProcessTimeout: boolean;
  isGitUnavailable: boolean;
  generationMatches: boolean;
  hasCachedRoot: boolean;
};

function classifyStableMetadataFailure(input: StableMetadataFailureInput) {
  const accepted = input.isPermissionError || input.isProcessTimeout || input.isGitUnavailable;
  if (!accepted) {
    return { accepted: false, refreshHostConfig: false, retry: false, invalidateCachedRoot: false };
  }
  return {
    accepted: true,
    refreshHostConfig: input.generationMatches && input.isGitUnavailable,
    retry: input.generationMatches,
    invalidateCachedRoot: input.generationMatches && (!input.isProcessTimeout || !input.hasCachedRoot),
  };
}

export { classifyStableMetadataFailure };
if (typeof module !== `undefined`) module.exports = { classifyStableMetadataFailure };
