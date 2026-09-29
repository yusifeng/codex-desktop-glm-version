import * as appInitialChunk from "@rchunk/app-initial";

const threadRuntime = appInitialChunk as unknown as {
  Cyt: unknown;
  Dyt: unknown;
  Eyt: unknown;
  Syt: unknown;
  Tyt: unknown;
  byt(): void;
  wyt: unknown;
  xyt: unknown;
  yyt: unknown;
};

const {
  Cyt: fileGitHostConfigByHostId$,
  Dyt: threadHostId$,
  Eyt: threadHostConfig$,
  Syt: threadCwd$,
  Tyt: threadGitHostKey$,
  byt: initializeThreadContext,
  wyt: threadGitHostConfig$,
  xyt: threadCodexHome$,
  yyt: threadExecutorTarget$,
} = threadRuntime;

initializeThreadContext();

export {
  fileGitHostConfigByHostId$,
  threadCodexHome$,
  threadCwd$,
  threadExecutorTarget$,
  threadGitHostConfig$,
  threadGitHostKey$,
  threadHostConfig$,
  threadHostId$,
};
