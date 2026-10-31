// Artifact-template picker MCP config owner. Keeps executable discovery, skill
// filtering/deduplication and environment payload limits out of the main chunk.

const MAX_SKILLS = 100;
const MAX_ENV_BYTES = 24_000;
const MAX_DESCRIPTION_CODE_POINTS = 600;
const TEMPLATE_SKILL_NAME = /^(?:[^:]+:)?artifact-template-[a-z0-9][a-z0-9._-]*$/u;

export interface ArtifactTemplateSkill {
  description: string;
  enabled: boolean;
  interface?: { displayName?: string; shortDescription?: string } | null;
  name: string;
  path: string;
}

export function createArtifactTemplatePickerRuntime({
  existsSync,
  join,
  platform,
  resolveDevResourcesPath,
  resolveNodeExecutable,
}: {
  existsSync(path: string): boolean;
  join(...parts: string[]): string;
  platform: NodeJS.Platform;
  resolveDevResourcesPath(resourcesPath: string): string | null;
  resolveNodeExecutable(resourcesPath: string): string | null;
}) {
  const createConfig = ({
    artifactTemplateSkills,
    isPackaged,
    resourcesPath,
    shouldUseWslPaths,
  }: {
    artifactTemplateSkills?: ArtifactTemplateSkill[] | null;
    isPackaged: boolean;
    resourcesPath: string;
    shouldUseWslPaths: boolean;
  }) => {
    if (shouldUseWslPaths) return null;
    const runtimeResourcesPath = isPackaged ? resourcesPath : resolveDevResourcesPath(resourcesPath);
    if (runtimeResourcesPath == null) return null;
    const command = resolveNodeExecutable(runtimeResourcesPath);
    const serverPath = join(runtimeResourcesPath, "artifact-template-picker", "server.mjs");
    if (command == null || !existsSync(serverPath)) return null;
    const server = { command, args: [serverPath], env: {} as Record<string, string> };
    const skills = selectTemplateSkills(artifactTemplateSkills, platform);
    if (skills.length > 0) server.env.CODEX_ARTIFACT_TEMPLATE_SKILLS = JSON.stringify(skills);
    return { "mcp_servers.openai_artifact_template_picker": server };
  };

  return async function loadArtifactTemplatePickerConfig({
    appServerConnection,
    cwd,
    desktopFeatureAvailability,
    isPackaged,
    resourcesPath,
    shouldUseWslPaths,
  }: {
    appServerConnection: { listSkills(input: { cwds?: string[] }): Promise<{ data: Array<{ skills: ArtifactTemplateSkill[] }> }> };
    cwd?: string | null;
    desktopFeatureAvailability: { artifactTemplatePicker?: boolean };
    isPackaged: boolean;
    resourcesPath: string;
    shouldUseWslPaths: boolean;
  }) {
    if (!desktopFeatureAvailability.artifactTemplatePicker) return null;
    const base = { isPackaged, resourcesPath, shouldUseWslPaths };
    const fallback = createConfig(base);
    if (fallback == null) return null;
    const skills = await appServerConnection
      .listSkills(cwd == null ? {} : { cwds: [cwd] })
      .then((response) => response.data.flatMap((entry) => entry.skills))
      .catch(() => null);
    return skills == null ? fallback : createConfig({ ...base, artifactTemplateSkills: skills });
  };
}

export function selectTemplateSkills(skills: ArtifactTemplateSkill[] | null | undefined, platform: NodeJS.Platform) {
  if (skills == null) return [];
  const selected: Array<{ description: string; skillName: string; skillPath: string }> = [];
  const names = new Set<string>();
  const paths = new Set<string>();
  let payloadBytes = 2;
  for (const skill of [...skills]
    .filter((candidate) => candidate.enabled && TEMPLATE_SKILL_NAME.test(candidate.name))
    .sort((left, right) => templatePriority(left.name) - templatePriority(right.name))) {
    const normalizedPath = platform === "win32" ? skill.path.toLowerCase() : skill.path;
    if (names.has(skill.name) || paths.has(normalizedPath) || selected.length === MAX_SKILLS) continue;
    const item = {
      skillName: skill.name,
      skillPath: skill.path,
      description: Array.from(
        skill.description.trim() || skill.interface?.shortDescription?.trim() || skill.interface?.displayName?.trim() || skill.name,
      ).slice(0, MAX_DESCRIPTION_CODE_POINTS).join(""),
    };
    const itemBytes = Buffer.byteLength(JSON.stringify(item), "utf8") + Number(selected.length > 0);
    if (payloadBytes + itemBytes > MAX_ENV_BYTES) continue;
    selected.push(item);
    names.add(skill.name);
    paths.add(normalizedPath);
    payloadBytes += itemBytes;
  }
  return selected;
}

function templatePriority(name: string): number {
  return name.includes(":") ? (name.startsWith("openai-templates:") ? 2 : 1) : 0;
}
