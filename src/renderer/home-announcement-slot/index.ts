// home-announcement-slot —— Home 页公告候选的稳定选择与上下文声明。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

interface AnnouncementEntry {
  content?: unknown;
  isEligible: boolean;
  isLoading: boolean;
  pageContextClaim?: unknown;
}

interface ReactRuntime {
  useRef<T>(value: T): { current: T };
}

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}

let React: ReactRuntime | null = null;
let jsx: JsxRuntime | null = null;

function firstStableEntry(
  entries: AnnouncementEntry[],
): number | null | undefined {
  for (const [index, entry] of entries.entries()) {
    if (entry.isEligible) return index;
    if (entry.isLoading) return undefined;
  }
  return null;
}

function HomeAnnouncementSlot({
  entries,
  trackVisibility = true,
}: {
  entries: AnnouncementEntry[];
  trackVisibility?: boolean;
}): unknown {
  initializeHomeAnnouncementSlot();
  const selectedRef = (React as ReactRuntime).useRef<number | null | undefined>(
    undefined,
  );
  let selected = selectedRef.current;
  if (selected === undefined) {
    const candidate = firstStableEntry(entries);
    if (candidate !== undefined) {
      selectedRef.current = candidate;
      selected = candidate;
    }
  }
  if (selected == null) return null;
  const entry = entries[selected];
  if (
    entry == null ||
    entry.isLoading ||
    !entry.isEligible ||
    entry.content == null
  ) {
    return null;
  }
  const renderer = jsx as JsxRuntime;
  const Claim = appPrimary.kh;
  let content =
    entry.pageContextClaim == null || Claim == null
      ? entry.content
      : renderer.jsx(Claim, {
          claim: entry.pageContextClaim,
          children: entry.content,
        });
  if (trackVisibility && Claim != null) {
    content = renderer.jsx(Claim, {
      claim: appInitial.HNt?.HomeAnnouncement,
      children: content,
    });
  }
  return content;
}

function initializeHomeAnnouncementSlot(): void {
  appPrimary.Ah?.();
  appInitial.JNt?.();
  React ??= typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  jsx ??= typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

export { initializeHomeAnnouncementSlot as n, HomeAnnouncementSlot as t };
