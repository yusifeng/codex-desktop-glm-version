// Lowlight syntax-highlighting runtime. Release chunk: lowlight-62906d2993ab.js.
import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import * as lowlightCoreChunk from "@rchunk/lowlight-core";

interface TextNode {
  type: "text";
  value: string;
}
interface ElementNode {
  type: "element";
  tagName: "span";
  properties: { className: string[] };
  children: HastNode[];
}
interface RootNode {
  type: "root";
  children: HastNode[];
  data: { language: string | undefined; relevance: number };
}
type HastNode = TextNode | ElementNode;
type LanguageDefinition = (core: unknown) => unknown;
interface HighlightResult {
  language?: string;
  relevance: number;
  errorRaised?: unknown;
  _emitter: LowlightEmitter;
}
interface HighlightCore {
  getLanguage(name: string): unknown;
  configure(options: {
    __emitter: typeof LowlightEmitter;
    classPrefix: string;
  }): void;
  highlight(
    code: string,
    options: { ignoreIllegals: true; language: string },
  ): HighlightResult;
  listLanguages(): string[];
  registerLanguage(name: string, definition: LanguageDefinition): void;
  registerAliases(
    aliases: string | string[],
    options: { languageName: string },
  ): void;
}
interface LowlightCoreRuntime {
  n(): void;
  t: { newInstance(): HighlightCore };
}
interface LowlightOptions {
  prefix?: string;
  subset?: string[];
}
type LanguageMap = Record<string, LanguageDefinition>;
type AliasMap = Record<string, string | string[]>;

const { n: initializeLowlightCore, t: highlightCore } =
  lowlightCoreChunk as unknown as LowlightCoreRuntime;
const defaultPrefix = "hljs-";

class LowlightEmitter {
  readonly root: RootNode = {
    type: "root",
    children: [],
    data: { language: undefined, relevance: 0 },
  };
  private readonly stack: Array<RootNode | ElementNode> = [this.root];

  constructor(private readonly options: { classPrefix: string }) {}

  addText(value: string): void {
    if (value === "") return;
    const parent = this.stack[this.stack.length - 1];
    if (!parent) return;
    const previous = parent.children[parent.children.length - 1];
    if (previous?.type === "text") previous.value += value;
    else parent.children.push({ type: "text", value });
  }

  startScope(scope: unknown): void {
    this.openNode(String(scope));
  }

  endScope(): void {
    this.closeNode();
  }

  __addSublanguage(
    emitter: LowlightEmitter,
    language: string | undefined,
  ): void {
    const parent = this.stack[this.stack.length - 1];
    if (!parent) return;
    if (language) {
      parent.children.push({
        type: "element",
        tagName: "span",
        properties: { className: [language] },
        children: emitter.root.children,
      });
    } else parent.children.push(...emitter.root.children);
  }

  openNode(scope: string): void {
    const className = scope
      .split(".")
      .map((part, index) =>
        index === 0
          ? this.options.classPrefix + part
          : part + "_".repeat(index),
      );
    const parent = this.stack[this.stack.length - 1];
    if (!parent) return;
    const node: ElementNode = {
      type: "element",
      tagName: "span",
      properties: { className },
      children: [],
    };
    parent.children.push(node);
    this.stack.push(node);
  }

  closeNode(): void {
    this.stack.pop();
  }

  finalize(): void {}
  toHTML(): string {
    return "";
  }
}

function createLowlight(initialLanguages?: LanguageMap) {
  const core = highlightCore.newInstance();
  if (initialLanguages) register(initialLanguages);

  function highlight(
    language: string,
    code: string,
    options: LowlightOptions = {},
  ): RootNode {
    const prefix =
      typeof options.prefix === "string" ? options.prefix : defaultPrefix;
    if (!core.getLanguage(language)) {
      throw new Error("Unknown language: " + language + " is not registered");
    }
    core.configure({ __emitter: LowlightEmitter, classPrefix: prefix });
    const result = core.highlight(code, { ignoreIllegals: true, language });
    if (result.errorRaised) {
      throw new Error("Could not highlight with Highlight.js", {
        cause: result.errorRaised,
      });
    }
    const root = result._emitter.root;
    root.data.language = result.language;
    root.data.relevance = result.relevance;
    return root;
  }

  function highlightAuto(
    code: string,
    options: LowlightOptions = {},
  ): RootNode {
    const subset = options.subset ?? listLanguages();
    let bestRelevance = 0;
    let best: RootNode | undefined;
    for (const language of subset) {
      if (!core.getLanguage(language)) continue;
      const candidate = highlight(language, code, options);
      if (candidate.data.relevance > bestRelevance) {
        bestRelevance = candidate.data.relevance;
        best = candidate;
      }
    }
    return (
      best ?? {
        type: "root",
        children: [],
        data: { language: undefined, relevance: bestRelevance },
      }
    );
  }

  function listLanguages(): string[] {
    return core.listLanguages();
  }

  function register(name: string, definition: LanguageDefinition): void;
  function register(languages: LanguageMap): void;
  function register(
    nameOrLanguages: string | LanguageMap,
    definition?: LanguageDefinition,
  ): void {
    if (typeof nameOrLanguages === "string") {
      if (definition) core.registerLanguage(nameOrLanguages, definition);
      return;
    }
    for (const [name, languageDefinition] of Object.entries(nameOrLanguages)) {
      core.registerLanguage(name, languageDefinition);
    }
  }

  function registerAlias(language: string, aliases: string | string[]): void;
  function registerAlias(aliases: AliasMap): void;
  function registerAlias(
    languageOrAliases: string | AliasMap,
    aliases?: string | string[],
  ): void {
    if (typeof languageOrAliases === "string") {
      if (aliases) {
        core.registerAliases(
          typeof aliases === "string" ? aliases : [...aliases],
          { languageName: languageOrAliases },
        );
      }
      return;
    }
    for (const [language, languageAliases] of Object.entries(
      languageOrAliases,
    )) {
      core.registerAliases(
        typeof languageAliases === "string"
          ? languageAliases
          : [...languageAliases],
        { languageName: language },
      );
    }
  }

  function registered(language: string): boolean {
    return Boolean(core.getLanguage(language));
  }

  return {
    highlight,
    highlightAuto,
    listLanguages,
    register,
    registerAlias,
    registered,
  };
}

initializeLowlightCore();

export { createLowlight };
