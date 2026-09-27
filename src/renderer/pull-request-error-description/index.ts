import {
  $3 as reactCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeMessageRuntime,
  Y2 as FormattedMessage,
} from "@rchunk/app-shared";

void reactCompilerRuntime;

export interface PullRequestErrorDescriptionProps {
  account: { login: string };
  error: string;
}

const repositoryAccessError =
  /Could not resolve to a Repository with the name '(?<repository>[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)'/u;

function PullRequestErrorDescription({
  account,
  error,
}: PullRequestErrorDescriptionProps): unknown {
  const { Fragment, jsx } = getJsxRuntime();
  const repository = repositoryAccessError.exec(error)?.groups?.repository;
  if (repository == null) return jsx(Fragment, { children: error });
  return jsx(FormattedMessage, {
    id: "codex.pullRequests.repositoryAccessError",
    defaultMessage:
      "GitHub account {login} can’t access {repository}. Switch accounts or request access, then try again.",
    description:
      "Actionable error shown when the active GitHub CLI account cannot access a repository",
    values: { login: account.login, repository },
  });
}

function initializePullRequestErrorDescription(): void {
  initializeMessageRuntime();
  getJsxRuntime();
}

export {
  initializePullRequestErrorDescription as n,
  PullRequestErrorDescription as t,
};
