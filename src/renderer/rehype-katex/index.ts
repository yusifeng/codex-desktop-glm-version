// Rehype transformer for KaTeX math nodes. Release chunk: rehype-katex-afac91f609b4.js.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as katexChunk from "@rchunk/katex-runtime";
import * as hastRuntimeChunk from "@rchunk/rehype-katex-runtime-lib";

interface TextNode {
  type: "text";
  value: string;
  position?: unknown;
}
interface CommentNode {
  type: "comment";
  value: string;
  position?: unknown;
}
interface ElementNode {
  type: "element";
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
  position?: unknown;
}
interface RootNode {
  type: "root";
  children: HastNode[];
}
interface DoctypeNode {
  type: "doctype";
}
type HastNode = TextNode | CommentNode | ElementNode | RootNode | DoctypeNode;
interface VFile {
  message(
    reason: string,
    options: {
      ancestors: HastNode[];
      cause: unknown;
      place: unknown;
      ruleId: string;
      source: string;
    },
  ): void;
}
interface KatexOptions extends Record<string, unknown> {
  errorColor?: string;
  afterTransform?(source: Node, result: HastNode): void;
}
interface InitialRuntime {
  CCn(): void;
  ECn(): void;
  SCn: unknown;
  wCn(
    tree: HastNode,
    test: string,
    visitor: (node: ElementNode, ancestors: HastNode[]) => unknown,
  ): void;
}
interface KatexRuntime {
  c(): void;
  l: {
    renderToString(
      content: string,
      options: Record<string, unknown>,
    ): string | HastNode[];
  };
}
interface HastRuntime {
  n(): void;
  r(
    tagName: string,
    properties: Record<string, string>,
    children: HastNode[],
  ): HastNode;
  t(
    tagName: string,
    properties: Record<string, string>,
    children: HastNode[],
  ): HastNode;
}

const initialRuntime = appInitialChunk as unknown as InitialRuntime;
const katexRuntime = katexChunk as unknown as KatexRuntime;
const hastRuntime = hastRuntimeChunk as unknown as HastRuntime;
const namespaces = {
  html: "http://www.w3.org/1999/xhtml",
  mathml: "http://www.w3.org/1998/Math/MathML",
  svg: "http://www.w3.org/2000/svg",
};
let domParser: DOMParser;

function domToHast(
  node: Node,
  options: KatexOptions = {},
): HastNode | undefined {
  let result: HastNode | undefined;
  switch (node.nodeType) {
    case Node.ELEMENT_NODE: {
      const element = node as Element;
      const namespace = element.namespaceURI;
      const createElement =
        namespace === namespaces.svg ? hastRuntime.r : hastRuntime.t;
      const tagName =
        namespace === namespaces.html
          ? element.tagName.toLowerCase()
          : element.tagName;
      const childSource =
        namespace === namespaces.html && tagName === "template"
          ? (element as HTMLTemplateElement).content
          : element;
      const properties: Record<string, string> = {};
      for (const name of element.getAttributeNames())
        properties[name] = element.getAttribute(name) ?? "";
      result = createElement(
        tagName,
        properties,
        childrenToHast(childSource, options),
      );
      break;
    }
    case Node.TEXT_NODE:
      result = { type: "text", value: node.nodeValue ?? "" };
      break;
    case Node.COMMENT_NODE:
      result = { type: "comment", value: node.nodeValue ?? "" };
      break;
    case Node.DOCUMENT_NODE:
    case Node.DOCUMENT_FRAGMENT_NODE:
      result = { type: "root", children: childrenToHast(node, options) };
      break;
    case Node.DOCUMENT_TYPE_NODE:
      result = { type: "doctype" };
  }
  if (result && options.afterTransform) options.afterTransform(node, result);
  return result;
}

function childrenToHast(node: Node, options: KatexOptions): HastNode[] {
  const children: HastNode[] = [];
  for (const child of node.childNodes) {
    const transformed = domToHast(child, options);
    if (transformed) children.push(transformed);
  }
  return children;
}

function parseHtml(html: string, fragment = false): RootNode {
  const source: Node = fragment
    ? (() => {
        const template = document.createElement("template");
        template.innerHTML = html;
        return template.content;
      })()
    : domParser.parseFromString(html, "text/html");
  return (
    (domToHast(source) as RootNode | undefined) ?? {
      type: "root",
      children: [],
    }
  );
}

const hiddenTags = new Set([
  "datalist",
  "head",
  "noembed",
  "noframes",
  "noscript",
  "rp",
  "script",
  "style",
  "template",
  "title",
]);
const blockTags = new Set(
  "address article aside blockquote body caption center dd dialog dir dl dt div figure figcaption footer form h1 h2 h3 h4 h5 h6 header hgroup hr html legend li listing main menu nav ol p plaintext pre section ul xmp".split(
    " ",
  ),
);

function mathText(
  node: HastNode,
  whitespace: "normal" | "pre" = "normal",
): string {
  if (node.type === "text") {
    const clean = node.value.replace(
      /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,
      "",
    );
    return whitespace === "pre" ? clean : clean.replace(/[\t ]+/g, " ");
  }
  if (node.type === "comment" || node.type === "doctype") return "";
  if (node.type === "root")
    return node.children.map((child) => mathText(child, whitespace)).join("");
  const properties = node.properties ?? {};
  if (
    properties.hidden ||
    hiddenTags.has(node.tagName) ||
    (node.tagName === "dialog" && !properties.open)
  )
    return "";
  if (node.tagName === "br") return "\n";
  const nextWhitespace = ["listing", "plaintext", "xmp", "pre"].includes(
    node.tagName,
  )
    ? "pre"
    : whitespace;
  let content = node.children
    .map((child) => mathText(child, nextWhitespace))
    .join("");
  if (node.tagName === "td" || node.tagName === "th") content += "\t";
  if (blockTags.has(node.tagName)) content = `\n${content}\n`;
  return content;
}

function toText(
  node: HastNode,
  options: { whitespace?: "normal" | "pre" } = {},
): string {
  const value = mathText(node, options.whitespace ?? "normal");
  return options.whitespace === "pre"
    ? value
    : value.replace(/\s+/g, " ").trim();
}

const emptyOptions: KatexOptions = {};
const emptyClassNames: string[] = [];

function rehypeKatex(options?: KatexOptions) {
  const settings = options ?? emptyOptions;
  return (tree: HastNode, file: VFile): void => {
    initialRuntime.wCn(tree, "element", (node, ancestors) => {
      const classNames = Array.isArray(node.properties.className)
        ? (node.properties.className as string[])
        : emptyClassNames;
      const languageMath = classNames.includes("language-math");
      const displayMath = classNames.includes("math-display");
      const inlineMath = classNames.includes("math-inline");
      if (!languageMath && !displayMath && !inlineMath) return;
      let displayMode = displayMath;
      let replacementNode: HastNode = node;
      let parent = ancestors.at(-1);
      if (
        node.tagName === "code" &&
        languageMath &&
        parent?.type === "element" &&
        parent.tagName === "pre"
      ) {
        replacementNode = parent;
        parent = ancestors.at(-2);
        displayMode = true;
      }
      if (!parent || !("children" in parent)) return;
      const content = toText(replacementNode, { whitespace: "pre" });
      let rendered: string | HastNode[];
      try {
        rendered = katexRuntime.l.renderToString(content, {
          ...settings,
          displayMode,
          throwOnError: true,
        });
      } catch (error) {
        const cause = error as { name?: string };
        file.message("Could not render math with KaTeX", {
          ancestors: [...ancestors, node],
          cause: error,
          place: node.position,
          ruleId: (cause.name ?? "error").toLowerCase(),
          source: "rehype-katex",
        });
        try {
          rendered = katexRuntime.l.renderToString(content, {
            ...settings,
            displayMode,
            strict: "ignore",
            throwOnError: false,
          });
        } catch {
          rendered = [
            {
              type: "element",
              tagName: "span",
              properties: {
                className: ["katex-error"],
                style: `color:${settings.errorColor ?? "#cc0000"}`,
                title: String(error),
              },
              children: [{ type: "text", value: content }],
            },
          ];
        }
      }
      const replacement =
        typeof rendered === "string"
          ? parseHtml(rendered, true).children
          : rendered;
      const index = parent.children.indexOf(replacementNode);
      parent.children.splice(index, 1, ...replacement);
      return initialRuntime.SCn;
    });
  };
}

function initialize(): void {
  hastRuntime.n();
  domParser = new DOMParser();
  initialRuntime.ECn();
  katexRuntime.c();
  initialRuntime.CCn();
}
initialize();

export default rehypeKatex;
