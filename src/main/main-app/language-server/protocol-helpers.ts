/** Pure protocol/path adapters used by the language-server manager. */

type PathApi = {
  sep: string;
  normalize(path: string): string;
};

type UriApi = {
  parse(value: string): { authority: string; path: string };
  from(value: { authority?: string; path: string; scheme: string }): { toString(): string };
};

export function resolveCapabilities(capabilities: any) {
  const locationKinds: string[] = [];
  if (capabilities?.definitionProvider) locationKinds.push("definition");
  if (capabilities?.implementationProvider) locationKinds.push("implementation");
  if (capabilities?.referencesProvider) locationKinds.push("references");
  if (capabilities?.typeDefinitionProvider) locationKinds.push("typeDefinition");
  return { hover: !!capabilities?.hoverProvider, locationKinds };
}

export function filePathToUri(path: string, pathApi: PathApi, uriApi: UriApi): string {
  const normalized = pathApi.sep === "/" ? path : path.replaceAll("\\", "/");
  if (normalized.startsWith("//")) {
    const slash = normalized.indexOf("/", 2);
    return uriApi.from({
      authority: slash === -1 ? normalized.slice(2) : normalized.slice(2, slash),
      path: slash === -1 ? "/" : normalized.slice(slash),
      scheme: "file",
    }).toString();
  }
  return uriApi.from({
    path: pathApi.sep === "/" || normalized.startsWith("/") ? normalized : `/${normalized}`,
    scheme: "file",
  }).toString();
}

export function uriToFilePath(value: string, pathApi: PathApi, uriApi: UriApi): string {
  const parsed = uriApi.parse(value);
  if (pathApi.sep === "/") return parsed.authority === "" ? parsed.path : `//${parsed.authority}${parsed.path}`;
  if (parsed.authority !== "") return pathApi.normalize(`\\\\${parsed.authority}${parsed.path.replaceAll("/", "\\")}`);
  const path = parsed.path.replaceAll("/", "\\");
  return pathApi.normalize(/^\\[A-Za-z]:/.test(path) ? path.slice(1) : path);
}

export function resolveLocations(items: any, pathApi: PathApi, uriApi: UriApi) {
  if (items == null) return [];
  return (Array.isArray(items) ? items : [items]).map((item) =>
    "targetUri" in item
      ? { path: uriToFilePath(item.targetUri, pathApi, uriApi), range: item.targetSelectionRange }
      : { path: uriToFilePath(item.uri, pathApi, uriApi), range: item.range },
  );
}

export function normalizeHover(contents: any, position: any, isMarkupContent: (value: any) => boolean) {
  const { documentation, signature } = parseHoverContents(contents, isMarkupContent);
  return { documentation, range: contents?.range ?? { end: position, start: position }, signature };
}

function parseHoverContents(contents: any, isMarkupContent: (value: any) => boolean) {
  if (Array.isArray(contents)) {
    const values = contents.map((value) =>
      typeof value === "string" ? value : `\`\`\`${value.language}\n${value.value}\n\`\`\``,
    );
    const joined = values.join("\n\n");
    if (joined.includes("```")) return parseMarkdownHover(joined);
    const [signature = "", ...rest] = values;
    return { documentation: rest.join("\n\n") || null, signature };
  }
  return isMarkupContent(contents)
    ? parseMarkdownHover(contents.value)
    : { documentation: null, signature: typeof contents === "string" ? contents : contents.value };
}

function parseMarkdownHover(value: string) {
  const text = value.trim();
  const blocks = Array.from(text.matchAll(/```[^\n]*\n([\s\S]*?)\n```/g));
  let selected = blocks[0];
  for (const block of blocks.slice(1)) {
    if (selected == null || text.slice((selected.index ?? 0) + selected[0].length, block.index).trim() !== "") break;
    selected = block;
  }
  if (selected == null) return { documentation: null, signature: text };
  return {
    documentation: text.slice((selected.index ?? 0) + selected[0].length).trim().replace(/^---(?:\r?\n|$)/, "").trim() || null,
    signature: selected[1].trim(),
  };
}

export const languageServerProtocolHelpers = {
  resolveCapabilities,
  filePathToUri,
  uriToFilePath,
  resolveLocations,
  normalizeHover,
};

if (typeof module !== "undefined") module.exports = languageServerProtocolHelpers;
