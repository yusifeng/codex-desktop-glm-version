import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
} from "@rchunk/app-shared";
import {
  h_t as threadEmojiById,
  m_t as initializeThreadEmojiState,
} from "@rchunk/app-initial";

export interface ThreadEmojiProps {
  threadId: string;
}

function ThreadEmoji({ threadId }: ThreadEmojiProps): unknown {
  const emoji = useSignalFamilyValue(threadEmojiById, threadId);
  if (emoji == null) return null;
  return getJsxRuntime().jsxs("span", {
    className: "shrink-0 select-none",
    children: [emoji, " "],
  });
}

function initializeThreadEmoji(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  initializeThreadEmojiState();
  getJsxRuntime();
}

export { initializeThreadEmoji as n, ThreadEmoji as t };
