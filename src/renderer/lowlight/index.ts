// Converts lowlight syntax trees into inline annotations. Release chunk: lowlight-7c9b2445f652.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

interface TextNode {
  type: "text";
  value: string;
}

interface ElementNode {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: SyntaxNode[];
}

interface OtherNode {
  type: string;
}

type SyntaxNode = TextNode | ElementNode | OtherNode;
interface SyntaxRoot {
  children: SyntaxNode[];
}
interface InlineAnnotationFactory {
  inline(
    start: number,
    end: number,
    properties: Record<string, unknown>,
  ): unknown;
}
interface SharedRuntime {
  KZ: InlineAnnotationFactory;
  YZ(): void;
}
interface Lowlight {
  highlight(language: string, content: string): SyntaxRoot;
  highlightAuto(content: string): SyntaxRoot;
}
interface ParseInput {
  content: string;
  language?: string | null;
  pos: number;
}

const sharedRuntime = appSharedChunk as unknown as SharedRuntime;

function visitChildren(
  annotations: unknown[],
  root: SyntaxRoot,
  offset: number,
): void {
  for (const child of root.children) {
    offset = visitNode(annotations, child, offset);
  }
}

function visitNode(
  annotations: unknown[],
  node: SyntaxNode,
  offset: number,
): number {
  if (node.type === "element") {
    const element = node as ElementNode;
    const end = offset + elementTextLength(element);
    const { className, ...properties } = element.properties ?? {};
    annotations.push(
      sharedRuntime.KZ.inline(offset, end, {
        class: className
          ? Array.isArray(className)
            ? className.join(" ")
            : String(className)
          : undefined,
        ...properties,
        nodeName: element.tagName,
      }),
    );
    return end;
  }
  return node.type === "text"
    ? offset + (node as TextNode).value.length
    : offset;
}

function elementTextLength(element: ElementNode): number {
  let length = 0;
  for (const child of element.children) length += nodeTextLength(child);
  return length;
}

function nodeTextLength(node: SyntaxNode): number {
  switch (node.type) {
    case "element":
      return elementTextLength(node as ElementNode);
    case "text":
      return (node as TextNode).value.length;
    default:
      return 0;
  }
}

let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  sharedRuntime.YZ();
}

function createParser(lowlight: Lowlight): (input: ParseInput) => unknown[] {
  return ({ content, language, pos }) => {
    const tree = language
      ? lowlight.highlight(language, content)
      : lowlight.highlightAuto(content);
    const annotations: unknown[] = [];
    visitChildren(annotations, tree, pos + 1);
    return annotations;
  };
}

initialize();

export { createParser };
