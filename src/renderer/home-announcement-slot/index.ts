// home-announcement-slot —— Home 页公告候选的稳定选择与上下文声明。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;

const {
  HNt: surfaceClaims,
  JNt: initializeHomeAnnouncementContext,
} = appInitialChunk;
const {
  Ah: initializeSurfaceClaim,
  kh: SurfaceClaim,
} = appPrimaryChunk;
const { I3: getJsxRuntime, e6: getReactRuntime } = appSharedChunk;

interface AnnouncementEntry {
  content?: unknown;
  isEligible: boolean;
  isLoading: boolean;
  pageContextClaim?: unknown;
}

let reactRuntime: ReactRuntime | null = null;
let jsxRuntime: JsxRuntime | null = null;

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
  const { React, jsx } = getInitializedAnnouncementRuntime();
  const selectedRef = React.useRef<number | null | undefined>(undefined);
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
  let content =
    entry.pageContextClaim == null
      ? entry.content
      : jsx.jsx(SurfaceClaim, {
          claim: entry.pageContextClaim,
          children: entry.content,
        });
  if (trackVisibility) {
    content = jsx.jsx(SurfaceClaim, {
      claim: surfaceClaims.HomeAnnouncement,
      children: content,
    });
  }
  return content;
}

function initializeHomeAnnouncementSlot(): void {
  if (reactRuntime != null && jsxRuntime != null) return;
  reactRuntime =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  initializeSurfaceClaim();
  initializeHomeAnnouncementContext();
  jsxRuntime =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

function getInitializedAnnouncementRuntime(): {
  React: ReactRuntime;
  jsx: JsxRuntime;
} {
  initializeHomeAnnouncementSlot();
  if (reactRuntime == null || jsxRuntime == null) {
    throw new Error("Home announcement slot runtime failed to initialize");
  }
  return { React: reactRuntime, jsx: jsxRuntime };
}

export { initializeHomeAnnouncementSlot as n, HomeAnnouncementSlot as t };
