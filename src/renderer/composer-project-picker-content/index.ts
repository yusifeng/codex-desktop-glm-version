// composer-project-picker-content —— Composer 的 cloud/local project 搜索与选择菜单。
// 原版：app/webview/assets/composer-project-picker-content-e81ba084d408.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export interface CloudProject { gizmo: { id: string; display: { name: string } } }
export interface LocalProject { id?: string; label: string; gitRepos: Array<{ rootFolder?: string }>; path?: string; hostDisplayName?: string }
export interface LocalProjectOptions { projects: LocalProject[]; onSelectProject(project: LocalProject): void }
export interface ComposerProjectPickerContentProps {
  cloudProjectsEnabled: boolean; isPending?: boolean; cloudIsLoading?: boolean; cloudIsError?: boolean;
  cloudProjects?: CloudProject[]; localProjectOptions?: LocalProjectOptions | null;
  projectId?: string | null; searchQuery: string; onSearchQueryChange(query: string): void;
  onCreateProject?(): void; onProjectChange(id: string | null, name: string | null): void;
  onSelectProject(id: string, name: string): void; onSelectLocalProject(): void; onClose(): void;
}

function matches(query: string, values: Array<string | undefined>): boolean {
  const needle = query.trim().toLowerCase();
  return needle.length === 0 || values.some((value) => value?.toLowerCase().includes(needle));
}

function ComposerProjectPickerContent(props: ComposerProjectPickerContentProps) {
  const cloud = props.cloudProjectsEnabled
    ? (props.cloudProjects ?? []).filter((project) => matches(props.searchQuery, [project.gizmo.display.name.trim(), project.gizmo.id]))
    : [];
  const local = (props.localProjectOptions?.projects ?? []).filter((project) =>
    matches(props.searchQuery, [project.label, project.gitRepos[0]?.rootFolder, project.path, project.hostDisplayName]));
  const status = props.cloudProjectsEnabled && props.cloudIsLoading
    ? "Loading projects…"
    : props.cloudProjectsEnabled && props.cloudIsError ? "Projects couldn't be loaded" : null;
  return {
    kind: "composer-project-picker-content" as const,
    searchQuery: props.searchQuery,
    status,
    hasProjectItems: cloud.length + local.length > 0,
    emptyMessage: props.localProjectOptions == null && props.searchQuery.trim().length === 0 ? "No projects" : undefined,
    cloudProjects: cloud.map((project) => {
      const name = project.gizmo.display.name.trim() || project.gizmo.id;
      return {
        id: project.gizmo.id, name, selected: project.gizmo.id === props.projectId,
        pending: project.gizmo.id === props.projectId && props.isPending === true,
        select: () => props.onSelectProject(project.gizmo.id, name),
      };
    }),
    localProjects: local.map((project) => ({
      project, selected: project.id != null && project.id === props.projectId,
      select: () => { props.localProjectOptions?.onSelectProject(project); props.onSelectLocalProject(); },
    })),
    createProject: props.onCreateProject == null ? null : () => { props.onCreateProject?.(); props.onClose(); },
    clearProject: props.projectId == null ? null : () => { props.onProjectChange(null, null); props.onClose(); },
    onSearchQueryChange: props.onSearchQueryChange,
  };
}

export { ComposerProjectPickerContent };
