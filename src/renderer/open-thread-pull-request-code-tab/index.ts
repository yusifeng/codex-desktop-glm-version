import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/pull-request-revision-tab";
import "@rchunk/registered-pull-request-thumbnail";
interface PullRequestRequest { account: { hostId: string }; pullRequest: { hostname: string; owner: string; repository: string; number: number }; [key: string]: unknown }
interface TabStore { get?(key: unknown): unknown; openTab?(tab: Record<string, unknown>): void; focusPanel?(placement: string): void }
function openThreadPullRequestCodeTab(store: TabStore, request: PullRequestRequest, title?: string, reset = false, placement = "right") { const pullRequest = { ...request.pullRequest, owner: request.pullRequest.owner.toLowerCase(), repository: request.pullRequest.repository.toLowerCase() }; const id = `pull-request-code:${encodeURIComponent(request.account.hostId)}|${pullRequest.hostname}/${pullRequest.owner}/${pullRequest.repository}#${pullRequest.number}`; const tab = { id, kind: "pull-request-code", props: { request: { account: request.account, pullRequest } }, title: title?.trim() || `PR #${pullRequest.number}`, target: placement, reset }; store.openTab?.(tab); store.focusPanel?.(placement); return { tabId: id, placement, status: "opened" as const }; }
function initializePullRequestCodeTab(): void {}
export { openThreadPullRequestCodeTab as n, initializePullRequestCodeTab as t };
