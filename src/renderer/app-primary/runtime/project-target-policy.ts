export interface ProjectTarget {
  kind: string;
}

export interface ProjectDescriptor {
  projectId: unknown;
  projectKind: string;
  gitRepos: readonly unknown[];
}

/** Resolve whether the selected creation target is backed by Git. */
export function isGitBackedProjectTarget(
  target: ProjectTarget,
  projects: readonly ProjectDescriptor[],
  selectedProjectId: unknown,
): boolean {
  if (selectedProjectId == null) return false;
  const project = projects.find((candidate) => candidate.projectId === selectedProjectId);
  return (project?.gitRepos.length ?? 0) > 0
    ? true
    : project != null && project.projectKind !== "local"
      ? false
      : target.kind === "git";
}
