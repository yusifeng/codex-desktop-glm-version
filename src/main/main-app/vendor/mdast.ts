// mdast / micromark 工具链缝合层。
//
// 原版在 main-C-Mhak1n.ts 21,000-26,445 内嵌了完整的 vendored micromark
// 生态（micromark 主体 + character-entities + mdast-util-from-markdown +
// mdast-util-to-string + gfm/directive 扩展）。R3 应用层的 markdown 纯文本化
// （26,445-26,560，本目录 plain-text.ts）消费其中 6 个入口：
//
//   Jfe  (24,240) = mdast-util-from-markdown 的 fromMarkdown
//   lf   (21,631) = mdast-util-to-string 的 toString
//   Bpe  (25,132) = mdast-util-gfm 的 fromMarkdown（gfm mdast 扩展工厂）
//   Wue  (21,538) = mdast-util-directive 的 fromMarkdown（directive mdast 扩展工厂）
//   sme  (25,535) = micromark-extension-directive 的 directive()
//   zme  (26,442) = micromark-extension-gfm 的 gfm()
//
// 重写决策：micromark 带整体引上游 npm 包（合同 §vendored 带），本文件做
// 单一缝合点。包尚未 install，@ts-nocheck；切换后移除并补精确类型。

// @ts-nocheck
import { fromMarkdown as mdastFromMarkdown } from "mdast-util-from-markdown";
import { toString as mdastToString } from "mdast-util-to-string";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { directiveFromMarkdown } from "mdast-util-directive";
import { directive } from "micromark-extension-directive";
import { gfm } from "micromark-extension-gfm";

export type MdastNode = any;

/** 原版 Jfe：markdown 文本 → mdast 树（micromark + 扩展）。 */
export const fromMarkdown: (
  value: string,
  options?: { extensions?: unknown[]; mdastExtensions?: unknown[] },
) => MdastNode = mdastFromMarkdown;

/** 原版 lf：mdast 节点 → 纯文本（默认含 image alt、不含 html）。 */
export const mdastNodeToString: (node: MdastNode, options?: unknown) => string = mdastToString;

/** 原版 Bpe()：gfm 的 mdast 扩展（table/strikethrough/autolink/tasklist）。 */
export const createGfmMdastExtension: () => unknown = gfmFromMarkdown;

/** 原版 Wue()：directive（::name）的 mdast 扩展。 */
export const createDirectiveMdastExtension: () => unknown = directiveFromMarkdown;

/** 原版 sme()：directive 的 micromark 扩展（text/flow 的 ':' 构造）。 */
export const createDirectiveMicromarkExtension: (options?: unknown) => unknown = directive;

/** 原版 zme()：gfm 的 micromark 扩展组合工厂。 */
export const createGfmMicromarkExtension: (options?: unknown) => unknown = gfm;
