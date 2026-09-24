// codex directive 扩展定制层（原版 47,356-47,661 区段）。
//
// 职责：在 vendored marked-directive（vendor/marked.ts 的 Xbe）之上做两层定制：
//   1. 容错 tokenizer 包装（createCodexDirectiveExtension）：把 directive
//      起始行截断到「名字 + [参数] + {属性}」的确定边界后再交给原
//      tokenizer，解析抛错时吞掉返回 undefined；block 级 start 正则换成
//      自定义扫描（允许 `:::`/`::` 后跟属性且要求整行独立）。
//   2. fenced 代码块保护（protectFencedBlocks / preprocessDirectiveSource）：
//      marked 的 block lexer 逐行扫描，`:::` 出现在 fenced 代码块内部时会被
//      误认为 directive 结束标记。本层在词法分析前对源文本做一次预扫描，
//      把 fenced 块内部的裸 `:::` 行改写为 `:::\r`（或行尾追加 \r），
//      使其不再匹配结束标记，同时保持文本内容可见。
//   3. 属性值转义哨兵（__codex_directive_*）：属性 `{...}` 内的引号/反斜杠/
//      `]`/`}` 在词法分析时替换为哨兵字符串，token 后处理阶段还原，避免
//      与 directive 自身语法冲突。
//
// 共享约束：codexDirectiveExtension 被 writing-blocks（writingBlocksMarked）
// 与 marked-extensions（codexMarkedOptions）两处消费——必须保持单实例共享
// （marked-directive 内部用 alea 给扩展名生成随机后缀，重复构造会导致两
// 个不同名的 directive 扩展同时注册）。

import { Xbe as createDirectiveExtension, NS as walkTokens } from "../vendor/marked";

// ---------------------------------------------------------------------------
// 转义哨兵（属性值在词法分析期间的占位表示）
// ---------------------------------------------------------------------------

const ESCAPED_DOUBLE_QUOTE = `__codex_directive_escaped_double_quote__`;
const ESCAPED_SINGLE_QUOTE = `__codex_directive_escaped_single_quote__`;
const QUOTED_BACKSLASH = `__codex_directive_quoted_backslash__`;
const QUOTED_CLOSING_BRACKET = `__codex_directive_quoted_closing_bracket__`;
const QUOTED_CLOSING_BRACE = `__codex_directive_quoted_closing_brace__`;
const SENTINEL_PREFIX = `__codex_directive_`;

/** block 级扩展的起始 marker（对应 marked-directive 的 `:::`/`::` 两级）。 */
const DIRECTIVE_START_MARKERS = [`:::`, `::`] as const;

/** codex directive 扩展实例（容错包装后的 marked-directive 扩展）。 */
export const codexDirectiveExtension = createFaultTolerantDirectiveExtension();

// ---------------------------------------------------------------------------
// directive 头部扫描（名字 + [参数] + {属性}）
// ---------------------------------------------------------------------------

/**
 * 从偏移 0 扫描一个 directive 头部：`:::name[arg]{attrs}`。
 * 找到名字与属性区起点后，用 scanAttributes 定位属性区结束，返回
 * `{ name, startIndex, endIndex }`；不是 directive 形态返回 null。
 */
function scanDirectiveAt(source: string, startIndex: number) {
  let header = parseDirectiveHeader(source, startIndex);
  if (header == null) return null;
  let attributesEnd = scanAttributes(source, header.attributesStart);
  return attributesEnd == null ? null : { name: header.name, startIndex, endIndex: attributesEnd };
}

// ---------------------------------------------------------------------------
// 源文本预处理（fenced 保护 + 属性值内联展开）
// ---------------------------------------------------------------------------

/**
 * 词法分析前的源文本预处理：
 *   - 含 `{` 且疑似 directive 时，把 `{...}` 属性值内联展开（去引号、
 *     哨兵替换）——marked-directive 的 attrs tokenizer 不接受引号值；
 *   - 含 `:::` 时做 fenced 块保护。
 * looksLikeDirective 省缺时按文本自身探测。
 */
export function preprocessDirectiveSource(source: string, looksLikeDirective = detectDirectiveLike(source)) {
  let processed = source.includes(`{`) && looksLikeDirective ? inlineDirectiveAttributeValues(source) : source;
  return processed.includes(`:::`) ? protectFencedBlocks(processed) : processed;
}

/** 文本中是否存在疑似 directive 的 `::name` 前缀（`:` 重复 <3 且后跟名字首字符）。 */
function detectDirectiveLike(source: string) {
  let colonIndex = source.indexOf(`:`);
  for (; colonIndex !== -1; ) {
    let cursor = colonIndex + 1;
    for (; source[cursor] === `:` && cursor - colonIndex < 3; ) cursor += 1;
    if (isAsciiLetter(source.charCodeAt(cursor))) return true;
    colonIndex = source.indexOf(`:`, colonIndex + 1);
  }
  return false;
}

/**
 * 把所有 directive `{...}` 属性区的值内联展开：引号去除、值内的引号/反斜杠/
 * `]`/`}` 换成哨兵。非 directive 形态的 `{` 文本保持原样。
 */
function inlineDirectiveAttributeValues(source: string) {
  let result: string | null = null;
  let copiedUpTo = 0;
  let colonIndex = source.indexOf(`:`);
  for (; colonIndex !== -1; ) {
    let header = parseDirectiveHeader(source, colonIndex);
    if (header == null) {
      colonIndex = source.indexOf(`:`, colonIndex + 1);
      continue;
    }
    let { attributesStart } = header;
    let extracted = extractAttributeValue(source, attributesStart);
    if (extracted == null) {
      colonIndex = source.indexOf(`:`, attributesStart + 1);
      continue;
    }
    result ??= ``;
    result += source.slice(copiedUpTo, attributesStart);
    result += extracted.value;
    copiedUpTo = extracted.end;
    colonIndex = source.indexOf(`:`, extracted.end);
  }
  return result == null ? source : result + source.slice(copiedUpTo);
}

/**
 * fenced 代码块保护：逐行扫描，fenced 块内部出现的 directive 结束行
 * （`:::` 独行）改写为 `:::\r`（行尾在 \r\n 之前时为 `:::\r`），使其不再
 * 匹配 marked-directive 的结束标记。同时跟踪 `:::name` 开启的 directive
 * 块——其内部的 fenced 标记不触发保护（`t` 状态位）。
 */
function protectFencedBlocks(source: string) {
  let insideFence = false;
  let fenceMarker: string | null = null;
  let fenceMarkerLength = 0;
  let edited: string | null = null;
  let copiedUpTo = 0;
  let lineStart = 0;
  let lineEnd = 0;
  for (; lineEnd <= source.length; ) {
    let newlineIndex = source.indexOf(`
`, lineEnd);
    let lineBreak = newlineIndex === -1 ? source.length : newlineIndex;
    let lineContentEnd = lineBreak > lineEnd && source.charCodeAt(lineBreak - 1) === 13 ? lineBreak - 1 : lineBreak;
    let contentStart = firstNonSpaceIndex(source, lineEnd, lineContentEnd);
    let lineText = source.slice(contentStart, lineContentEnd);
    let fenceMatch = /^(`{3,}|~{3,})/.exec(lineText)?.[1];
    if (fenceMarker != null) {
      // 处于 fenced 块内：只认与开启 marker 同字符、长度不小于它的收尾行。
      if (
        fenceMatch?.startsWith(fenceMarker) &&
        fenceMatch.length >= fenceMarkerLength &&
        lineText.slice(fenceMatch.length).trim().length === 0
      ) {
        fenceMarker = null;
        fenceMarkerLength = 0;
      }
    } else if (fenceMatch != null && (fenceMatch[0] !== "`" || !lineText.slice(fenceMatch.length).includes("`"))) {
      fenceMarker = fenceMatch.charAt(0);
      fenceMarkerLength = fenceMatch.length;
    } else if (insideFence && isDirectiveCloseLine(source, contentStart, lineContentEnd)) {
      // directive 块内部的裸 `:::` 行：改写使其不匹配结束标记。
      insideFence = false;
      let protectedLine = lineContentEnd < lineBreak ? `:::\r` : `:::`;
      if (source.slice(lineEnd, lineBreak) !== protectedLine) {
        edited ??= ``;
        edited += source.slice(copiedUpTo, lineEnd);
        edited += protectedLine;
        copiedUpTo = lineBreak;
      }
    } else if (!insideFence && isDirectiveOpenLine(source, contentStart)) {
      insideFence = true;
    }
    if (newlineIndex === -1) break;
    lineEnd = newlineIndex + 1;
  }
  return edited == null ? source : edited + source.slice(copiedUpTo);
}

// ---------------------------------------------------------------------------
// token 后处理（codexDirective token 化）
// ---------------------------------------------------------------------------

/**
 * 把 marked-directive 产出的 directive token（meta 带 level/marker）改写为
 * codexDirective token：raw 还原哨兵、attrs 归一为 attributes（裸属性 → true）、
 * 标记 block 级。walkTokens 遇到容器 token 时返回 `[]`（不下钻——
 * marked-directive 的容器 token 结构由扩展自身维护）。
 */
export function applyDirectiveTokenPostProcessing(tokens: any[]) {
  // 原版回调恒返回 []（逗号表达式）——即对任何 token 都不继续下钻，
  // directive 容器的子 token 由扩展自身维护，marked 的 walkTokens 不再遍历。
  walkTokens(tokens, (token: any) => {
    if (isDirectiveToken(token)) Object.assign(token, toCodexDirectiveToken(token));
    return [];
  });
}

/** directive token → codexDirective token 的字段映射。 */
function toCodexDirectiveToken(token: any) {
  return {
    type: `codexDirective`,
    raw: unescapeSentinelsInRaw(token.raw),
    name: token.meta.name ?? ``,
    attributes: normalizeAttributes(token.attrs),
    block: token.meta.level !== `inline`,
    text: token.text,
    tokens: token.tokens,
  };
}

/** attrs（marked-directive 原始形态）→ attributes：裸属性为 true，值还原哨兵。 */
function normalizeAttributes(attrs: Record<string, unknown> | null | undefined) {
  if (attrs == null) return {};
  let attributes: Record<string, string | boolean> = {};
  for (let key in attrs) {
    let value = attrs[key];
    if (value === key) {
      attributes[key] = true;
      continue;
    }
    if (
      typeof value == `string` ||
      typeof value == `number` ||
      typeof value == `boolean` ||
      typeof value == `bigint`
    ) {
      attributes[key] = unescapeSentinels(String(value));
    }
  }
  return attributes;
}

// ---------------------------------------------------------------------------
// directive 头部解析
// ---------------------------------------------------------------------------

/**
 * 解析 `:::name[arg]{` 形态的头部：返回 `{ attributesStart, name }`。
 * 名字字符集为 [A-Za-z0-9_-]，`[...]` 参数不允许跨行，之后必须紧跟 `{`。
 */
function parseDirectiveHeader(source: string, offset: number) {
  if (source[offset] !== `:`) return null;
  let cursor = offset;
  for (; source[cursor] === `:` && cursor - offset < 3; ) cursor += 1;
  if (!isAsciiLetter(source.charCodeAt(cursor))) return null;
  let nameStart = cursor;
  for (cursor += 1; isDirectiveNameChar(source.charCodeAt(cursor)); ) cursor += 1;
  let name = source.slice(nameStart, cursor);
  if (source[cursor] === `[` && ((cursor = skipBracketArg(source, cursor + 1)), cursor === -1)) return null;
  return source[cursor] === `{` ? { attributesStart: cursor, name } : null;
}

/** 跳过 `[...]` 参数（不允许换行），返回 `]` 之后的偏移；跨行/未闭合返回 -1。 */
function skipBracketArg(source: string, offset: number) {
  let cursor = offset;
  for (; cursor < source.length; ) {
    if (source[cursor] === `
`) return -1;
    if (source[cursor] === `]`) return cursor + 1;
    cursor += 1;
  }
  return -1;
}

/**
 * 提取 `{...}` 属性区的值（引号内文本），引号/反斜杠/`]`/`}` 换成哨兵。
 * onSubstitution 回调用于 raw 还原（起始/结束偏移 + 哨兵值）。
 * 返回 `{ end, value }`；未闭合/跨行返回 null。
 */
function extractAttributeValue(source: string, offset: number) {
  let copiedUpTo = offset;
  let substituted = ``;
  let end = scanAttributes(source, offset, (start, stop, sentinel) => {
    substituted += source.slice(copiedUpTo, start) + sentinel;
    copiedUpTo = stop;
  });
  return end == null ? null : { end, value: substituted + source.slice(copiedUpTo, end) };
}

/**
 * 从 `{` 起扫描属性区直到配对的 `}`：引号外的 `}` 结束扫描；引号内的
 * `\"`/`\'`/`\\`/`]`/`}` 触发 onSubstitution（哨兵替换）。跨行或未闭合
 * 返回 null。
 */
function scanAttributes(source: string, offset: number, onSubstitution?: (start: number, stop: number, sentinel: string) => void) {
  let quote: string | null = null;
  let cursor = offset + 1;
  for (; cursor < source.length; ) {
    let char = source[cursor];
    if (char === `
`) return null;
    if (quote == null) {
      if (char === `"` || char === `'`) quote = char;
      else if (char === `}`) return cursor + 1;
      cursor += 1;
      continue;
    }
    if (char === `\\` && source[cursor + 1] === quote) {
      onSubstitution?.(cursor, cursor + 2, quote === `"` ? ESCAPED_DOUBLE_QUOTE : ESCAPED_SINGLE_QUOTE);
      cursor += 2;
      continue;
    }
    if (char === `\\`) {
      onSubstitution?.(cursor, cursor + 1, QUOTED_BACKSLASH);
      cursor += 1;
      continue;
    }
    if (char === `]`) {
      onSubstitution?.(cursor, cursor + 1, QUOTED_CLOSING_BRACKET);
      cursor += 1;
      continue;
    }
    if (char === `}`) {
      onSubstitution?.(cursor, cursor + 1, QUOTED_CLOSING_BRACE);
      cursor += 1;
      continue;
    }
    if (char === quote) quote = null;
    cursor += 1;
  }
  return null;
}

/** 属性值还原：哨兵 → 原字符（无哨兵时原样返回）。 */
function unescapeSentinels(value: string) {
  return value.includes(SENTINEL_PREFIX)
    ? value
        .replaceAll(ESCAPED_DOUBLE_QUOTE, `"`)
        .replaceAll(ESCAPED_SINGLE_QUOTE, `'`)
        .replaceAll(QUOTED_BACKSLASH, `\\`)
        .replaceAll(QUOTED_CLOSING_BRACKET, `]`)
        .replaceAll(QUOTED_CLOSING_BRACE, `}`)
    : value;
}

/** raw 还原：哨兵 → 转义形态（与 JSON 字符串内嵌一致）。 */
function unescapeSentinelsInRaw(raw: string) {
  return raw.includes(SENTINEL_PREFIX)
    ? raw
        .replaceAll(ESCAPED_DOUBLE_QUOTE, `\\"`)
        .replaceAll(ESCAPED_SINGLE_QUOTE, `\\'`)
        .replaceAll(QUOTED_BACKSLASH, `\\`)
        .replaceAll(QUOTED_CLOSING_BRACKET, `]`)
        .replaceAll(QUOTED_CLOSING_BRACE, `}`)
    : raw;
}

// ---------------------------------------------------------------------------
// 容错 directive 扩展构造
// ---------------------------------------------------------------------------

/**
 * 构造容错 directive 扩展：包装 marked-directive 工厂（Xbe）的产物。
 *   - tokenizer 包装：`:::` 开头（容器级，交给原 tokenizer）以外的输入，
 *     先扫描确定头部边界，截断后传入；解析抛错吞掉返回 undefined。
 *   - block 级 start 包装：用 findDirectiveStart 自定义扫描替代原正则
 *     （要求 marker 后跟名字首字符，且 marker 独占一行）。
 */
function createFaultTolerantDirectiveExtension() {
  let extension = createDirectiveExtension();
  let blockStartMarkerIndex = 0;
  return {
    ...extension,
    extensions: extension.extensions?.map((extension: any) => {
      let wrapped = extension;
      if (`tokenizer` in extension) {
        let { tokenizer } = extension;
        wrapped = {
          ...extension,
          tokenizer(source: string, state: unknown) {
            try {
              let header = source.startsWith(`:::`) ? null : scanDirectiveAt(source, 0);
              return tokenizer.call(
                this,
                header != null && isAsciiLetter(source.charCodeAt(header.endIndex)) ? source.slice(0, header.endIndex) : source,
                state,
              );
            } catch {
              return;
            }
          },
        };
      }
      if (!(`level` in wrapped) || wrapped.level !== `block` || wrapped.start == null) return wrapped;
      let marker = DIRECTIVE_START_MARKERS[blockStartMarkerIndex];
      blockStartMarkerIndex += 1;
      return marker == null
        ? wrapped
        : {
            ...wrapped,
            start(source: string) {
              return findDirectiveStart(source, marker);
            },
          };
    }),
  };
}

/** 在文本中找 block 级 directive 的起始偏移（marker 独立行 + 后跟名字首字符）。 */
function findDirectiveStart(source: string, marker: string) {
  let index = source.indexOf(marker);
  for (; index !== -1; ) {
    if (isAsciiLetter(source.charCodeAt(index + marker.length)) && isMarkerAloneOnLine(source, index)) return index;
    index = source.indexOf(marker, index + 1);
  }
}

// ---------------------------------------------------------------------------
// 行级判定
// ---------------------------------------------------------------------------

/** 区间内第一个非空白（空格/Tab）字符的下标（区间耗尽返回区间终点）。 */
function firstNonSpaceIndex(source: string, start: number, end: number) {
  let cursor = start;
  for (; cursor < end; ) {
    let char = source[cursor];
    if (char !== ` ` && char !== `	`) return cursor;
    cursor += 1;
  }
  return cursor;
}

/** 该行是否为 directive 开启行（`:::` + 名字首字符）。 */
function isDirectiveOpenLine(source: string, offset: number) {
  return source.startsWith(`:::`, offset) && isAsciiLetter(source.charCodeAt(offset + 3));
}

/** 该行是否为 directive 结束行（`:::` 后仅空白直到行尾）。 */
function isDirectiveCloseLine(source: string, start: number, end: number) {
  if (!source.startsWith(`:::`, start)) return false;
  let cursor = start + 3;
  for (; cursor < end; ) {
    let char = source[cursor];
    if (char !== ` ` && char !== `	`) return false;
    cursor += 1;
  }
  return true;
}

/** marker 出现位置之前（自行首起）是否只有空白（即 marker 独立成行）。 */
function isMarkerAloneOnLine(source: string, offset: number) {
  for (let cursor = offset - 1; cursor >= 0; --cursor) {
    let char = source[cursor];
    if (char === `
` || char === `\r`) return true;
    if (char !== ` ` && char !== `	`) return false;
  }
  return true;
}

/** token 是否为 marked-directive 产出的 directive token（meta 带 level/marker）。 */
function isDirectiveToken(token: any) {
  return (
    `meta` in token &&
    token.meta != null &&
    typeof token.meta == `object` &&
    `level` in token.meta &&
    `marker` in token.meta
  );
}

/** ASCII 字母（A-Z / a-z）。 */
function isAsciiLetter(code: number) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/** directive 名字字符（字母 / 数字 / `-` / `_`）。 */
function isDirectiveNameChar(code: number) {
  return isAsciiLetter(code) || (code >= 48 && code <= 57) || code === 45 || code === 95;
}
