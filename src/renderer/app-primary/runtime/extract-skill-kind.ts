/** Maps a skill/plugin path to the stable product kind used by the composer. */
const SKILL_KINDS: Readonly<Record<string, string>> = {
  documents: "document",
  presentations: "presentation",
  spreadsheets: "spreadsheet",
  sites: "site",
  "google-drive": "google-drive",
  "google-docs": "google-docs",
  "google-slides": "google-slides",
  "google-sheets": "google-sheets",
  "product-design": "product-design",
};

export function extractSkillKindFromPath(path: string | null | undefined): string | null {
  if (typeof path !== "string") return null;
  const normalized = path.toLowerCase().replaceAll("\\", "/");
  if (normalized.startsWith("plugin://")) {
    return SKILL_KINDS[normalized.slice("plugin://".length).split("@")[0]] ?? null;
  }
  const match = normalized.match(/(?:^|\/)skills\/(?:\.system\/)?([^/]+)\/skill\.md$/);
  return match == null ? null : SKILL_KINDS[match[1]] ?? null;
}

export interface SkillMentionNode {
  type: "skillMention" | "pluginMention" | string;
  attrs?: { path?: unknown };
}

export interface SkillMentionDocument {
  descendants(callback: (node: SkillMentionNode) => boolean): unknown;
}

/** Selects the most recent mention kind, while preferring an explicitly requested kind. */
export function extractSkillKindFromMentions(
  mentions: readonly SkillMentionNode[],
  preferred: string | null = null,
): string | null {
  let latest: string | null = null;
  for (const mention of mentions) {
    if (mention.type !== "skillMention" && mention.type !== "pluginMention") continue;
    const kind = extractSkillKindFromPath(typeof mention.attrs?.path === "string" ? mention.attrs.path : null);
    if (kind != null) latest = kind;
  }
  return preferred != null && latest === preferred ? preferred : latest ?? preferred;
}

/** Projects the latest skill/plugin mention kind from a ProseMirror-like document. */
export function extractSkillKindFromDocument(
  document: SkillMentionDocument,
  preferred: string | null = null,
): string | null {
  const mentions: SkillMentionNode[] = [];
  document.descendants((node) => {
    if (node.type === "skillMention" || node.type === "pluginMention") mentions.push(node);
    return true;
  });
  return extractSkillKindFromMentions(mentions, preferred);
}
