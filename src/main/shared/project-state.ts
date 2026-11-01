/** Canonical persisted local-project shape from the published shared chunk. */
export interface StoredLocalProject {
  id: string;
  name: string;
  rootPaths: string[];
  createdAt: number;
  updatedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === `object` && !Array.isArray(value);
}

function parseStoredLocalProject(value: unknown): StoredLocalProject | null {
  if (!isRecord(value)) return null;
  const { id, name, rootPaths, createdAt, updatedAt } = value;
  if (
    typeof id !== `string` ||
    typeof name !== `string` ||
    !Array.isArray(rootPaths) ||
    !rootPaths.every((root): root is string => typeof root === `string`) ||
    typeof createdAt !== `number` ||
    !Number.isFinite(createdAt) ||
    typeof updatedAt !== `number` ||
    !Number.isFinite(updatedAt)
  ) return null;
  return { id, name, rootPaths: [...rootPaths], createdAt, updatedAt };
}

/**
 * Parses the LOCAL_PROJECTS state record (published `iD`, export `qo`).
 * Invalid records and invalid individual entries are dropped; object-schema
 * unknown fields are stripped just as in the original Zod pipeline.
 */
export function parseLocalProjects(value: unknown): Record<string, StoredLocalProject> {
  if (!isRecord(value)) return {};
  const projects: Record<string, StoredLocalProject> = {};
  for (const [projectId, candidate] of Object.entries(value)) {
    const project = parseStoredLocalProject(candidate);
    if (project != null) projects[projectId] = project;
  }
  return projects;
}

export { parseLocalProjects as qo };
