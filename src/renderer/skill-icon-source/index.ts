import "@rchunk/rolldown-runtime";
import * as skillIconAssetsChunk from "@rchunk/text-bubble-figure-light";

const {
  V: defaultLight, U: defaultDark,
  E: boltLight, O: boltDark,
  G: chartLight, q: chartDark,
  n: chatLight, i: chatDark,
  L: codeLight, z: codeDark,
  u: cursorLight, f: cursorDark,
  N: heartLight, F: heartDark,
  k: hierarchyLight, j: hierarchyDark,
  v: pdfLight, b: pdfDark,
  m: penLight, g: penDark,
  o: radarLight, c: radarDark,
  S: searchLight, w: searchDark,
} = skillIconAssetsChunk;

interface SkillIconRecord {
  description: string;
  display_name?: string | null;
  icon_small?: string | null;
  iconography?: string | null;
  id: string;
  name: string;
  short_description?: string | null;
  updated_at: string;
}

const iconSources: Record<string, { dark: string; light: string }> = {
  default: { light: defaultLight, dark: defaultDark }, bolt: { light: boltLight, dark: boltDark },
  chart: { light: chartLight, dark: chartDark }, chat: { light: chatLight, dark: chatDark },
  code: { light: codeLight, dark: codeDark }, cursor: { light: cursorLight, dark: cursorDark },
  heart: { light: heartLight, dark: heartDark }, hierarchy: { light: hierarchyLight, dark: hierarchyDark },
  pdf: { light: pdfLight, dark: pdfDark }, pen: { light: penLight, dark: penDark },
  radar: { light: radarLight, dark: radarDark }, search: { light: searchLight, dark: searchDark },
};

function inlineSkillIcon(skill: SkillIconRecord): string | null {
  const icon = skill.icon_small?.trim();
  if (!icon) return null;
  if (icon.startsWith("data:")) return icon;
  const mediaType = icon.startsWith("PHN2Zy") || icon.startsWith("PD94bWw") ? "image/svg+xml"
    : icon.startsWith("/9j/") ? "image/jpeg"
      : icon.startsWith("R0lGOD") ? "image/gif"
        : icon.startsWith("UklGR") ? "image/webp" : "image/png";
  return `data:${mediaType};base64,${icon}`;
}

function sortSkillsByUpdatedAt(skills: SkillIconRecord[]): SkillIconRecord[] {
  return skills.toSorted((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at) || left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
}

function skillMatchesSearch(skill: SkillIconRecord, search: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replaceAll(/[-_\s]+/g, " ").trim();
  return normalize(`${skill.name} ${skill.display_name ?? ""} ${skill.description} ${skill.short_description ?? ""}`).includes(normalize(search));
}

function getBundledSkillIcon(skill: SkillIconRecord, dark: boolean): string {
  const source = iconSources[skill.iconography ?? "default"] ?? iconSources.default;
  return dark ? source.dark : source.light;
}

function getSkillIconUrl(skill: SkillIconRecord, dark: boolean): string {
  return new URL(inlineSkillIcon(skill) ?? getBundledSkillIcon(skill, dark), window.location.href).href;
}

function initializeSkillIconSource(): void {}
function initializeSkillIconAssets(): void {}

export { initializeSkillIconAssets as a, inlineSkillIcon as i, getSkillIconUrl as n, skillMatchesSearch as o, initializeSkillIconSource as r, sortSkillsByUpdatedAt as s, getBundledSkillIcon as t };
