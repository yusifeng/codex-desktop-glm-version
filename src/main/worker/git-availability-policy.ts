import { isCancelableGitRequest } from "./git-request-classification-policy";
function shouldCheckGitAvailability(method: string, isLocal: boolean, isMutation: boolean): boolean {
  return isLocal && !isMutation && isCancelableGitRequest(method);
}
export { shouldCheckGitAvailability };
if (typeof module !== `undefined`) module.exports = { shouldCheckGitAvailability };
