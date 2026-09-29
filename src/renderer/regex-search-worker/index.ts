// regex-search-worker — regex matching with LaTeX command/group range expansion.

interface MatchRange { end: number; start: number }
interface SearchRequest { mathTexts?: boolean[]; maxMatches: number; query: string; texts: string[] }
interface SearchResponse { error?: "invalid-regex"; offsets: MatchRange[][]; totalMatches: number }
interface WorkerScope { onmessage: ((event: { data: SearchRequest }) => void) | null; postMessage(message: SearchResponse): void }

const latexTokenPattern = /\\(?:[a-zA-Z]+|[^])|[{}]/gu;
const twoArgumentCommands = /^\\(?:[dt]?frac|binom|overset|underset)$/u;
const oneArgumentCommands = /^\\(?:sqrt|mathbf|boldsymbol|bm|mathrm|mathit|mathsf|mathtt|mathcal|mathbb|mathfrak|mathnormal|mathscr|operatorname|text|textrm|textbf|textit|vec|hat|widehat|bar|overline|underline|tilde|widetilde|dot|ddot)$/u;
const singleLatexTokenPattern = /^(?:\\[a-zA-Z]+|\\[^]|[^])/u;

function expandMathRange(text: string, range: MatchRange): MatchRange {
  let { start, end } = range;
  const groups: MatchRange[] = [];
  const openGroups: number[] = [];
  const tokens = [...text.matchAll(latexTokenPattern)];

  for (const token of tokens) {
    const tokenStart = token.index;
    const tokenEnd = tokenStart + token[0].length;
    if (token[0].startsWith("\\") && tokenStart < end && tokenEnd > start) {
      start = Math.min(start, tokenStart);
      end = Math.max(end, tokenEnd);
    } else if (token[0] === "{") {
      openGroups.push(tokenStart);
    } else if (token[0] === "}") {
      const groupStart = openGroups.pop();
      if (groupStart != null) groups.push({ start: groupStart, end: tokenEnd });
    }
  }

  for (const token of tokens) {
    const tokenStart = token.index;
    const tokenEnd = tokenStart + token[0].length;
    if (!token[0].startsWith("\\") || tokenStart >= end || tokenEnd <= start) continue;
    let cursor = tokenEnd;
    let argumentCount = twoArgumentCommands.test(token[0]) ? 2 : oneArgumentCommands.test(token[0]) ? 1 : 0;
    if (token[0] === "\\sqrt" && text[cursor] === "[") {
      const optionEnd = text.indexOf("]", cursor);
      if (optionEnd >= 0) cursor = optionEnd + 1;
    }
    while (argumentCount > 0) {
      while (/\s/u.test(text[cursor] ?? "")) cursor += 1;
      const group = groups.find((candidate) => candidate.start === cursor);
      cursor = group?.end ?? cursor + (text.slice(cursor).match(singleLatexTokenPattern)?.[0].length ?? 0);
      argumentCount -= 1;
    }
    end = Math.max(end, cursor);
  }

  for (const group of groups) {
    const crossesRightEdge = start <= group.start && end > group.start && end < group.end;
    const crossesLeftEdge = start > group.start && start < group.end && end >= group.end;
    if (crossesRightEdge || crossesLeftEdge) {
      start = Math.min(start, group.start);
      end = Math.max(end, group.end);
    }
  }
  return { start, end };
}

function searchRegex(texts: string[], query: string, maxMatches: number, mathTexts?: boolean[]): SearchResponse {
  let expression: RegExp;
  try { expression = new RegExp(query, "giu"); } catch { return { offsets: [], totalMatches: 0, error: "invalid-regex" }; }
  let totalMatches = 0;
  let remainingMatches = maxMatches;
  const offsets = texts.map((text, textIndex) => {
    expression.lastIndex = 0;
    const visible: MatchRange[] = [];
    const expanded: MatchRange[] = [];
    const record = (match: MatchRange): void => {
      totalMatches += 1;
      if (remainingMatches > 0) { visible.push(match); remainingMatches -= 1; }
    };
    for (const match of text.matchAll(expression)) {
      if (match[0].length === 0) continue;
      const range = { start: match.index, end: match.index + match[0].length };
      if (mathTexts?.[textIndex]) expanded.push(expandMathRange(text, range));
      else record(range);
    }
    let merged: MatchRange | undefined;
    for (const range of expanded.sort((left, right) => left.start - right.start)) {
      if (merged != null && range.start < merged.end) merged.end = Math.max(merged.end, range.end);
      else { if (merged != null) record(merged); merged = range; }
    }
    if (merged != null) record(merged);
    return visible;
  });
  return { offsets, totalMatches };
}

const workerScope = self as unknown as WorkerScope;
workerScope.onmessage = ({ data: { texts, query, maxMatches, mathTexts } }): void => {
  workerScope.postMessage(searchRegex(texts, query, maxMatches, mathTexts));
};
