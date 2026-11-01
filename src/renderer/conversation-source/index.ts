import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  FX as initializeSignalRuntime,
  H3 as initializePreloadRuntime,
  HX as useSignalValue,
  e6 as getReact,
} from "@rchunk/app-shared";
import {
  AUt as initializeConversationSearchDom,
  CUt as initializeMatchFinder,
  DUt as mutationsAffectSearch,
  EUt as markSearchMatch,
  OUt as createSearchSnippet,
  PUt as runRegexSearch,
  SUt as findTextMatches,
  TUt as setMatchSelected,
  _D as initializeSearchHighlighting,
  _Ut as getContentSearchUnitKey,
  gUt as getContentSearchMatchId,
  gmn as initializeUniqBy,
  hUt as clearSearchHighlights,
  iD as currentContentSearchMatch,
  jUt as clampSearchOffset,
  kUt as findMathTextMatches,
  tD as activeContentSearch,
  wUt as createDomSearchHighlighter,
  xUt as findMatchElement,
  yUt as createHighlightElement,
} from "@rchunk/app-initial";
import {
  r as initializeHighlightSelectors,
  t as groupConversationMatches,
} from "@rchunk/highlight-selectors";
import {
  n as scrollToMatch,
  t as initializeScrollToMatch,
} from "@rchunk/scroll-to-match";

const once = onceExport as (initializer: () => void) => () => void;

export interface ConversationSearchLocation extends Record<string, unknown> {
  contextId: string;
  domain: "conversation";
  equationIndex?: number;
  equationRange?: { end: number; start: number };
  matchIndex: number;
  turnCursor?: unknown;
  turnKey: string;
  unitId: string;
}

export interface ConversationSearchMatch {
  id: string;
  location: ConversationSearchLocation;
  ordinal: number;
  snippet: unknown;
}

export interface ConversationSearchResult {
  contextId: string;
  domain: string;
  error?: unknown;
  isCapped: boolean;
  matches: ConversationSearchMatch[];
  query: string;
  regex?: string;
  runId?: string;
  searchMath?: boolean;
  totalMatches: number;
}

export interface SearchableTurn {
  turnKey: string;
  units: Array<{
    equations?: string[];
    text: string;
    textChunks?: string[];
    unitId: string;
  }>;
}

export interface ConversationSearchRequest {
  contextId: string;
  domain: string;
  query: string;
}

interface ScrollAdapter {
  getTurnContainer(turnKey: string): ParentNode | null;
  scrollToTurn(
    turnKey: string,
    options?: { signal?: AbortSignal },
  ): Promise<unknown>;
}

interface NormalizedMath {
  groups: Array<{ end: number; start: number }>;
  tokens: Array<{
    delimiter?: { end: number; start: number };
    end: number;
    start: number;
    value: string;
  }>;
}

const MAX_MATCHES = 250;
const GREEK_NAMES =
  "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega".split(
    " ",
  );
const GREEK_SYMBOLS = Array.from("αβγδεζηθικλμνξοπρστυφχψω");
const MATH_ALIASES = new Map<string, string>([
  ...GREEK_NAMES.map((name, index) => [name, GREEK_SYMBOLS[index]] as const),
  ..."nabla:∇ partial:∂ cdot:⋅ times:× div:÷ pm:± mp:∓ le:≤ leq:≤ ge:≥ geq:≥ ne:≠ neq:≠ infty:∞ sum:∑ prod:∏ int:∫ in:∈ notin:∉ to:→ rightarrow:→ leftarrow:←"
    .split(" ")
    .map((entry) => entry.split(":") as [string, string]),
]);
const STYLE_COMMAND =
  /^\\(?:mathbf|boldsymbol|bm|mathrm|mathit|mathsf|mathtt|mathnormal|mathbb|mathcal|mathscr|mathfrak|textbf|textit|textrm)$/u;
const IGNORED_COMMAND =
  /^\\(?:quad|qquad|enspace|thinspace|medspace|thickspace|negthinspace|displaystyle|textstyle|scriptstyle|scriptscriptstyle|limits|nolimits|[,;:! ])$/u;
const DELIMITER_COMMAND =
  /^\\(?:left|right|middle|big|Big|bigg|Bigg|bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr)$/u;

function normalizeMath(source: string): NormalizedMath | null {
  const sourceTokens = Array.from(
    source.matchAll(/\\[a-zA-Z]+|\\[^\r\n]|[^\s]/gu),
    (match) => ({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
    }),
  );
  const groups: NormalizedMath["groups"] = [];
  const delimiters: Array<{ end: number; start: number }> = [];
  let cursor = 0;

  const parseArgument = (): NormalizedMath["tokens"] => {
    const start = sourceTokens[cursor]?.start;
    if (start == null) throw new Error("Missing argument");
    const contents = parseToken();
    const end = sourceTokens[cursor - 1].end;
    return [
      { value: "argument:start", start, end: start },
      ...contents,
      { value: "argument:end", start: end, end },
    ];
  };

  const parseToken = (): NormalizedMath["tokens"] => {
    const token = sourceTokens[cursor++];
    if (token == null || token.value === "}")
      throw new Error("Incomplete math");
    if (token.value === "{") {
      const nested: NormalizedMath["tokens"] = [];
      while (sourceTokens[cursor]?.value !== "}") nested.push(...parseToken());
      groups.push({ start: token.start, end: sourceTokens[cursor++].end });
      return nested;
    }
    if (STYLE_COMMAND.test(token.value)) {
      const nested = parseToken();
      groups.push({ start: token.start, end: sourceTokens[cursor - 1].end });
      return nested;
    }
    if (IGNORED_COMMAND.test(token.value)) return [];
    if (DELIMITER_COMMAND.test(token.value)) {
      const delimiter = sourceTokens[cursor++];
      if (delimiter == null) throw new Error("Missing delimiter");
      let bounds: { end: number; start: number } | undefined;
      if (token.value === "\\left") {
        bounds = { start: token.start, end: delimiter.end };
        delimiters.push(bounds);
      } else if (token.value === "\\right") {
        bounds = delimiters.pop();
        if (bounds == null) throw new Error("Unpaired delimiter");
        bounds.end = delimiter.end;
      }
      return delimiter.value === "."
        ? []
        : [{ ...delimiter, start: token.start, delimiter: bounds }];
    }
    if (/^\\[dt]?frac$/u.test(token.value)) {
      return [
        { ...token, value: "\\frac" },
        ...parseArgument(),
        ...parseArgument(),
      ];
    }
    if (
      /^(?:[_^]|\\(?:sqrt|vec|hat|bar|overline|underline))$/u.test(
        token.value,
      ) ||
      (token.value.startsWith("\\") &&
        !MATH_ALIASES.has(
          token.value.slice(1).replace(/^var/u, "").toLowerCase(),
        ) &&
        sourceTokens[cursor]?.value === "{")
    ) {
      if (sourceTokens[cursor]?.value === "[")
        throw new Error("Indexed argument");
      return [token, ...parseArgument()];
    }
    let normalized = token.value.replace(/^\\/u, "");
    normalized =
      MATH_ALIASES.get(normalized.replace(/^var/u, "").toLowerCase()) ??
      token.value;
    normalized = normalized
      .replace(/[\u{1D400}-\u{1D7FF}]/gu, (value) => value.normalize("NFKC"))
      .toLowerCase();
    normalized = normalized.replace(/[ϵϑϕϖϱς−·]/gu, (value) => {
      const index = "ϵϑϕϖϱς−·".indexOf(value);
      return "εθφπρσ-⋅"[index];
    });
    return [{ ...token, value: normalized }];
  };

  try {
    const tokens: NormalizedMath["tokens"] = [];
    while (cursor < sourceTokens.length) tokens.push(...parseToken());
    return delimiters.length === 0 ? { tokens, groups } : null;
  } catch {
    return null;
  }
}

function findMathMatches(
  source: string,
  rawQuery: string,
  limit: number,
): { offsets: Array<{ end: number; start: number }>; totalMatches: number } {
  const query = rawQuery.trim();
  if (query.length === 0) return { offsets: [], totalMatches: 0 };
  const normalizedSource = normalizeMath(source);
  const normalizedQuery = normalizeMath(MATH_ALIASES.get(query) ?? query);
  if (normalizedSource == null || normalizedQuery == null) {
    const offsets: Array<{ end: number; start: number }> = [];
    const lowerSource = source.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const commands = [...source.matchAll(/\\[a-zA-Z]+/gu)];
    for (
      let index = lowerSource.indexOf(lowerQuery);
      index >= 0;
      index = lowerSource.indexOf(lowerQuery, index + lowerQuery.length)
    ) {
      if (
        !commands.some(
          (command) =>
            index > command.index && index < command.index + command[0].length,
        )
      ) {
        offsets.push(
          clampSearchOffset(source, {
            start: index,
            end: index + query.length,
          }) as {
            end: number;
            start: number;
          },
        );
      }
    }
    return { offsets: offsets.slice(0, limit), totalMatches: offsets.length };
  }
  const offsets: Array<{ end: number; start: number }> = [];
  let totalMatches = 0;
  for (
    let index = 0;
    normalizedQuery.tokens.length > 0 &&
    index <= normalizedSource.tokens.length - normalizedQuery.tokens.length;
    index += 1
  ) {
    if (
      !normalizedQuery.tokens.every(
        (token, tokenIndex) =>
          token.value === normalizedSource.tokens[index + tokenIndex].value,
      )
    ) {
      continue;
    }
    const matched = normalizedSource.tokens.slice(
      index,
      index + normalizedQuery.tokens.length,
    );
    let start = matched[0].start;
    let end = matched.at(-1)?.end ?? start;
    for (const token of matched) {
      start = Math.min(start, token.delimiter?.start ?? start);
      end = Math.max(end, token.delimiter?.end ?? end);
    }
    for (const group of normalizedSource.groups) {
      if (start < group.start && end > group.start && end < group.end)
        end = group.end;
      if (start > group.start && start < group.end && end > group.end)
        start = group.start;
    }
    totalMatches += 1;
    if (offsets.length < limit) offsets.push({ start, end });
    index += normalizedQuery.tokens.length - 1;
  }
  return { offsets, totalMatches };
}

function mergeSearchResults(
  current: ConversationSearchResult,
  persisted: ConversationSearchResult,
): ConversationSearchResult {
  const currentById = new Map(
    current.matches.map((match) => [match.id, match]),
  );
  const matches = [
    ...persisted.matches.map((match) => currentById.get(match.id) ?? match),
    ...current.matches,
  ]
    .filter(
      (match, index, all) =>
        all.findIndex(({ id }) => id === match.id) === index,
    )
    .map((match, index) => ({ ...match, ordinal: index + 1 }));
  return {
    ...current,
    matches,
    totalMatches: Math.max(
      matches.length,
      current.totalMatches,
      persisted.totalMatches,
    ),
    isCapped: current.isCapped || persisted.isCapped,
  };
}

async function searchConversation(
  request: ConversationSearchRequest,
  turns: SearchableTurn[],
  searchMath: boolean,
  signal?: AbortSignal,
): Promise<ConversationSearchResult> {
  const query = request.query.trim();
  const regex =
    searchMath &&
    query.length > 1 &&
    query.startsWith("/") &&
    query.endsWith("/")
      ? query.slice(1, -1)
      : undefined;
  const texts = turns.flatMap((turn) =>
    turn.units.flatMap((unit) =>
      (unit.textChunks ?? [unit.text]).flatMap((text, index) => {
        const searchable = {
          turnKey: turn.turnKey,
          unitId: unit.unitId,
          text: searchMath ? text.replace(/\s+/gu, " ").trim() : text,
          equationIndex: undefined as number | undefined,
        };
        const equation = searchMath ? unit.equations?.[index] : undefined;
        return equation == null
          ? [searchable]
          : [
              searchable,
              { ...searchable, text: equation, equationIndex: index },
            ];
      }),
    ),
  );
  const result: ConversationSearchResult = {
    domain: request.domain,
    contextId: request.contextId,
    query,
    regex,
    searchMath: searchMath || undefined,
    matches: [],
    totalMatches: 0,
    isCapped: false,
  };
  if (query.length === 0) return result;
  const regexResult =
    regex == null
      ? null
      : ((await runRegexSearch(
          {
            query: regex,
            texts: texts.map(({ text }) => text),
            mathTexts: texts.map(({ equationIndex }) => equationIndex != null),
            maxMatches: MAX_MATCHES,
          },
          signal,
        )) as {
          error?: unknown;
          offsets?: Array<Array<{ end: number; start: number }>>;
          totalMatches?: number;
        } | null);
  if (regexResult?.error != null)
    return { ...result, error: regexResult.error };
  result.totalMatches = regexResult?.totalMatches ?? 0;
  const textMatchCountByUnit = new Map<string, number>();
  for (const [textIndex, searchable] of texts.entries()) {
    const unitKey = getContentSearchUnitKey(
      searchable.turnKey,
      searchable.unitId,
    ) as string;
    const previousMatchCount = textMatchCountByUnit.get(unitKey) ?? 0;
    const matchResult =
      regexResult == null
        ? searchable.equationIndex == null
          ? (findTextMatches(
              searchable.text,
              query,
              MAX_MATCHES - result.matches.length,
            ) as {
              offsets: Array<{ end: number; start: number }>;
              totalMatches: number;
            })
          : findMathMatches(
              searchable.text,
              query,
              MAX_MATCHES - result.matches.length,
            )
        : { offsets: regexResult.offsets?.[textIndex] ?? [], totalMatches: 0 };
    result.totalMatches += matchResult.totalMatches;
    for (const [matchIndex, range] of matchResult.offsets.entries()) {
      const location: ConversationSearchLocation = {
        domain: "conversation",
        contextId: request.contextId,
        turnKey: searchable.turnKey,
        unitId: searchable.unitId,
        matchIndex:
          searchable.equationIndex == null
            ? previousMatchCount + matchIndex
            : matchIndex,
        equationIndex: searchable.equationIndex,
        equationRange: searchable.equationIndex == null ? undefined : range,
      };
      result.matches.push({
        id: getContentSearchMatchId(location) as string,
        ordinal: result.matches.length + 1,
        location,
        snippet: createSearchSnippet(searchable.text, range.start, range.end),
      });
    }
    if (searchable.equationIndex == null) {
      textMatchCountByUnit.set(
        unitKey,
        previousMatchCount + matchResult.offsets.length,
      );
    }
  }
  result.isCapped = result.totalMatches > result.matches.length;
  return result;
}

function createConversationSearchSource({
  contextId,
  getTurns,
  hydratePersistedMatch,
  revealUnrenderedMatches = false,
  searchPersisted,
  searchMath = false,
  scrollAdapter,
}: {
  contextId: string;
  getTurns(): SearchableTurn[];
  hydratePersistedMatch?(
    location: ConversationSearchLocation,
    options?: { signal?: AbortSignal },
  ): Promise<boolean>;
  revealUnrenderedMatches?: boolean;
  searchPersisted?(
    request: ConversationSearchRequest,
    options?: { signal?: AbortSignal },
  ): Promise<ConversationSearchResult | null>;
  searchMath?: boolean;
  scrollAdapter: ScrollAdapter;
}) {
  return {
    domain: "conversation" as const,
    contextId,
    async search(
      request: ConversationSearchRequest,
      options?: { signal?: AbortSignal },
    ) {
      const current = await searchConversation(
        request,
        getTurns(),
        searchMath,
        options?.signal,
      );
      if (searchMath || searchPersisted == null) return current;
      const persisted = await searchPersisted(request, options);
      return persisted == null
        ? current
        : mergeSearchResults(current, persisted);
    },
    async ensureVisible(
      location: ConversationSearchLocation,
      options?: { signal?: AbortSignal },
    ) {
      if (
        location.domain !== "conversation" ||
        location.contextId !== contextId ||
        (location.turnCursor != null &&
          hydratePersistedMatch != null &&
          (!(await hydratePersistedMatch(location, options)) ||
            options?.signal?.aborted))
      )
        return;
      const hadCursor = location.turnCursor != null;
      let container = scrollAdapter.getTurnContainer(location.turnKey);
      const matchId = getContentSearchMatchId(location) as string;
      const needsReveal =
        revealUnrenderedMatches &&
        container != null &&
        findMatchElement({ container, matchId, includeShadowRoots: false }) ==
          null;
      if (container == null || hadCursor || needsReveal) {
        if (options?.signal?.aborted) return;
        await scrollAdapter.scrollToTurn(
          location.turnKey,
          options?.signal == null ? undefined : { signal: options.signal },
        );
        if (options?.signal?.aborted) return;
        container = scrollAdapter.getTurnContainer(location.turnKey);
      }
      if (container != null) {
        await scrollToMatch({
          container,
          matchId,
          includeShadowRoots: false,
          signal: options?.signal,
        });
      }
    },
  };
}

function useConversationSearchHighlights({
  containerRef,
  contextId,
}: {
  containerRef: { current: ParentNode | null };
  contextId: string;
}): void {
  const React = getReact() as {
    useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  };
  const search = useSignalValue(
    activeContentSearch,
  ) as ConversationSearchResult | null;
  const activeMatch = useSignalValue(
    currentContentSearchMatch,
  ) as ConversationSearchMatch | null;
  React.useEffect(() => {
    const container = containerRef.current;
    if (container == null) return;
    clearSearchHighlights(container, { includeShadowRoots: false });
    if (search?.contextId !== contextId) return;
    const grouped = groupConversationMatches(search.matches) as Map<
      string,
      ConversationSearchMatch[]
    >;
    for (const element of Array.from(
      container.querySelectorAll?.("[data-content-search-unit-key]") ?? [],
    )) {
      const candidate = element as Element & { dataset: DOMStringMap };
      const matches =
        grouped.get(candidate.dataset.contentSearchUnitKey ?? "") ?? [];
      const highlights = findTextMatches(
        candidate.textContent ?? "",
        search.query,
        matches.length,
      ) as {
        offsets: Array<{ end: number; start: number }>;
      };
      for (const [index, match] of matches.entries()) {
        markSearchMatch({
          element: candidate,
          matchId: match.id,
          range: highlights.offsets[index],
        });
        setMatchSelected(candidate, match.id === activeMatch?.id);
      }
    }
    return () =>
      clearSearchHighlights(container, { includeShadowRoots: false });
  }, [activeMatch?.id, containerRef, contextId, search?.runId]);
  void mutationsAffectSearch;
  void createDomSearchHighlighter;
  void createHighlightElement;
  void initializeCompilerCache;
  void initializeConversationSearchDom;
}

const initializeConversationSearchHighlights = once((): void => {
  initializeCompilerCache();
  initializeSignalRuntime();
  initializeHighlightSelectors();
  initializeMatchFinder();
  initializeSearchHighlighting();
  initializePreloadRuntime();
  void import("@rchunk/katex-renderer");
});

const initializeConversationSource = once((): void => {
  initializeUniqBy();
  initializeMatchFinder();
  initializeMathSearch();
  initializeScrollToMatch();
  initializeConversationSearchHighlights();
});

const initializeMathSearch = once((): void => {
  void findMathTextMatches;
});

export {
  useConversationSearchHighlights as i,
  initializeConversationSource as n,
  initializeConversationSearchHighlights as r,
  createConversationSearchSource as t,
};
