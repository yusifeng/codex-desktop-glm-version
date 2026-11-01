// markdown → 纯文本化（线程标题提取用）。
//
// 原版 main-C-Mhak1n.ts 26,445-26,560。职责：
//   - Vp（plainTextFromMarkdown）：把任意 markdown 文本压成单行纯文本——
//     先剥离私有区占位符（\uE200…\uE201）与 directive 冒号，纯散文走快速
//     路径（只折叠空格），否则走完整 mdast 解析（gfm + directive 扩展），
//     递归提取文本并剥离 script/style/html 注释；
//   - Zme：给 gfm 扩展的 autolink previous 钩子打补丁（WeakMap 记忆 +
//     未闭合 labelLink/labelImage 判定），避免链接标签内被误判为 autolink；
//   - Hp/Qme：mdast 树递归纯文本化，跨 html 分片的未闭合 <script>/<style>
//     开标签用状态机跳过其后的子节点直到闭合分片。
//
// vendor parser 保持在发布 main chunk 内；本 owner 由组合根注入其七个真实入口，
// 避免重新打包一套 micromark 状态机或依赖发布包中不存在的裸 npm modules。

type MdastNode = any;

type PlainTextDependencies = {
  loadHtmlDomParserModule(): {
    parse(html: string): {
      querySelectorAll(selector: string): { remove(): void }[];
      structuredText: string;
    };
  };
  fromMarkdown(
    value: string,
    options?: { extensions?: unknown[]; mdastExtensions?: unknown[] },
  ): MdastNode;
  mdastNodeToString(node: MdastNode, options?: unknown): string;
  createGfmMdastExtension(): unknown;
  createDirectiveMdastExtension(): unknown;
  createDirectiveMicromarkExtension(options?: unknown): unknown;
  createGfmMicromarkExtension(options?: unknown): unknown;
};

type PlainTextRuntime = {
  plainTextFromMarkdown(input: string): string;
};

let configuredRuntime: PlainTextRuntime | null = null;

/** 纯散文判定：仅常见文字/标点字符，且不是列表项/有序标题形态。 */
const PLAIN_PROSE_PATTERN = /^[\p{L}\p{M}\p{N} .,!?'"’()-]+$/u;

/** 构造 markdown 文本 owner；vendor 入口全部来自发布 main chunk 的单一实例。 */
export function createMarkdownPlainTextRuntime(
  dependencies: PlainTextDependencies,
): PlainTextRuntime {
  const htmlDomParser = dependencies.loadHtmlDomParserModule();
  const patchedGfmExtension = createPatchedGfmExtension(
    dependencies.createGfmMicromarkExtension,
  );
  const mdastToPlainText = createMdastToPlainText(
    htmlDomParser,
    dependencies.mdastNodeToString,
  );

  function plainTextFromMarkdown(input: string): string {
    let stripped = stripPrivateUsePlaceholders(unescapeDirectives(input)).trim();
    if (stripped.length === 0) return ``;
    if (isPlainProseText(stripped)) return stripped.replace(/ +/g, ` `);
    return mdastToPlainText(
      dependencies.fromMarkdown(stripped, {
        extensions: [patchedGfmExtension, dependencies.createDirectiveMicromarkExtension()],
        mdastExtensions: [
          dependencies.createGfmMdastExtension(),
          dependencies.createDirectiveMdastExtension(),
        ],
      }),
    )
      .replace(/\s+/g, ` `)
      .trim();
  }

  return { plainTextFromMarkdown };
}

/** 组合根只配置一次；所有直接 import consumer 与通知 owner 共用该实例。 */
export function configureMarkdownPlainTextRuntime(dependencies: PlainTextDependencies) {
  configuredRuntime ??= createMarkdownPlainTextRuntime(dependencies);
  return configuredRuntime;
}

/** 线程目录/hydration/projection 的稳定兼容入口。 */
export function plainTextFromMarkdown(input: string): string {
  if (configuredRuntime == null)
    throw Error("Markdown plain-text runtime has not been configured");
  return configuredRuntime.plainTextFromMarkdown(input);
}

/** 纯散文快速路径判定（原版 Hme）。 */
function isPlainProseText(text: string): boolean {
  return (
    PLAIN_PROSE_PATTERN.test(text) &&
    !text.startsWith(`-`) &&
    !/^\d+[.)](?: |$)/.test(text)
  );
}

/**
 * directive 冒号还原（原版 Yme）：把行首 `::name`（后随 `[`/`{`）降级为
 * `:name`，避免被 directive 扩展解析；代码围栏内的行保持原样。状态机跨行
 * 维护围栏（开/闭标记与长度匹配，info string 内容参与判定）。
 */
function unescapeDirectives(text: string): string {
  if (!text.includes(`::`)) return text;
  let lines: string[] = [];
  let fence: { length: number; marker: string } | null = null;
  for (let line of text.split(`
`)) {
    let wasInFence = fence != null;
    fence = updateCodeFenceState(fence, line);
    lines.push(
      wasInFence || fence != null ? line : line.replace(DIRECTIVE_ESCAPE_PATTERN, `$1:$2`),
    );
  }
  return lines.join(`
`);
}

/** 围栏状态更新（原版 Ume）：开围栏记录长度+标记字符；闭围栏要求同标记、
 *  长度不小于开、且 info 为空；反引号围栏的 info 含反引号则视为文本。 */
function updateCodeFenceState(
  fence: { length: number; marker: string } | null,
  line: string,
): { length: number; marker: string } | null {
  let match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (match == null) return fence;
  let [, markers = ``, info = ``] = match;
  let marker = markers.startsWith("`") ? "`" : `~`;
  if (fence == null) {
    return marker === "`" && info.includes("`")
      ? null
      : { length: markers.length, marker };
  }
  return marker === fence.marker && markers.length >= fence.length && info.trim().length === 0
    ? null
    : fence;
}

/** 剥离私有使用区占位符（\uE200…\uE201 区段，原版 Xme）。 */
function stripPrivateUsePlaceholders(text: string): string {
  return text.replaceAll(/\uE200[^\uE201]*\uE201/g, ``);
}

// ---------------------------------------------------------------------------
// gfm autolink previous 补丁（原版 Zme + 模块级 Jme）
// ---------------------------------------------------------------------------

/**
 * 构建打了 autolink 补丁的 gfm micromark 扩展（原版 Zme）。
 *
 * gfm 的 wwwAutolink/protocolAutolink/emailAutolink construct 带 previous
 * 钩子（判定前一个字符是否允许启动 autolink）。补丁在原钩子之上增加：
 *   - WeakMap 记忆同一 events 数组上已判定的未闭合 labelLink/labelImage
 *     （_balanced 为假），避免重复倒序扫描；
 *   - 倒序扫描 events，遇到未闭合的 labelLink/labelImage 即拒绝 autolink
 *     （防止 `[www.example.com]` 的链接标签内被识别为字面 autolink）；
 *   - 扫到 _gfmAutolinkLiteralWalkedInto 标记即停（gfm 内部约定边界）。
 */
function createPatchedGfmExtension(createGfmMicromarkExtension: () => unknown): unknown {
  let extension = createGfmMicromarkExtension();
  let textConstructs = (extension as { text?: Record<string, unknown> }).text;
  if (textConstructs == null) return extension;
  let unbalancedLabelsByEvents = new WeakMap<object, { index: number; token: unknown }>();
  for (let [key, value] of Object.entries(textConstructs)) {
    if (value == null) continue;
    let constructs = (Array.isArray(value) ? value : [value]) as Array<{
      name?: string;
      previous?: (this: any, code: unknown) => boolean;
      [key: string]: unknown;
    }>;
    (textConstructs as Record<string, unknown>)[key] = constructs.map((construct) => {
      if (!construct.name?.endsWith(`Autolink`)) return construct;
      let originalPrevious = construct.previous;
      return {
        ...construct,
        previous(this: any, code: unknown) {
          if (originalPrevious != null && !originalPrevious.call(this, code)) return false;
          let remembered = unbalancedLabelsByEvents.get(this.events);
          if (
            remembered != null &&
            this.events[remembered.index]?.[1] === remembered.token &&
            !(remembered.token as { _balanced?: boolean })._balanced
          )
            return false;
          for (let index = this.events.length - 1; index >= 0; --index) {
            let token = this.events[index][1];
            if ((token.type === `labelLink` || token.type === `labelImage`) && !token._balanced) {
              unbalancedLabelsByEvents.set(this.events, { index, token });
              return false;
            }
            if (
              `_gfmAutolinkLiteralWalkedInto` in token &&
              token._gfmAutolinkLiteralWalkedInto === true
            )
              break;
          }
          return true;
        },
      };
    });
  }
  return extension;
}

// ---------------------------------------------------------------------------
// mdast 树 → 纯文本（原版 Hp/Qme）
// ---------------------------------------------------------------------------

/** 仅由 html 注释构成的分片（原版 Wme）。 */
const COMMENT_ONLY_HTML_PATTERN = /^(?:<!--(?:(?!-->)[\s\S])*-->\s*)+$/;
/** 行内 directive 转义：`::name`（后随 `[` 或 `{`）→ `:name`（原版 Gme）。 */
const DIRECTIVE_ESCAPE_PATTERN = /(^|[^:])::([A-Za-z][A-Za-z0-9_-]*)(?=[[{])/g;
/** script/style 闭合标签（原版 Bp）。 */
const CLOSING_TAG_PATTERNS: Record<'script' | 'style', RegExp> = {
  script: /<\/\s*script\s*>/i,
  style: /<\/\s*style\s*>/i,
};
/** script/style 开标签（原版 Kme）。 */
const OPENING_TAG_PATTERN = /<\s*(script|style)\b[^>]*>/i;
/** 块级容器节点类型：子节点文本之间以空格连接（原版 qme）。 */
const BLOCK_CONTAINER_TYPES = new Set([
  `root`,
  `blockquote`,
  `list`,
  `listItem`,
  `table`,
  `tableRow`,
  `tableCell`,
  `containerDirective`,
]);

/**
 * mdast 节点 → 纯文本（原版 Hp）。
 *
 * - html 节点：纯注释分片返回空串；否则用 HTML DOM parser 解析，移除
 *   script/style 元素后取 structuredText；
 * - 父节点：跳过未闭合 script/style 开标签之后的兄弟节点（跨分片状态机），
 *   子节点文本按容器类型以空格或空串连接；
 * - 叶子节点：mdast-util-to-string。
 */
function createMdastToPlainText(
  htmlDomParser: ReturnType<PlainTextDependencies["loadHtmlDomParserModule"]>,
  mdastNodeToString: PlainTextDependencies["mdastNodeToString"],
) {
  function mdastToPlainText(node: MdastNode): string {
    if (node.type === `html`) {
      if (COMMENT_ONLY_HTML_PATTERN.test(node.value.trim())) return ``;
      let document = htmlDomParser.parse(node.value);
      for (let element of [
        ...document.querySelectorAll(`script`),
        ...document.querySelectorAll(`style`),
      ])
        element.remove();
      return document.structuredText;
    }
    if (`children` in node) {
      let parts: string[] = [];
      let openTagKind: 'script' | 'style' | null = null;
      for (let child of node.children) {
        if (openTagKind != null) {
          // 处于未闭合的 script/style 内：只找闭合分片，其余跳过。
          if (child.type === `html` && CLOSING_TAG_PATTERNS[openTagKind].test(child.value))
            openTagKind = null;
          continue;
        }
        if (child.type === `html` && (openTagKind = openingTagKind(child.value)) != null) continue;
        parts.push(mdastToPlainText(child));
      }
      return parts.join(BLOCK_CONTAINER_TYPES.has(node.type) ? ` ` : ``);
    }
    return mdastNodeToString(node);
  }
  return mdastToPlainText;
}

/**
 * html 分片是否是「未闭合的 script/style 开标签」（原版 Qme）：
 * 匹配到开标签、非自闭合、且分片内没有对应的闭合标签时返回标签名。
 */
function openingTagKind(html: string): 'script' | 'style' | null {
  let match = OPENING_TAG_PATTERN.exec(html);
  let openingTag = match?.[0];
  let tagName = match?.[1];
  return tagName !== `script` && tagName !== `style`
    ? null
    : openingTag == null || openingTag.endsWith(`/>`) || CLOSING_TAG_PATTERNS[tagName].test(html)
      ? null
      : tagName;
}
