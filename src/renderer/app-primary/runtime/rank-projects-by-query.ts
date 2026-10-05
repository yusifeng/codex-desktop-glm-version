/** Rank projects by their best fuzzy-match score, omitting projects with no match. */
export function rankProjectsByQuery<T>(
  projects: readonly T[],
  query: string,
  scoreProject: (project: T) => readonly (number | null | undefined)[],
  scoreMatch: (value: number, query: string) => number,
): T[] {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) return [...projects];
  return projects
    .map((project, index) => ({ project, index, score: Math.max(...scoreProject(project).map((value) => value == null ? 0 : scoreMatch(value, normalizedQuery))) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ project }) => project);
}
