import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import {
  HX as useSignalValue,
  I3 as getJsxRuntime,
  LX as useScope,
  _L as useQuery,
  sZ as createDerivedSignal,
  type MaitaiScopeApi,
} from "@rchunk/app-shared";
import {
  $9t as normalizeSuggestionPosition,
  HZ as useComposerEditor,
  PIt as pendingComposerEntries,
  RIt as initializeComposerSignals,
  UZ as observeComposerValue,
  VZ as initializeComposerEditor,
  b2 as setComposerSystemHints,
  cJt as initializeApiClient,
  kht as composerStateRoot,
  rJt as apiClient,
  v2 as activeConversationId,
  xIt as isSketchGenerationPending,
  xpn as trackProductEvent,
  yIt as composerAttachments,
  ypn as initializeComposerAttachments,
} from "@rchunk/app-initial";
import {
  Ia as sketchFollowupSelectedEvent,
  La as initializeSketchComposerState,
  au as initializeSketchAnalytics,
  ru as clearSketchComposerState,
} from "@rchunk/app-primary";
import {
  n as initializeHomeSuggestionSurface,
  t as HomeSuggestionSurface,
} from "@rchunk/home-suggestion-surface";

export interface SketchFollowupSuggestion {
  id: string;
  prompt_text: string;
  system_hints?: string[] | null;
  title: string;
}

interface ComposerAttachment {
  isBigPaste?: boolean;
  sketchId?: string | null;
  status?: string;
  uploadId?: string | null;
}

interface SuggestionItem {
  disabled: false;
  icon: unknown;
  id: string;
  label: string;
  onClick(): void;
}

interface SketchHomeSuggestionsProps {
  mode?: string;
}

const sharedInitializers = sharedChunk as unknown as Record<string, unknown>;
const initialInitializers = initialChunk as unknown as Record<string, unknown>;
let jsx: ReturnType<typeof getJsxRuntime>;
let readSignal: <T>(signal: unknown) => T;

function callInitializer(value: unknown): void {
  if (typeof value === "function") value();
}

function sample<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const selected: T[] = [];
  while (pool.length > 0 && selected.length < count) {
    selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return selected;
}

function selectSketchFollowupSuggestions(
  items: readonly SketchFollowupSuggestion[],
): SketchFollowupSuggestion[] {
  const valid = items.filter((item) => item.title.trim() && item.prompt_text.trim());
  const primary = valid.find((item) =>
    ["make_art", "make-it-art"].includes(item.id.replace(/,$/, "")),
  ) ?? valid[0];
  const animation = valid.find((item) => item.id === "animate_drawing");
  return primary == null
    ? []
    : [
        primary,
        ...sample(valid.filter((item) => item !== primary && item !== animation), 2),
        ...(animation != null && animation !== primary ? [animation] : []),
      ];
}

async function fetchSketchFollowups({
  signal,
}: {
  signal?: AbortSignal;
}): Promise<SketchFollowupSuggestion[]> {
  const response = await apiClient.safeGet("/images/prompt-items", {
    parameters: { query: { surface: "sketch_followups" } },
    signal,
  }) as { items?: SketchFollowupSuggestion[] | null };
  return selectSketchFollowupSuggestions(response.items ?? []);
}

initializeSketchComposerState();
initializeComposerSignals();
initializeComposerEditor();
initializeHomeSuggestionSurface();
initializeComposerAttachments();
initializeSketchAnalytics();
initializeApiClient();
for (const value of [
  initialInitializers.ren,
  sharedInitializers.et,
  sharedInitializers.Q,
  sharedInitializers.X,
  sharedInitializers.q,
  sharedInitializers.G,
  sharedInitializers.OT,
  sharedInitializers.U,
  sharedInitializers.gL,
  sharedInitializers.FX,
  initialInitializers.y2,
  sharedInitializers.C_,
  sharedInitializers.lw,
  initialInitializers.Rht,
]) callInitializer(value);
jsx = getJsxRuntime();
readSignal = useSignalValue as unknown as <T>(signal: unknown) => T;

const sketchUploadId = createDerivedSignal(
  composerStateRoot,
  ({ get }) => {
    const conversationId = get(activeConversationId as never) as unknown;
    const attachments = get(
      composerAttachments as never,
      conversationId,
    ) as unknown as ComposerAttachment[];
    const promptAttachments = attachments.filter((entry) => !entry.isBigPaste);
    const allSketchesReady = promptAttachments.every(
      (entry) => entry.sketchId != null && entry.status !== "error",
    );
    const generationPending = get(
      isSketchGenerationPending as never,
      conversationId,
    ) as unknown as boolean;
    const pendingEntries = get(
      pendingComposerEntries as never,
      conversationId,
    ) as unknown as unknown[];
    return allSketchesReady && !generationPending && pendingEntries.length === 0
      ? (promptAttachments.at(-1)?.uploadId ?? null)
      : null;
  },
);

function SketchSuggestionList({
  items,
  mode = "chat",
  onSelect,
}: {
  items: readonly SketchFollowupSuggestion[];
  mode?: string;
  onSelect(item: SketchFollowupSuggestion, index: number): void;
}): unknown {
  const iconFor = (id: string): unknown => {
    const key = id.replace(/,$/, "");
    if (key === "make_art" || key === "make-it-art") {
      return jsx.jsx(sharedInitializers.Lx, {});
    }
    if (key === "explore_logos" || key === "turn-it-into-a-logo") {
      return jsx.jsx(sharedInitializers.VS, {});
    }
    if (key === "make_it_realistic" || key === "make-it-realistic") {
      return jsx.jsx(sharedInitializers.Rx, {});
    }
    const asset = ({
      solve_problem: sharedInitializers.Z,
      "solve-this-problem": sharedInitializers.Z,
      roast_drawing: sharedInitializers.K,
      "critique-my-drawing": sharedInitializers.K,
      finish_drawing: sharedInitializers.kT,
      "finish-the-drawing": sharedInitializers.kT,
      bring_to_life: sharedInitializers.J,
      "bring-it-to-life": sharedInitializers.J,
      make_stickers: sharedInitializers.Y,
      make_storybook: sharedInitializers.$,
      animate_drawing: sharedInitializers.W,
    } as Record<string, unknown>)[key];
    return asset == null
      ? jsx.jsx(sharedInitializers.ZS, {})
      : jsx.jsx(sharedInitializers.S_, { asset, "aria-hidden": true });
  };
  const surfaceItems: SuggestionItem[] = items.map((item, index) => ({
    id: item.id,
    label: item.title,
    icon: iconFor(item.id),
    disabled: false,
    onClick: () => onSelect(item, index),
  }));
  return jsx.jsx(HomeSuggestionSurface, {
    composerMode: mode,
    items: surfaceItems,
    layout: "list",
    showCloseAction: false,
  });
}

function SketchHomeSuggestions({ mode }: SketchHomeSuggestionsProps): unknown {
  const scope = useScope(composerStateRoot) as MaitaiScopeApi<unknown>;
  const conversationId = readSignal<unknown>(activeConversationId);
  const uploadId = readSignal<string | null>(sketchUploadId);
  const editor = useComposerEditor();
  const composerEmpty = (observeComposerValue as unknown as (
    controller: unknown,
    selector: (value: { hasText(): boolean }) => boolean,
    channel: string,
  ) => boolean)(editor, (value) => !value.hasText(), "document");
  const enabled = uploadId != null && composerEmpty;
  const { data: items } = useQuery({
    queryKey: ["sketch-followups", conversationId, uploadId],
    enabled,
    queryFn: fetchSketchFollowups,
    retry: 2,
    staleTime: Infinity,
  });

  if (uploadId == null || !enabled || items == null || items.length === 0) return null;
  return jsx.jsx(SketchSuggestionList, {
    items,
    mode,
    onSelect: (item: SketchFollowupSuggestion, index: number) => {
      if (editor.hasText() || scope.get(sketchUploadId) == null) return;
      clearSketchComposerState(scope, conversationId);
      editor.setPromptText?.(item.prompt_text);
      setComposerSystemHints(scope, conversationId, item.system_hints ?? []);
      editor.focus?.();
      const attachments = scope.get(
        composerAttachments as never,
        conversationId,
      ) as unknown as ComposerAttachment[];
      if (attachments.filter((entry) => !entry.isBigPaste).length === 1) {
        trackProductEvent(scope, sketchFollowupSelectedEvent, {
          position: normalizeSuggestionPosition(index),
          suggestionId: item.id,
        });
      }
    },
  }, uploadId);
}

export { SketchHomeSuggestions };
