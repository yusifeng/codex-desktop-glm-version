type GitRequestAdmissionDependencies = {
  requestId: string;
  tracked: boolean;
  signal: AbortSignal;
  beginRequest: (id: string, tracked: boolean, signal: AbortSignal) => string;
  emitCancellation: (input: any) => void;
  cancellationInput: any;
  operation: any;
  recordOutcome: (outcome: string) => void;
};

/** Admits a Git request or completes the pre-canceled request lifecycle. */
function admitGitRequest(dependencies: GitRequestAdmissionDependencies): boolean {
  const { requestId, tracked, signal, beginRequest, emitCancellation, cancellationInput, operation, recordOutcome } = dependencies;
  if (beginRequest(requestId, tracked, signal) !== `canceled`) return true;
  emitCancellation(cancellationInput);
  if (operation == null) recordOutcome(`canceled`);
  return false;
}

export { admitGitRequest };
if (typeof module !== `undefined`) module.exports = { admitGitRequest };
