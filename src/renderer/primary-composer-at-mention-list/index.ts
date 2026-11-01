import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  Bk as appgenInteractionActions,
  Eu as initializeComposerEditorState,
  FX as initializeMaitai,
  Hk as appgenInteractionSources,
  I3 as getJsxRuntime,
  LX as getScopeApi,
  QI as initializeScope,
  ZI as appScope,
  e6 as getReactRuntime,
  wu as composerMentionState,
} from "@rchunk/app-shared";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";
import {
  HZ as useComposerEditor,
  Man as initializeComposerSearch,
  Nan as initializeAppgenAnalytics,
  Pan as logAppgenInteraction,
  UZ as useEditorSelector,
  VZ as initializeEditorSelector,
  jan as sitesPluginId,
} from "@rchunk/app-initial";
import {
  Al as initializeMentionRanking,
  Gl as isSpecializedMentionSource,
  Hl as mergeMentionSections,
  Sl as useThreadMentionSource,
  Ul as initializeMentionSources,
  Wl as initializeMentionList,
  bl as initializeMentionSearch,
  jl as useMentionSections,
  vl as SpecializedComposerAtMentionList,
  xl as initializeThreadMentionSource,
  yl as ComposerAtMentionList,
} from "@rchunk/app-primary";

interface MentionItem {
  key: string;
  searchTerms?: string[] | null;
  [key: string]: unknown;
}
interface MentionSection {
  items: MentionItem[];
  [key: string]: unknown;
}
interface MentionSectionsResult {
  sections: MentionSection[];
}
interface PrimaryComposerAtMentionListProps extends Record<string, unknown> {
  backgroundAgents?: unknown[];
  className?: string;
  chromeVariant?: string;
  excludedAgentConversationIds?: string[];
  excludedThreadReferences?: unknown[];
  fileSearchRootPaths?: string[];
  hostId?: string;
  isHomeMenu?: boolean;
  keyboardEventTarget?: unknown;
  leadingItems?: MentionItem[];
  onAddContext?(context: unknown): void;
  onRequestClose?(): void;
  onUpdateSelectedMention?(mention: unknown): void;
  placement?: string;
  pluginHostId?: string;
  query?: string;
  rankingContext?: unknown;
  selectedModel?: unknown;
  skillRoots?: string[];
  source?: unknown;
  threadSearchRoots?: string[];
  typedSitesMentionRef?: { current: number | null };
}

const once = onceExport as (initializer: () => void) => () => void;
let React: ReactRuntime;
let jsx: JsxRuntime;

function itemIsSitesMention({ key, searchTerms }: MentionItem): boolean {
  return (
    key.startsWith("site:") ||
    key === `plugin:plugin://${sitesPluginId}` ||
    (key.startsWith("app:") &&
      searchTerms?.some((term) => term.trim().toLowerCase() === "sites") ===
        true)
  );
}

function sectionHasSitesMention(section: MentionSection): boolean {
  return section.items.some(itemIsSitesMention);
}

function typedAtMentionPosition(editor: {
  view: { state: unknown };
}): number | null {
  const state = composerMentionState.getState(editor.view.state) as
    | {
        active?: boolean;
        activation?: string;
        kind?: string;
        range?: { from?: number };
        trigger?: string;
      }
    | undefined;
  return state?.active === true &&
    state.activation === "typed" &&
    state.kind === "at-mention" &&
    state.trigger === "@"
    ? (state.range?.from ?? null)
    : null;
}

function PrimaryMentionList({
  typedSitesMentionRef,
  ...props
}: PrimaryComposerAtMentionListProps): unknown {
  const {
    backgroundAgents = [],
    className,
    chromeVariant = "default",
    excludedAgentConversationIds = [],
    excludedThreadReferences = [],
    fileSearchRootPaths,
    hostId,
    isHomeMenu = false,
    keyboardEventTarget,
    leadingItems = [],
    onAddContext,
    onRequestClose,
    onUpdateSelectedMention,
    placement = "top",
    pluginHostId,
    query,
    rankingContext,
    selectedModel,
    skillRoots,
    threadSearchRoots,
  } = props;
  const scope = getScopeApi(appScope);
  const editor = useComposerEditor();
  const typedMentionPosition = (
    useEditorSelector as unknown as (
      value: unknown,
      selector: (value: { view: { state: unknown } }) => number | null,
    ) => number | null
  )(editor, typedAtMentionPosition);
  const lastReportedPosition = React.useRef<number | null>(null);
  const threadSource = (
    useThreadMentionSource as unknown as (
      input: Record<string, unknown>,
    ) => unknown
  )({
    excludedThreadReferences,
    hostId,
    query,
    roots: threadSearchRoots,
  });
  const sectionResult = (
    useMentionSections as unknown as (
      input: Record<string, unknown>,
    ) => MentionSectionsResult
  )({
    backgroundAgents,
    excludedAgentConversationIds,
    hostId,
    pluginHostId,
    query,
    roots: fileSearchRootPaths,
    selectedModel,
    skillRoots,
    threadSource,
  });
  const sections = (
    mergeMentionSections as unknown as (
      sections: MentionSection[],
      query: string | undefined,
      leading: MentionItem[],
      includeEmpty: boolean,
      rankingContext: unknown,
    ) => MentionSection[]
  )(sectionResult.sections, query, leadingItems, false, rankingContext);
  const hasSitesSuggestions = sections.some(sectionHasSitesMention);
  const reportSuggestionsLoaded = () => {
    (
      logAppgenInteraction as unknown as (
        scope: unknown,
        event: Record<string, unknown>,
      ) => void
    )(scope, {
      action:
        appgenInteractionActions.CODEX_APPGEN_INTERACTION_ACTION_MENTION_SUGGESTIONS_LOADED,
      source:
        appgenInteractionSources.CODEX_APPGEN_INTERACTION_SOURCE_AT_MENTION,
    });
  };
  const effectEvent =
    (
      React.useEffectEvent as undefined | ((callback: () => void) => () => void)
    )?.(reportSuggestionsLoaded) ?? reportSuggestionsLoaded;
  React.useEffect(() => {
    if (
      typedMentionPosition == null ||
      typedSitesMentionRef?.current !== typedMentionPosition
    ) {
      lastReportedPosition.current = null;
      return;
    }
    if (
      hasSitesSuggestions &&
      lastReportedPosition.current !== typedMentionPosition
    ) {
      lastReportedPosition.current = typedMentionPosition;
      effectEvent();
    }
  }, [hasSitesSuggestions, typedMentionPosition, typedSitesMentionRef]);
  return jsx.jsx(ComposerAtMentionList, {
    className,
    chromeVariant,
    isHomeMenu,
    keyboardEventTarget,
    onAddContext,
    onRequestClose,
    onUpdateSelectedMention,
    placement,
    query,
    sections,
  });
}

function PrimaryComposerAtMentionList({
  source,
  typedSitesMentionRef,
  ...props
}: PrimaryComposerAtMentionListProps): unknown {
  return (isSpecializedMentionSource as unknown as (value: unknown) => boolean)(
    source,
  )
    ? jsx.jsx(SpecializedComposerAtMentionList, { ...props, source })
    : jsx.jsx(PrimaryMentionList, { ...props, typedSitesMentionRef });
}

const initializePrimaryComposerAtMentionList = once(() => {
  initializeCompilerRuntime();
  initializeMaitai();
  React = getReactRuntime();
  initializeAppgenAnalytics();
  initializeMentionList();
  initializeComposerSearch();
  initializeScope();
  initializeMentionSearch();
  initializeMentionSources();
  initializeComposerEditorState();
  initializeEditorSelector();
  initializeMentionRanking();
  initializeThreadMentionSource();
  jsx = getJsxRuntime();
});

initializePrimaryComposerAtMentionList();

export { PrimaryComposerAtMentionList };
