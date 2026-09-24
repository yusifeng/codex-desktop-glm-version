// marked 扩展层 II：math / codex-file-citation / inbox-item（原版
// 56,077-56,343 区段）。
//
// 职责：
//   - `【path†L12-L34】` codex-file-citation 解析（cw/_we/lw）；
//   - skill-mention `$[...]`/`@file` 正则（iw/uwe，fwe 提取）——56,091 的
//     丢弃 RegExp 死代码已按深析确认删除；
//   - math 块/行内扩展（aw/pwe/mwe/ow/sw）——复用 marked 的 fences
//     tokenizer 识别 ```math，`\[...\]`/`$$...$$` 块与 `\(...\)`/`$...$` 行内；
//   - codexMarkedOptions（hwe）：KS directive + skillMention + codexAutolink
//     （`codex://`，直调 marked Lexer 原型的 url tokenizer——锁版本脆弱点）
//     + math 的组合选项集；
//   - inboxItemsMarked（vwe）与 `:::inbox-item` 提取（ywe/uw/bwe）。
//
// 共享约束：codexDirectiveExtension 必须与 writing-blocks 共用同一实例
// （见 codex-directives.ts 头注）。

import { vl as isValidPath } from "@chunk/shared";
import { AS as Marked, wS as Lexer } from "../vendor/marked";
import {
  codexDirectiveExtension,
  preprocessDirectiveSource,
  applyDirectiveTokenPostProcessing,
} from "./codex-directives";

// ---------------------------------------------------------------------------
// skill-mention / 文件引用正则
// ---------------------------------------------------------------------------

/** skill-mention：`$[...]` 或 `$name[:name]`（原 iw）。 */
const SKILL_MENTION_PATTERN = String.raw`\$(?:\[[^\]\n]+\]|[A-Za-z][\w-]*(?::[A-Za-z][\w-]*)?)`;
/** 文件引用：`@name/path`（原 uwe）。 */
const FILE_REFERENCE_PATTERN = String.raw`@[A-Za-z0-9][\w.-]*[\\/][\w./-]*`;

// 原版 56,091 有一行丢弃的 `RegExp(\`${iw}|${uwe}\`, 'g')` 表达式（构造后
// 未使用，重构残留）——重写时删除（深析 §7.8 确认安全）。

/** skill-mention 起始正则（原 dwe）。 */
const SKILL_MENTION_START = RegExp(`^${SKILL_MENTION_PATTERN}`);

/** 提取文本开头的 skill-mention（无则 null，原 fwe）。 */
export function extractSkillMention(text: string) {
  return SKILL_MENTION_START.exec(text)?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// math 扩展（aw/pwe/mwe/ow/sw）
// ---------------------------------------------------------------------------

/** math 定界符匹配（原 ow）：open 为 null 时在行首找开定界符，否则找闭。 */
function matchMathDelimiter(open: string | null, line: string): string | null {
  if (open == null) {
    let match = line.match(/^ {0,3}(\\\[|\${2,})(.*)$/);
    if (match == null) return null;
    let [, delimiter, rest] = match;
    return rest.includes(delimiter === `\\[` ? `]` : `$`) ? null : delimiter === `\\[` ? `\\]` : delimiter;
  }
  let close = line.match(/^ {0,3}(\\\]|\${2,})[ \t]*$/)?.[1];
  return close != null && (open === `\\]` ? close === open : close.startsWith(`$`) && close.length >= open.length)
    ? null
    : open;
}

/** math 块 tokenizer（原 pwe）：首行开定界符，逐行找闭；缩进按首行剥除。 */
function tokenizeMathBlock(source: string) {
  let firstLine = source.split("\n", 1)[0];
  let open = matchMathDelimiter(null, firstLine);
  if (open == null) return;
  let closeIndex = source.length;
  let endIndex = source.length;
  for (let match of source.matchAll(/\n([^\n]*)/g)) {
    if (matchMathDelimiter(open, match[1]) == null) {
      closeIndex = match.index!;
      endIndex = match.index! + match[0].length;
      break;
    }
  }
  let indent = firstLine.length - firstLine.trimStart().length;
  let body = source.slice(firstLine.length + 1, closeIndex);
  return {
    type: `math`,
    raw: source.slice(0, endIndex),
    text: indent === 0 ? body : body.replace(RegExp(`^ {0,${indent}}`, `gm`), ``),
    display: true,
  };
}

/** math 行内 tokenizer（原 mwe）：`\(...\)` / `\[...\]` / `$$...$$` / `$...$`。 */
function tokenizeInlineMath(source: string) {
  let open = source.match(/^(?:\\\(|\\\[|\${2,})/)?.[0];
  if (open == null) return;
  let close = open;
  if (open === `\\(`) close = `\\)`;
  else if (open === `\\[`) close = `\\]`;
  let closeIndex = -1;
  if (open.startsWith(`$`)) {
    for (let match of source.matchAll(/\$+/g)) {
      if (match.index! > 0 && match[0].length === open.length) {
        closeIndex = match.index!;
        break;
      }
    }
  } else {
    closeIndex = source.indexOf(close, open.length);
  }
  if (closeIndex !== -1) {
    return {
      type: `math`,
      raw: source.slice(0, closeIndex + close.length),
      text: source.slice(open.length, closeIndex).trim(),
      display: false,
    };
  }
}

/** 块级 math 的 start 扫描（原 sw）：找行首 math 开定界符的换行偏移。 */
function findMathBlockStart(source: string) {
  for (let match of source.matchAll(/\n( {0,3}(?:\\\[|\${2,})[^\n]*)/g))
    if (matchMathDelimiter(null, match[1]) != null) return match.index! + 1;
}

/** math 扩展（原 aw）：块级复用 fences 的 ```math，行内按定界符对。 */
const mathExtension = {
  tokenizer: {
    // lheading 禁用 setext 标题（`$$` 行尾会被误判为 `---` 分隔）。
    lheading(this: any, source: string) {
      let match = this.rules.block.lheading.exec(source);
      return match == null || findMathBlockStart(match[0]) != null ? undefined : false;
    },
  },
  extensions: [
    {
      name: `math`,
      level: `block`,
      start(source: string) {
        return findMathBlockStart(source);
      },
      tokenizer(this: any, source: string) {
        let fences = this.lexer.options.tokenizer?.fences(source);
        return fences?.lang?.split(/\s/, 1)[0] === `math`
          ? { type: `math`, raw: fences.raw, text: fences.text, display: true }
          : tokenizeMathBlock(source);
      },
    },
    {
      name: `math`,
      level: `inline`,
      start(source: string) {
        let index = source.search(/\\(?:\(|\[)|\${2,}/);
        return index === -1 ? undefined : index;
      },
      tokenizer(this: any, source: string, tokens: any[]) {
        let previous = tokens.at(-1);
        if (!(source.startsWith(`$`) && previous?.raw.endsWith(`$`) && previous.type !== `escape`))
          return tokenizeInlineMath(source);
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// codex-file-citation（cw/_we/lw/cwe/lwe/gwe）
// ---------------------------------------------------------------------------

/** 引用路径解码（原 cwe）：`F:` 前缀强制按文件解释，否则须是合法路径。 */
function parseCitationPath(raw: string) {
  let isFileReference = raw.startsWith(`F:`);
  let decoded = decodeUriSafe(isFileReference ? raw.slice(2).trim() : raw);
  return isFileReference ? (decoded.length > 0 ? decoded : null) : isValidPath(decoded) ? decoded : null;
}

/** decodeURI 容错（原 lwe）。 */
function decodeUriSafe(value: string) {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

/** `【path†L12(-L34)】` 解析（原 cw）。 */
export function parseFileCitation(source: string) {
  if (!source.startsWith(`【`)) return;
  let markerIndex = source.indexOf(`†L`, 1);
  if (markerIndex === -1) return;
  let closeIndex = source.indexOf(`】`, markerIndex + 2);
  if (closeIndex === -1) return;
  let pathText = source.slice(1, markerIndex).trim();
  if (pathText.length === 0 || pathText.includes(`
`)) return;
  let lineRange = parseLineRange(source.slice(markerIndex + 2, closeIndex));
  let path = parseCitationPath(pathText);
  if (lineRange != null && path != null)
    return {
      fullText: source.slice(0, closeIndex + 1),
      path,
      lineRangeStart: lineRange.start,
      lineRangeEnd: lineRange.end,
    };
}

/** `12` 或 `12-34` 行号解析（原 _we）。 */
function parseLineRange(text: string) {
  let startDigits = 0;
  for (; isDigit(text.charCodeAt(startDigits)); ) startDigits += 1;
  if (startDigits === 0) return;
  let start = Number.parseInt(text.slice(0, startDigits), 10);
  if (startDigits === text.length) return { start };
  if (!text.startsWith(`-L`, startDigits)) return;
  let endOffset = startDigits + 2;
  let endDigits = endOffset;
  for (; isDigit(text.charCodeAt(endDigits)); ) endDigits += 1;
  if (endDigits === text.length && endDigits !== endOffset)
    return { start, end: Number.parseInt(text.slice(endOffset, endDigits), 10) };
}

/** ASCII 数字（原 lw）。 */
function isDigit(code: number) {
  return code >= 48 && code <= 57;
}

/** citation 起始扫描（原 gwe）：逐个 `【` 试解析。 */
function findFileCitationStart(source: string) {
  let index = source.indexOf(`【`);
  for (; index !== -1; ) {
    if (parseFileCitation(source.slice(index)) != null) return index;
    index = source.indexOf(`【`, index + 1);
  }
}

// ---------------------------------------------------------------------------
// codex marked 选项集（hwe）与 inbox 提取（vwe/ywe/uw/bwe）
// ---------------------------------------------------------------------------

/**
 * codex marked 选项集（原 hwe）：breaks + gfm + KS directive 扩展 +
 * skillMention（`$[...]` 不进 del/强调解析）+ codexAutolink（`codex://` 借
 * marked Lexer 原型 url tokenizer 解析——升级 marked 版本前必须核对
 * `Lexer.prototype.url.call` 调用点）+ math。
 */
export const codexMarkedOptions = {
  breaks: true,
  gfm: true,
  tokenizer: {
    ...mathExtension.tokenizer,
    // del 禁用 `~~`（与 math 的 `$$` 行为对齐，只保留单 `~`）。
    del(this: any, source: string) {
      return !source.startsWith(`~~`) && undefined;
    },
  },
  extensions: [
    ...(codexDirectiveExtension.extensions ?? []),
    {
      name: `skillMention`,
      level: `inline`,
      start(source: string) {
        return source.indexOf(`$`);
      },
      tokenizer(source: string) {
        let mention = extractSkillMention(source);
        if (mention != null && mention.includes(`:`)) return { type: `text`, raw: mention, text: mention };
      },
    },
    {
      name: `codexAutolink`,
      level: `inline`,
      start(source: string) {
        return source.search(/\bcodex:\/\//i);
      },
      tokenizer(this: any, source: string) {
        let tokenizer = this.lexer.options.tokenizer;
        if (
          !/^codex:\/\//i.test(source) ||
          this.lexer.state.inLink ||
          this.lexer.state.inRawBlock ||
          tokenizer == null
        )
          return;
        // 锁版本调用点：直调 marked v13 Lexer 原型的 url tokenizer，把
        // `codex://x` 当 `https://x` 解析后回写原 scheme。
        let urlToken = Lexer.prototype.url.call(tokenizer, `https://${source.slice(8)}`);
        if (urlToken == null) return;
        let raw = source.slice(0, urlToken.raw.length);
        return {
          type: `link`,
          raw,
          href: raw,
          text: raw,
          tokens: [{ type: `text`, raw, text: raw }],
        };
      },
    },
    ...(mathExtension.extensions ?? []),
    {
      name: `codexDirective`,
      level: `inline`,
      start(source: string) {
        return findFileCitationStart(source);
      },
      tokenizer(source: string) {
        let citation = parseFileCitation(source);
        if (citation != null)
          return {
            type: `codexDirective`,
            raw: citation.fullText,
            name: `codex-file-citation`,
            attributes: {
              path: citation.path,
              line_range_start: String(citation.lineRangeStart),
              ...(citation.lineRangeEnd == null ? {} : { line_range_end: String(citation.lineRangeEnd) }),
            },
            block: false,
          };
      },
    },
  ],
};

/** inbox/citation 用 Marked 实例（原 vwe，模块加载期构造，无副作用）。 */
export const inboxItemsMarked = new Marked(codexMarkedOptions);

/**
 * 从 agent 消息文本提取 `:::inbox-item` 条目（原 ywe）：无显式 id 的多条按
 * `<conversationId>-<N>` 生成；id 重复时后者丢弃。返回
 * { id, title, description } 列表。
 */
export function extractInboxItems(conversationId: string, text: string) {
  let tokens = inboxItemsMarked.lexer(preprocessDirectiveSource(text), undefined);
  applyDirectiveTokenPostProcessing(tokens);
  let directives: any[] = [];
  collectInboxItemDirectives(tokens, directives);
  let seenIds = new Set<string>();
  return directives.reduce((items: any[], directive: any, index: number) => {
    let attributes: Record<string, string> = {};
    for (let [key, value] of Object.entries(directive.attributes))
      attributes[key] = value === true ? `true` : value;
    let explicitId = attributes.id?.trim() ?? null;
    let fallbackId = directives.length > 1 && explicitId == null ? `${conversationId}-${index + 1}` : conversationId;
    let id = explicitId?.length ? explicitId : fallbackId;
    return seenIds.has(id)
      ? items
      : (seenIds.add(id),
        items.push({
          id,
          title: attributes.title ?? null,
          description: attributes.summary ?? attributes.description ?? attributes.subtitle ?? null,
        }),
        items);
  }, []);
}

/** 递归收集 inbox-item directive token（原 uw）。 */
function collectInboxItemDirectives(tokens: any[], out: any[]) {
  for (let token of tokens) {
    isInboxItemDirective(token) && out.push(token);
    `tokens` in token && Array.isArray(token.tokens) && collectInboxItemDirectives(token.tokens, out);
  }
}

/** token 是否为 `:::inbox-item` directive（原 bwe）。 */
function isInboxItemDirective(token: any) {
  return (
    token.type === `codexDirective` &&
    `name` in token &&
    token.name === `inbox-item` &&
    `attributes` in token &&
    token.attributes != null &&
    typeof token.attributes == `object`
  );
}
