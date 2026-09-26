// primary-composer-at-mention-list —— 主 composer 的 @ mention 聚合列表与 Sites 曝光判定。
// 原版：app/webview/assets/primary-composer-at-mention-list-9532ce06fc83.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export interface MentionItem {
  key: string;
  searchTerms?: string[] | null;
  [key: string]: unknown;
}

export interface MentionSection {
  id?: string;
  items: MentionItem[];
  [key: string]: unknown;
}

export interface PrimaryComposerAtMentionListProps {
  source?: unknown;
  sourceKind?: "specialized" | "primary";
  className?: string;
  chromeVariant?: string;
  isHomeMenu?: boolean;
  placement?: string;
  query?: string;
  leadingItems?: MentionItem[];
  sections?: MentionSection[];
  typedSitesMentionPosition?: number | null;
  onSitesSuggestionsLoaded?(): void;
  onAddContext?(context: unknown): void;
  onRequestClose?(): void;
  onUpdateSelectedMention?(mention: unknown): void;
  [key: string]: unknown;
}

function isSitesMentionItem(item: MentionItem): boolean {
  return item.key.startsWith("site:") ||
    item.key === "plugin:plugin://sites" ||
    (item.key.startsWith("app:") && item.searchTerms?.some((term) => term.trim().toLowerCase() === "sites") === true);
}

function PrimaryComposerAtMentionList(props: PrimaryComposerAtMentionListProps) {
  if (props.sourceKind === "specialized") {
    return {
      kind: "specialized-composer-at-mention-list" as const,
      source: props.source,
      props,
    };
  }

  const sections = props.sections ?? [];
  const hasSitesSuggestions = sections.some((section) => section.items.some(isSitesMentionItem));
  if (hasSitesSuggestions && props.typedSitesMentionPosition != null) props.onSitesSuggestionsLoaded?.();

  return {
    kind: "primary-composer-at-mention-list" as const,
    className: props.className,
    chromeVariant: props.chromeVariant ?? "default",
    isHomeMenu: props.isHomeMenu === true,
    placement: props.placement ?? "top",
    query: props.query ?? "",
    sections,
    hasSitesSuggestions,
    onAddContext: props.onAddContext,
    onRequestClose: props.onRequestClose,
    onUpdateSelectedMention: props.onUpdateSelectedMention,
  };
}

export { PrimaryComposerAtMentionList };
