function parseGitQuotedPath(input: string, startIndex: number) {
  if (input[startIndex] !== `"`) return null;
  let index = startIndex + 1;
  let path = ``;
  let pathForUnquotedDiffHeader = ``;
  while (index < input.length) {
    const character = input[index];
    if (character == null) return null;
    if (character === `"`)
      return { nextIndex: index + 1, path, pathForUnquotedDiffHeader };
    if (character !== `\\`) {
      path += character;
      pathForUnquotedDiffHeader += character;
      index += 1;
      continue;
    }
    const escape = parseGitPathEscape(input, index + 1);
    if (escape == null) return null;
    path += escape.path;
    pathForUnquotedDiffHeader += escape.pathForUnquotedDiffHeader;
    index = escape.nextIndex;
  }
  return null;
}

function parseGitPathEscape(input: string, startIndex: number) {
  const character = input[startIndex];
  if (character == null) return null;
  if (character === `\\` || character === `"`)
    return {
      nextIndex: startIndex + 1,
      path: character,
      pathForUnquotedDiffHeader: character,
    };
  const simpleEscapes: Record<string, string> = {
    a: `\x07`,
    b: `\b`,
    f: `\f`,
    n: `\n`,
    r: `\r`,
    t: `\t`,
    v: `\v`,
  };
  if (simpleEscapes[character] != null)
    return {
      nextIndex: startIndex + 1,
      path: simpleEscapes[character],
      pathForUnquotedDiffHeader: `\\${character}`,
    };
  if (!isOctalDigit(character))
    return {
      nextIndex: startIndex + 1,
      path: character,
      pathForUnquotedDiffHeader: character,
    };

  const bytes: number[] = [];
  let index = startIndex;
  for (;;) {
    const octal = input.slice(index, index + 3);
    if (!isThreeDigitOctal(octal)) return null;
    bytes.push(Number.parseInt(octal, 8));
    index += 3;
    if (input[index] !== `\\` || !isOctalDigit(input[index + 1] ?? ``)) break;
    index += 1;
  }
  let path: string;
  try {
    path = new TextDecoder(`utf-8`, { fatal: true, ignoreBOM: true }).decode(
      Uint8Array.from(bytes),
    );
  } catch {
    path = bytes.map((byte) => String.fromCharCode(byte)).join(``);
  }
  return {
    nextIndex: index,
    path,
    pathForUnquotedDiffHeader: input.slice(startIndex - 1, index),
  };
}

function parseGitDiffHeader(header: string) {
  const headerKind = classifyGitDiffHeader(header);
  if (headerKind === `combined` && header.startsWith(`diff --cc `))
    return parseCombinedGitDiffPath(header.slice(10));
  if (headerKind === `combined`)
    return parseCombinedGitDiffPath(header.slice(16));
  if (headerKind !== `git`) return null;
  const paths = header.slice(11);
  if (paths.startsWith(`"`)) {
    const oldPath = parseGitQuotedPath(paths, 0);
    if (oldPath == null || paths[oldPath.nextIndex] !== ` `) return null;
    const newPath = parseGitQuotedPath(paths, oldPath.nextIndex + 1);
    return newPath == null ? null : stripGitDiffPrefixes(oldPath.path, newPath.path);
  }
  const separator = paths.lastIndexOf(` b/`);
  return separator < 0
    ? null
    : stripGitDiffPrefixes(paths.slice(0, separator), paths.slice(separator + 1));
}

function parseCombinedGitDiffPath(value: string) {
  if (!value.startsWith(`"`)) return { oldPath: value, newPath: value };
  const path = parseGitQuotedPath(value, 0);
  return path == null || path.nextIndex !== value.length
    ? null
    : { oldPath: path.path, newPath: path.path };
}

function rewriteGitRenameDiff(diff: string, oldPath: string, newPath: string) {
  const quotedOldPath = quoteGitDiffPath(`a/${oldPath}`);
  const quotedNewPath = quoteGitDiffPath(`b/${newPath}`);
  const renameHeaders = `rename from ${quoteGitDiffPath(oldPath)}\nrename to ${quoteGitDiffPath(newPath)}\n`;
  return diff.length === 0
    ? `diff --git ${quotedOldPath} ${quotedNewPath}\nsimilarity index 100%\n${renameHeaders}`
    : diff
        .replace(
          /^diff --git .*$/m,
          (header) => `${header}\nsimilarity index 0%\n${renameHeaders.trimEnd()}`,
        )
        .replace(/^--- .*$/m, `--- ${quotedOldPath}`)
        .replace(/^\+\+\+ .*$/m, `+++ ${quotedNewPath}`)
        .replace(/^diff --git .*$/m, `diff --git ${quotedOldPath} ${quotedNewPath}`);
}

export {
  countGitDiffLines,
  isOctalDigit,
  isThreeDigitOctal,
  parseCombinedGitDiffPath,
  parseGitDiffHeader,
  parseGitPathEscape,
  parseGitQuotedPath,
  quoteGitDiffPath,
  rewriteGitRenameDiff,
  stripGitDiffPrefixes,
};
if (typeof module !== `undefined`)
  module.exports = {
    countGitDiffLines,
    isOctalDigit,
    isThreeDigitOctal,
    parseCombinedGitDiffPath,
    parseGitDiffHeader,
    parseGitPathEscape,
    parseGitQuotedPath,
    quoteGitDiffPath,
    rewriteGitRenameDiff,
    stripGitDiffPrefixes,
  };
import { countGitDiffLines } from "./git-diff-line-count-policy";
import { isOctalDigit, isThreeDigitOctal } from "./git-diff-octal-policy";
import { classifyGitDiffHeader } from "./git-diff-header-policy";
import { stripGitDiffPrefixes } from "./git-diff-prefix-policy";
import { quoteGitDiffPath } from "./git-diff-quote-policy";
