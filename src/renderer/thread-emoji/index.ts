import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
} from "@rchunk/app-shared";
import {
  h_t as threadEmojiById,
  m_t as initializeThreadEmojiState,
} from "@rchunk/app-initial";

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;
let jsxRuntime: ReturnType<typeof getJsxRuntime>;

export interface ThreadEmojiProps {
  threadId: string;
}

function ThreadEmoji({ threadId }: ThreadEmojiProps): unknown {
  const cache = compilerRuntime.c(2);
  const emoji = useSignalFamilyValue(threadEmojiById, threadId);
  if (cache[0] !== emoji) {
    cache[0] = emoji;
    cache[1] =
      emoji == null
        ? null
        : jsxRuntime.jsxs("span", {
            className: "shrink-0 select-none",
            children: [emoji, " "],
          });
  }
  return cache[1];
}

function initializeThreadEmoji(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime();
  initializeThreadEmojiState();
  jsxRuntime = getJsxRuntime();
}

export { initializeThreadEmoji as n, ThreadEmoji as t };
